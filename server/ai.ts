import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";

const KINDS = ["banano", "papaya", "fresa", "mango", "tomate", "aguacate"] as const;
const MODEL = process.env.FRESCA_MODEL || "claude-opus-5-5";

let client: Anthropic | null = null;
export function aiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}
function getClient() {
  if (!client) client = new Anthropic({ maxRetries: 2, timeout: 60_000 });
  return client;
}

/* ── Reconocer lo que hay en la foto ───────────────────────── */

export const AnalysisSchema = z.object({
  items: z
    .array(
      z.object({
        kind: z.enum(KINDS).describe("Tipo de alimento"),
        count: z.number().int().min(1).describe("Cuántas unidades se ven. Fresas: número de bandejas o puñados (normalmente 1)."),
        stage: z.number().int().min(0).max(3).describe("0 fresco/verde, 1 en su punto, 2 muy maduro: úsalo ya, 3 pasado: revisar"),
        confidence: z.number().min(0).max(1).describe("Qué tan seguro estás del tipo de alimento"),
        alternative: z.enum(KINDS).nullable().describe("Si dudas, el otro alimento que podría ser; si no, null"),
        damage: z.enum(["ninguno", "moho", "liquido", "podrido"]).describe("Daño visible que obliga a descartar. Pintas, manchas o cáscara negra NO son daño."),
        note: z.string().describe("Una frase corta en español de Colombia, tuteando, sin la palabra 'error'"),
      }),
    )
    .describe("Alimentos reconocidos, de los seis que la app conoce"),
  others: z.array(z.string()).describe("Otras frutas o verduras que se ven pero no están en la lista, en español"),
  quality: z.enum(["buena", "oscura", "borrosa", "lejos", "sin_alimentos"]).describe("Calidad de la foto para reconocer alimentos"),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

const ANALYZE_SYSTEM = `Eres el ojo de FRESCA, una app colombiana que ayuda a no botar fruta y verdura.
Recibes una foto de lo que hay en el mesón o la nevera. Reconoce SOLO estos alimentos: banano, papaya, fresa, mango, tomate, aguacate.
Para cada uno estima su madurez con esta escala:
0 = fresco o verde, aguanta varios días
1 = en su punto, listo para comer
2 = muy maduro, úsalo hoy (pintas en el banano, papaya muy blanda, fresas opacas o blanditas, tomate blando)
3 = pasado, hay que revisarlo
Distingue madurez de daño: maduro no es dañado. Marca damage solo si ves moho, líquido saliendo o podredumbre clara.
Si la foto está oscura, borrosa o muy lejos y no puedes reconocer con seguridad, dilo en quality y deja items vacío.
Si un alimento podría ser otro (papaya o mango, por ejemplo), baja confidence y pon alternative.`;

export async function analyzeImage(base64: string, mediaType: "image/jpeg" | "image/png" | "image/webp"): Promise<Analysis> {
  const res = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(AnalysisSchema) },
    system: ANALYZE_SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: "¿Qué alimentos hay y en qué estado están?" },
        ],
      },
    ],
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) {
    return { items: [], others: [], quality: "sin_alimentos" };
  }
  return res.parsed_output;
}

/* ── Crear una receta con lo que hay ───────────────────────── */

export const IdeaSchema = z.object({
  name: z.string().describe("Nombre corto del plato, máximo 6 palabras"),
  minutes: z.number().int().min(1).max(240),
  difficulty: z.number().int().min(1).max(3),
  serves: z.string().describe("Rinde, p. ej. '2 vasos' o '4 porciones'"),
  tags: z.array(z.enum(["dulce", "salado", "rapido"])),
  dish: z.enum(["glass", "loaf", "pop", "jar", "pan", "bowl"]).describe("Forma del plato: vaso, pan, paleta, frasco, sartén o tazón"),
  color: z.string().describe("Color principal del plato en hex, p. ej. #F2844F"),
  ingredients: z.array(
    z.object({
      kind: z.enum(KINDS).nullable().describe("Si es uno de los seis alimentos de la canasta"),
      pantry: z.enum(["leche", "canela", "azucar", "harina", "huevo", "avena", "limon", "cebolla", "sal", "aceite", "yogur", "cilantro", "agua"]).nullable().describe("Si es de despensa"),
      qty: z.number().int().min(1).describe("Unidades del alimento de la canasta que consume (1 para despensa)"),
      label: z.string().describe("Cómo se lee, p. ej. '2 bananos' o '1 taza de leche'"),
    }),
  ),
  steps: z
    .array(
      z.object({
        action: z.enum(["cortar", "licuar", "hervir", "congelar", "mezclar", "hornear", "guardar", "servir"]),
        verb: z.string().describe("Un verbo en imperativo, tuteando: Corta, Licúa, Sirve…"),
        detail: z.string().describe("De dos a seis palabras"),
        note: z.string().describe("Una pista corta"),
        timer: z.number().int().nullable().describe("Segundos si el paso se cronometra, si no null"),
      }),
    )
    .min(2)
    .max(5),
});
export type Idea = z.infer<typeof IdeaSchema>;

const IDEA_SYSTEM = `Eres la cocina de FRESCA. Propones UNA receta casera colombiana, sencilla y segura, para rescatar la fruta o verdura que está por pasarse.
Usa sobre todo lo que se está pasando. Solo usa ingredientes de despensa de la lista permitida. Frases de dos a seis palabras, tuteando.
Nunca uses alimentos con daño. No inventes beneficios de salud.`;

export async function createIdea(input: { have: { kind: string; stage: number; qty: number }[]; pantry: string[]; avoid: string[] }): Promise<Idea | null> {
  const res = await getClient().beta.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(IdeaSchema) },
    system: IDEA_SYSTEM,
    messages: [
      {
        role: "user",
        content: `Lo que tengo (stage 2-3 = se está pasando):\n${JSON.stringify(input.have)}\nDespensa que tengo: ${input.pantry.join(", ") || "nada"}\nNo repitas estas recetas: ${input.avoid.join(", ") || "ninguna"}`,
      },
    ],
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) return null;
  return res.parsed_output;
}
