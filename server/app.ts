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
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
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

/* ── Reseñas y valoraciones de los usuarios ────────────────── */

export interface Review {
  id: string;
  userId?: string;
  userName: string;
  rating: number;
  comment: string;
  tags?: string[];
  createdAt: number;
}

const SEED_REVIEWS: Review[] = [
  {
    id: "rev_seed_1",
    userName: "Camila R.",
    rating: 5,
    comment: "¡Me encantó la app! Tenía 4 bananos maduros que iba a botar y FRESCA me dio la receta de pan de banano con lo que tenía en la alacena. Quedó delicioso.",
    tags: ["Recetas de rescate", "Ahorro de dinero"],
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: "rev_seed_2",
    userName: "David M.",
    rating: 5,
    comment: "El escáner con la cámara reconoció de una mis mangos y aguacates. El diseño es hermoso y las notificaciones a la hora elegida son súper útiles.",
    tags: ["Reconocimiento IA", "Avisos a tiempo", "Diseño hermoso"],
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
  },
  {
    id: "rev_seed_3",
    userName: "Valentina S.",
    rating: 5,
    comment: "Llevo dos semanas usándola y ya he rescatado más de 5 kg de fruta. Es súper fácil e intuitiva.",
    tags: ["Fácil e intuitiva", "Ahorro de dinero"],
    createdAt: Date.now() - 6 * 24 * 60 * 60 * 1000,
  },
];

function computeReviewStats(reviews: Review[]) {
  const total = reviews.length;
  if (total === 0) {
    return {
      total: 0,
      average: 5.0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const average = Number((sum / total).toFixed(1));
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    distribution[star] = (distribution[star] || 0) + 1;
  }
  return { total, average, distribution };
}

app.get("/api/reviews", async (c) => {
  const storage = getStorage(c);
  const raw = await storage.get("reviews:list");
  let list: Review[] = [];
  if (raw) {
    try {
      list = JSON.parse(raw);
    } catch {
      list = [];
    }
  }
  if (!list || list.length === 0) {
    list = SEED_REVIEWS;
    await storage.put("reviews:list", JSON.stringify(list)).catch(() => undefined);
  }
  const stats = computeReviewStats(list);
  return c.json({ ok: true, reviews: list, stats });
});

interface ReviewBody {
  rating?: number;
  comment?: string;
  tags?: string[];
  userName?: string;
  userId?: string;
}

app.post("/api/reviews", async (c) => {
  const body = ((await c.req.json<ReviewBody>().catch(() => ({}))) || {}) as ReviewBody;

  const ratingNum = Number(body.rating);
  if (!ratingNum || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return c.json({ error: "invalid_rating", message: "La calificación debe ser entre 1 y 5 estrellas." }, 400);
  }

  const rating = Math.min(5, Math.max(1, Math.round(ratingNum)));
  const userName = (body.userName || "").trim().slice(0, 50) || "Cocinero/a FRESCA";
  const comment = (body.comment || "").trim().slice(0, 1000);
  const tags = Array.isArray(body.tags)
    ? body.tags.slice(0, 8).map((t) => String(t).trim().slice(0, 30)).filter(Boolean)
    : [];

  const newReview: Review = {
    id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: body.userId || undefined,
    userName,
    rating,
    comment,
    tags,
    createdAt: Date.now(),
  };

  const storage = getStorage(c);
  const raw = await storage.get("reviews:list");
  let currentList: Review[] = [];
  if (raw) {
    try {
      currentList = JSON.parse(raw);
    } catch {
      currentList = [];
    }
  }
  if (!currentList || currentList.length === 0) {
    currentList = [...SEED_REVIEWS];
  }

  const updatedList = [newReview, ...currentList].slice(0, 200);
  await storage.put("reviews:list", JSON.stringify(updatedList));
  await storage.put(`review:${newReview.id}`, JSON.stringify(newReview));

  // Sincronización opcional con Supabase si las credenciales están configuradas
  const supabaseUrl =
    c.env?.SUPABASE_URL ||
    (typeof process !== "undefined" ? process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL : undefined);
  const supabaseKey =
    c.env?.SUPABASE_SERVICE_ROLE_KEY ||
    c.env?.SUPABASE_ANON_KEY ||
    (typeof process !== "undefined" ? process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY : undefined);

  if (supabaseUrl && supabaseKey) {
    fetch(`${supabaseUrl}/rest/v1/reviews`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        id: newReview.id,
        user_id: newReview.userId || null,
        user_name: newReview.userName,
        rating: newReview.rating,
        comment: newReview.comment,
        tags: newReview.tags,
        created_at: new Date(newReview.createdAt).toISOString(),
      }),
    }).catch((err) => {
      console.warn("[fresca] Error sincronizando reseña con Supabase:", err);
    });
  }

  const stats = computeReviewStats(updatedList);
  return c.json({ ok: true, review: newReview, stats });
});

app.delete("/api/reviews/:id", async (c) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "missing_id" }, 400);
  const storage = getStorage(c);
  const raw = await storage.get("reviews:list");
  if (raw) {
    try {
      const currentList: Review[] = JSON.parse(raw);
      const filtered = currentList.filter((r) => r.id !== id);
      await storage.put("reviews:list", JSON.stringify(filtered));
      await storage.delete(`review:${id}`);
      return c.json({ ok: true, stats: computeReviewStats(filtered) });
    } catch {
      // ignorar
    }
  }
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
