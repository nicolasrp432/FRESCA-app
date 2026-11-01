import * as z from "zod/v4";

const KINDS = ["banano", "papaya", "fresa", "mango", "tomate", "aguacate"] as const;
export type Kind = (typeof KINDS)[number];

export class AiError extends Error {
  constructor(public code: "busy" | "ai_off" | "upstream", message?: string) {
    super(message || code);
  }
}

export function aiEnabled(apiKey?: string) {
  if (apiKey) return true;
  if (typeof process !== "undefined") {
    return Boolean(
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.OPENROUTER_API_KEY
    );
  }
  return false;
}

export interface AiOptions {
  apiKey?: string;
  model?: string;
  provider?: "gemini" | "openrouter";
}

function resolveProvider(opts?: AiOptions): { provider: "gemini" | "openrouter"; apiKey: string; model: string } {
  const envGemini = typeof process !== "undefined" ? process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY : undefined;
  const envOpenRouter = typeof process !== "undefined" ? process.env.OPENROUTER_API_KEY : undefined;
  const envModel = typeof process !== "undefined" ? process.env.FRESCA_MODEL : undefined;

  let provider = opts?.provider;
  let apiKey = opts?.apiKey;

  if (!apiKey) {
    if (envGemini) {
      provider = "gemini";
      apiKey = envGemini;
    } else if (envOpenRouter) {
      provider = "openrouter";
      apiKey = envOpenRouter;
    }
  } else if (!provider) {
    // Si la clave empieza por sk-or- suele ser de OpenRouter, de lo contrario asumimos Gemini
    provider = apiKey.startsWith("sk-or-") ? "openrouter" : "gemini";
  }

  if (!apiKey || !provider) {
    throw new AiError("ai_off", "Falta clave de API (GEMINI_API_KEY o OPENROUTER_API_KEY)");
  }

  const model =
    opts?.model ||
    envModel ||
    (provider === "gemini" ? "gemini-2.5-flash" : "google/gemini-2.0-flash-exp:free");

  return { provider, apiKey, model };
}

/* ── Reconocer lo que hay en la foto ───────────────────────── */

export const AnalysisSchema = z.object({
  items: z
    .array(
      z.object({
        kind: z.enum(KINDS).describe("Tipo de alimento"),
        count: z.coerce.number().int().min(1).default(1).describe("Cuántas unidades se ven"),
        stage: z.coerce.number().int().min(0).max(3).default(1).describe("0 fresco/verde, 1 en su punto, 2 muy maduro: úsalo ya, 3 pasado: revisar"),
        confidence: z.coerce.number().min(0).max(1).default(0.9).describe("Qué tan seguro estás del tipo de alimento"),
        alternative: z.enum(KINDS).nullable().catch(null).describe("Si dudas, el otro alimento que podría ser; si no, null"),
        damage: z.enum(["ninguno", "moho", "liquido", "podrido"]).catch("ninguno").describe("Daño visible"),
        note: z.string().catch("Listo para aprovechar").describe("Una frase corta en español de Colombia, tuteando"),
      }),
    )
    .catch([])
    .describe("Alimentos reconocidos, de los seis que la app conoce"),
  others: z.array(z.string()).catch([]).describe("Otras frutas o verduras que se ven pero no están en la lista"),
  quality: z.enum(["buena", "oscura", "borrosa", "lejos", "sin_alimentos"]).catch("buena"),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

const ANALYZE_SYSTEM = `Eres el ojo de FRESCA, una app colombiana que ayuda a no botar fruta y verdura.
Recibes una foto de lo que hay en el mesón o la nevera. Reconoce SOLO estos alimentos permitidos: banano, papaya, fresa, mango, tomate, aguacate.

Para cada uno estima su madurez con esta escala:
0 = fresco o verde, aguanta varios días
1 = en su punto, listo para comer
2 = muy maduro, úsalo hoy (pintas en el banano, papaya muy blanda, fresas opacas o blanditas, tomate blando)
3 = pasado, hay que revisarlo

Distingue madurez de daño: maduro no es dañado. Marca damage solo si ves moho, líquido saliendo o podredumbre clara. Valores permitidos de damage: "ninguno", "moho", "liquido", "podrido".
Si la foto está oscura, borrosa o muy lejos y no puedes reconocer con seguridad, dilo en quality ("buena", "oscura", "borrosa", "lejos", "sin_alimentos") y deja items vacío.
Si un alimento podría ser otro (papaya o mango, por ejemplo), baja confidence y pon alternative (o null si no hay duda).
note: una frase corta en español de Colombia, tuteando, sin la palabra 'error'.

Responde ÚNICAMENTE en JSON con esta estructura exacta:
{
  "items": [
    {
      "kind": "banano" | "papaya" | "fresa" | "mango" | "tomate" | "aguacate",
      "count": 1,
      "stage": 0,
      "confidence": 0.95,
      "alternative": null,
      "damage": "ninguno",
      "note": "En su punto perfecto"
    }
  ],
  "others": [],
  "quality": "buena"
}`;

export async function analyzeImage(
  base64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
  opts?: AiOptions
): Promise<Analysis> {
  const { provider, apiKey, model } = resolveProvider(opts);
  let rawJson = "";

  try {
    if (provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: ANALYZE_SYSTEM }] },
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType: mediaType, data: base64 } },
                { text: "¿Qué alimentos hay y en qué estado están?" },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
          },
        }),
      });

      if (res.status === 429) throw new AiError("busy", "Límite de peticiones de Google AI Studio");
      if (res.status === 401 || res.status === 403) throw new AiError("ai_off", "Clave de API inválida de Google AI Studio");
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("[fresca gemini error]", res.status, errText);
        throw new AiError("upstream", `Error del servicio de IA: ${res.status}`);
      }

      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      // OpenRouter
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://fresca.app",
          "X-Title": "FRESCA",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: ANALYZE_SYSTEM },
            {
              role: "user",
              content: [
                { type: "text", text: "¿Qué alimentos hay y en qué estado están?" },
                { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64}` } },
              ],
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
      });

      if (res.status === 429) throw new AiError("busy", "Límite de peticiones de OpenRouter");
      if (res.status === 401 || res.status === 403) throw new AiError("ai_off", "Clave de API inválida de OpenRouter");
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("[fresca openrouter error]", res.status, errText);
        throw new AiError("upstream", `Error del servicio de IA: ${res.status}`);
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      rawJson = data.choices?.[0]?.message?.content || "";
    }

    if (!rawJson) return { items: [], others: [], quality: "sin_alimentos" };
    const parsedJson = parseJson(rawJson);
    const parsed = AnalysisSchema.safeParse(parsedJson);
    if (!parsed.success) {
      console.warn("[fresca] Error de validación en respuesta de IA:", parsed.error);
      return { items: [], others: [], quality: "sin_alimentos" };
    }
    return parsed.data;
  } catch (e) {
    if (e instanceof AiError) throw e;
    console.error("[fresca analyzeImage error]", e);
    throw new AiError("upstream");
  }
}

/* ── Crear una receta con lo que hay ───────────────────────── */

export const IdeaSchema = z.object({
  name: z.string().describe("Nombre corto del plato, máximo 6 palabras"),
  minutes: z.coerce.number().int().min(1).max(240).default(15),
  difficulty: z.coerce.number().int().min(1).max(3).default(1),
  serves: z.string().default("2 porciones").describe("Rinde, p. ej. '2 vasos' o '4 porciones'"),
  tags: z.array(z.enum(["dulce", "salado", "rapido"])).catch(["rapido"]),
  dish: z.enum(["glass", "loaf", "pop", "jar", "pan", "bowl"]).catch("bowl"),
  color: z.string().default("#F2844F"),
  ingredients: z.array(
    z.object({
      kind: z.enum(KINDS).nullable().catch(null),
      pantry: z
        .enum([
          "leche",
          "canela",
          "azucar",
          "harina",
          "huevo",
          "avena",
          "limon",
          "cebolla",
          "sal",
          "aceite",
          "yogur",
          "cilantro",
          "agua",
        ])
        .nullable()
        .catch(null),
      qty: z.coerce.number().int().min(1).default(1),
      label: z.string().default("Ingrediente"),
    }),
  ),
  steps: z
    .array(
      z.object({
        action: z
          .enum(["cortar", "licuar", "hervir", "congelar", "mezclar", "hornear", "guardar", "servir"])
          .catch("mezclar"),
        verb: z.string().default("Mezcla"),
        detail: z.string().default("los ingredientes"),
        note: z.string().catch("Listo"),
        timer: z.coerce.number().int().nullable().catch(null),
      }),
    )
    .min(1)
    .max(5),
});
export type Idea = z.infer<typeof IdeaSchema>;

const IDEA_SYSTEM = `Eres la cocina de FRESCA. Propones UNA receta casera colombiana, sencilla y segura, para rescatar la fruta o verdura que está por pasarse.
Usa sobre todo lo que se está pasando. Solo usa ingredientes de despensa de la lista permitida: "leche", "canela", "azucar", "harina", "huevo", "avena", "limon", "cebolla", "sal", "aceite", "yogur", "cilantro", "agua".
Frases de dos a seis palabras, tuteando. Nunca uses alimentos con daño. No inventes beneficios de salud.

Responde ÚNICAMENTE en JSON con esta estructura exacta:
{
  "name": "Nombre corto del plato (máx 6 palabras)",
  "minutes": 15,
  "difficulty": 1,
  "serves": "2 porciones",
  "tags": ["dulce" | "salado" | "rapido"],
  "dish": "glass" | "loaf" | "pop" | "jar" | "pan" | "bowl",
  "color": "#F2844F",
  "ingredients": [
    {
      "kind": "banano" | "papaya" | "fresa" | "mango" | "tomate" | "aguacate" | null,
      "pantry": "leche" | "canela" | ... | null,
      "qty": 2,
      "label": "2 bananos muy maduros"
    }
  ],
  "steps": [
    {
      "action": "cortar" | "licuar" | "hervir" | "congelar" | "mezclar" | "hornear" | "guardar" | "servir",
      "verb": "Pela y pica",
      "detail": "los bananos en rodajas",
      "note": "No importa que tengan pintas",
      "timer": null
    }
  ]
}`;

export async function createIdea(
  input: { have: { kind: string; stage: number; qty: number }[]; pantry: string[]; avoid: string[] },
  opts?: AiOptions
): Promise<Idea | null> {
  const { provider, apiKey, model } = resolveProvider(opts);
  let rawJson = "";
  const userPrompt = `Lo que tengo (stage 2-3 = se está pasando):\n${JSON.stringify(input.have)}\nDespensa que tengo: ${input.pantry.join(", ") || "nada"}\nNo repitas estas recetas: ${input.avoid.join(", ") || "ninguna"}`;

  try {
    if (provider === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: IDEA_SYSTEM }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
      });

      if (res.status === 429) throw new AiError("busy", "Límite de peticiones de Google AI Studio");
      if (res.status === 401 || res.status === 403) throw new AiError("ai_off", "Clave de API inválida de Google AI Studio");
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("[fresca gemini error]", res.status, errText);
        throw new AiError("upstream", `Error del servicio de IA: ${res.status}`);
      }

      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      // OpenRouter
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://fresca.app",
          "X-Title": "FRESCA",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: IDEA_SYSTEM },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });

      if (res.status === 429) throw new AiError("busy", "Límite de peticiones de OpenRouter");
      if (res.status === 401 || res.status === 403) throw new AiError("ai_off", "Clave de API inválida de OpenRouter");
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("[fresca openrouter error]", res.status, errText);
        throw new AiError("upstream", `Error del servicio de IA: ${res.status}`);
      }

      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      rawJson = data.choices?.[0]?.message?.content || "";
    }

    if (!rawJson) return null;
    const parsedJson = parseJson(rawJson);
    const parsed = IdeaSchema.safeParse(parsedJson);
    if (!parsed.success) {
      console.warn("[fresca] Error de validación en receta de IA:", parsed.error);
      return null;
    }
    return parsed.data;
  } catch (e) {
    if (e instanceof AiError) throw e;
    console.error("[fresca createIdea error]", e);
    throw new AiError("upstream");
  }
}

function parseJson(raw: string): unknown {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  return JSON.parse(cleaned);
}
