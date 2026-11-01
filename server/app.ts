import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { aiEnabled, analyzeImage, createIdea, AiError } from "./ai";

export interface KvLike {
  get(k: string): Promise<string | null>;
  put(k: string, v: string): Promise<void>;
  delete(k: string): Promise<void>;
}

export type Env = {
  Bindings: {
    GEMINI_API_KEY?: string;
    GOOGLE_API_KEY?: string;
    OPENROUTER_API_KEY?: string;
    FRESCA_MODEL?: string;
    FRESCA_KV?: KvLike;
    AI?: {
      run(model: string, input: Record<string, unknown>): Promise<any>;
    };
  };
};

export const app = new Hono<Env>();

app.get("/api/ai/gen-image", async (c) => {
  const prompt = c.req.query("prompt");
  if (!prompt) return c.text("missing prompt", 400);
  if (!c.env?.AI) return c.text("no AI binding", 503);
  try {
    const response = await c.env.AI.run("@cf/bytedance/stable-diffusion-xl-lightning", {
      prompt,
    });
    return new Response(response, {
      headers: { "Content-Type": "image/jpeg" },
    });
  } catch (e: any) {
    return c.text(e?.message || "error", 500);
  }
});

/* Memoria de respaldo en caso de que KV no esté vinculado aún */
const memoryStore = new Map<string, string>();

function getStorage(c: { env?: Env["Bindings"] }): KvLike {
  const kv = c.env?.FRESCA_KV;
  if (kv && typeof kv.get === "function" && typeof kv.put === "function") {
    return kv;
  }
  return {
    get: async (k) => memoryStore.get(k) ?? null,
    put: async (k, v) => {
      memoryStore.set(k, v);
    },
    delete: async (k) => {
      memoryStore.delete(k);
    },
  };
}

/* Límite sencillo por IP: protege la cuenta de la API de abusos */
const hits = new Map<string, { n: number; at: number }>();
function allow(ip: string, max = 30, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.at > windowMs) {
    hits.set(ip, { n: 1, at: now });
    return true;
  }
  h.n += 1;
  return h.n <= max;
}

const ipOf = (c: { req: { header: (k: string) => string | undefined } }) =>
  c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for")?.split(",")[0].trim() || "local";

function getEnvConfig(c: { env?: Env["Bindings"] }) {
  const geminiKey =
    c.env?.GEMINI_API_KEY ||
    c.env?.GOOGLE_API_KEY ||
    (typeof process !== "undefined" ? process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY : undefined);
  const openrouterKey =
    c.env?.OPENROUTER_API_KEY ||
    (typeof process !== "undefined" ? process.env.OPENROUTER_API_KEY : undefined);
  const model =
    c.env?.FRESCA_MODEL ||
    (typeof process !== "undefined" ? process.env.FRESCA_MODEL : undefined);

  const apiKey = geminiKey || openrouterKey;
  const provider = geminiKey ? ("gemini" as const) : openrouterKey ? ("openrouter" as const) : undefined;
  return { apiKey, model, provider };
}

app.get("/api/health", (c) => {
  const { apiKey } = getEnvConfig(c);
  return c.json({ ok: true, ai: aiEnabled(apiKey), cloudflare: true });
});

/* ── Persistencia y registro en Cloudflare ──────────────────── */

interface RegisterBody {
  phone?: string;
  name?: string;
  people?: number;
  hour?: number;
}

interface LoginBody {
  phone?: string;
  userId?: string;
}

interface SaveBody {
  userId?: string;
  state?: {
    updatedAt?: number;
    [key: string]: unknown;
  };
}

app.post("/api/auth/register", async (c) => {
  const body = (await c.req.json<RegisterBody>().catch(() => ({}))) as RegisterBody;
  const phoneDigits = (body.phone || "").replace(/\D/g, "");
  const storage = getStorage(c);

  let userId = "";
  if (phoneDigits) {
    userId = (await storage.get(`phone:${phoneDigits}`)) || "";
  }
  if (!userId) {
    userId = `cf_usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (phoneDigits) await storage.put(`phone:${phoneDigits}`, userId);
  }

  const userProfile = {
    userId,
    phone: body.phone || "",
    name: body.name || "",
    people: body.people || 3,
    hour: body.hour || 0,
    registeredAt: Date.now(),
  };
  await storage.put(`user:${userId}`, JSON.stringify(userProfile));
  return c.json({ ok: true, userId, profile: userProfile });
});

app.post("/api/auth/login", async (c) => {
  const body = (await c.req.json<LoginBody>().catch(() => ({}))) as LoginBody;
  const storage = getStorage(c);
  let userId = body.userId;
  if (!userId && body.phone) {
    const p = body.phone.replace(/\D/g, "");
    userId = (await storage.get(`phone:${p}`)) || undefined;
  }
  if (!userId) {
    userId = `cf_usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    if (body.phone) await storage.put(`phone:${body.phone.replace(/\D/g, "")}`, userId);
  }

  const stateRaw = await storage.get(`state:${userId}`);
  const state = stateRaw ? JSON.parse(stateRaw) : null;
  return c.json({ ok: true, userId, state });
});

app.post("/api/state/save", async (c) => {
  const body = (await c.req.json<SaveBody>().catch(() => ({}))) as SaveBody;
  if (!body.userId || !body.state) return c.json({ error: "bad_request" }, 400);
  const storage = getStorage(c);
  body.state.updatedAt = Date.now();
  await storage.put(`state:${body.userId}`, JSON.stringify(body.state));
  return c.json({ ok: true, savedAt: body.state.updatedAt });
});

app.get("/api/state/load", async (c) => {
  const userId = c.req.query("userId");
  if (!userId) return c.json({ error: "missing_userId" }, 400);
  const storage = getStorage(c);
  const stateRaw = await storage.get(`state:${userId}`);
  const state = stateRaw ? JSON.parse(stateRaw) : null;
  return c.json({ ok: true, state });
});

app.delete("/api/state/delete", async (c) => {
  const userId = c.req.query("userId");
  if (!userId) return c.json({ error: "missing_userId" }, 400);
  const storage = getStorage(c);
  await storage.delete(`state:${userId}`);
  await storage.delete(`user:${userId}`);
  return c.json({ ok: true });
});

/* ── Visión con IA y recetas ───────────────────────────────── */

app.post("/api/analyze", bodyLimit({ maxSize: 6 * 1024 * 1024 }), async (c) => {
  const { apiKey, model, provider } = getEnvConfig(c);
  if (!allow(ipOf(c), 60)) return c.json({ error: "rate" }, 429);
  const body = (await c.req.json<{ image?: string; mediaType?: string; meta?: any }>().catch(() => ({}))) as {
    image?: string;
    mediaType?: string;
    meta?: any;
  };
  const mediaType = body.mediaType === "image/png" || body.mediaType === "image/webp" ? body.mediaType : "image/jpeg";
  const image = (body.image || "").replace(/^data:[^,]+,/, "");
  if (!image || image.length < 50) return c.json({ error: "bad_image" }, 400);
  try {
    const analysis = await analyzeImage(image, mediaType, {
      apiKey,
      model,
      provider,
      cfAi: c.env?.AI,
      meta: body.meta,
    });
    return c.json(analysis);
  } catch (e) {
    return handleError(c, e);
  }
});

app.post("/api/idea", async (c) => {
  const { apiKey, model, provider } = getEnvConfig(c);
  if (!aiEnabled(apiKey)) return c.json({ error: "ai_off" }, 503);
  if (!allow(ipOf(c), 20)) return c.json({ error: "rate" }, 429);
  const body = await c.req.json<{ have?: { kind: string; stage: number; qty: number }[]; pantry?: string[]; avoid?: string[] }>().catch(() => ({}) as Record<string, never>);
  try {
    const idea = await createIdea(
      { have: (body.have ?? []).slice(0, 12), pantry: (body.pantry ?? []).slice(0, 20), avoid: (body.avoid ?? []).slice(0, 20) },
      { apiKey, model, provider }
    );
    if (!idea) return c.json({ error: "no_idea" }, 422);
    return c.json(idea);
  } catch (e) {
    return handleError(c, e);
  }
});

function handleError(c: { json: (b: unknown, s: 429 | 502 | 503) => Response }, e: unknown) {
  if (e instanceof AiError) {
    if (e.code === "busy") return c.json({ error: "busy" }, 429);
    if (e.code === "ai_off") {
      console.error("[fresca] Clave de IA inválida o no configurada:", e.message);
      return c.json({ error: "ai_off" }, 503);
    }
    return c.json({ error: "upstream" }, 502);
  }
  console.error("[fresca error]", e);
  return c.json({ error: "upstream" }, 502);
}

export default app;
