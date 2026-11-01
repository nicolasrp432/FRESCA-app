import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import Anthropic from "@anthropic-ai/sdk";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { existsSync, readFileSync } from "node:fs";
import { aiEnabled, analyzeImage, createIdea } from "./ai";

// Carga .env sin dependencias extra
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const app = new Hono();

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
const ipOf = (c: { req: { header: (k: string) => string | undefined } }) => c.req.header("x-forwarded-for")?.split(",")[0].trim() || "local";

app.get("/api/health", (c) => c.json({ ok: true, ai: aiEnabled() }));

app.post("/api/analyze", bodyLimit({ maxSize: 6 * 1024 * 1024 }), async (c) => {
  if (!aiEnabled()) return c.json({ error: "ai_off" }, 503);
  if (!allow(ipOf(c))) return c.json({ error: "rate" }, 429);
  const body = await c.req.json<{ image?: string; mediaType?: string }>().catch(() => ({}) as { image?: string; mediaType?: string });
  const mediaType = body.mediaType === "image/png" || body.mediaType === "image/webp" ? body.mediaType : "image/jpeg";
  const image = (body.image || "").replace(/^data:[^,]+,/, "");
  if (!image || image.length < 200) return c.json({ error: "bad_image" }, 400);
  try {
    return c.json(await analyzeImage(image, mediaType));
  } catch (e) {
    return handleError(c, e);
  }
});

app.post("/api/idea", async (c) => {
  if (!aiEnabled()) return c.json({ error: "ai_off" }, 503);
  if (!allow(ipOf(c), 20)) return c.json({ error: "rate" }, 429);
  const body = await c.req.json<{ have?: { kind: string; stage: number; qty: number }[]; pantry?: string[]; avoid?: string[] }>().catch(() => ({}) as Record<string, never>);
  try {
    const idea = await createIdea({ have: (body.have ?? []).slice(0, 12), pantry: (body.pantry ?? []).slice(0, 20), avoid: (body.avoid ?? []).slice(0, 20) });
    if (!idea) return c.json({ error: "no_idea" }, 422);
    return c.json(idea);
  } catch (e) {
    return handleError(c, e);
  }
});

function handleError(c: { json: (b: unknown, s: 429 | 502 | 503) => Response }, e: unknown) {
  if (e instanceof Anthropic.RateLimitError) return c.json({ error: "busy" }, 429);
  if (e instanceof Anthropic.AuthenticationError) {
    console.error("[fresca] La clave de la API de Anthropic no es válida");
    return c.json({ error: "ai_off" }, 503);
  }
  if (e instanceof Anthropic.APIConnectionError) return c.json({ error: "upstream" }, 502);
  console.error("[fresca]", e);
  return c.json({ error: "upstream" }, 502);
}

/* En producción, sirve la app construida */
if (process.env.NODE_ENV === "production" && existsSync("dist")) {
  app.use("/*", serveStatic({ root: "./dist" }));
  app.get("*", serveStatic({ path: "./dist/index.html" }));
}

const port = Number(process.env.PORT) || 8787;
serve({ fetch: app.fetch, port }, () => {
  console.log(`[fresca] API en http://localhost:${port} · IA ${aiEnabled() ? "activa" : "apagada (falta ANTHROPIC_API_KEY)"}`);
});
