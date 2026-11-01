import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { existsSync, readFileSync } from "node:fs";
import { aiEnabled } from "./ai";
import app from "./app";

// Carga .env sin dependencias extra
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

/* En producción con Node, sirve la app construida */
if (process.env.NODE_ENV === "production" && existsSync("dist")) {
  app.use("/*", serveStatic({ root: "./dist" }));
  app.get("*", serveStatic({ path: "./dist/index.html" }));
}

const port = Number(process.env.PORT) || 8787;
serve({ fetch: app.fetch, port }, () => {
  console.log(`[fresca] API en http://localhost:${port} · IA ${aiEnabled() ? "activa" : "apagada (falta GEMINI_API_KEY o OPENROUTER_API_KEY)"}`);
});
