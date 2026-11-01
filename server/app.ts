import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { aiEnabled, analyzeImage, createIdea, AiError } from "./ai";

export type Env = {
  Bindings: {
    GEMINI_API_KEY?: string;
    GOOGLE_API_KEY?: string;
    OPENROUTER_API_KEY?: string;
    FRESCA_MODEL?: string;
  };
};

export const app = new Hono<Env>();

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
  return c.json({ ok: true, ai: aiEnabled(apiKey) });
});

app.post("/api/analyze", bodyLimit({ maxSize: 6 * 1024 * 1024 }), async (c) => {
  const { apiKey, model, provider } = getEnvConfig(c);
  if (!aiEnabled(apiKey)) return c.json({ error: "ai_off" }, 503);
  if (!allow(ipOf(c))) return c.json({ error: "rate" }, 429);
  const body = await c.req.json<{ image?: string; mediaType?: string }>().catch(() => ({}) as { image?: string; mediaType?: string });
  const mediaType = body.mediaType === "image/png" || body.mediaType === "image/webp" ? body.mediaType : "image/jpeg";
  const image = (body.image || "").replace(/^data:[^,]+,/, "");
  if (!image || image.length < 200) return c.json({ error: "bad_image" }, 400);
  try {
    return c.json(await analyzeImage(image, mediaType, { apiKey, model, provider }));
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
