export const KINDS = ["banano", "papaya", "fresa", "mango", "tomate", "aguacate", "limon", "zanahoria"] as const;
export type Kind = (typeof KINDS)[number];
export type Stage = 0 | 1 | 2 | 3;

export const STAGE_WORDS = ["Fresco", "En su punto", "Úsalo ya", "Revisar"] as const;
export const STAGE_COLORS = ["#6FAE57", "#E9B530", "#E2702E", "#C2412F"] as const;

export interface Food {
  kind: Kind;
  name: string;
  plural: string;
  /** "un banano", "una papaya" */
  article: "un" | "una";
  /** gramos por unidad (o por bandeja, en fresas) */
  grams: number;
  /** precio orientativo por unidad en pesos colombianos */
  pesos: number;
  /** días que tarda en pasar de un estado al siguiente (0→1, 1→2, 2→3) a temperatura ambiente */
  days: [number, number, number];
  /** nombres de los estados de madurez para la ficha */
  stageNames: [string, string, string, string];
  storage: { title: string; tip: string };
  nutrition: { label: string; per: string; values: { v: string; u: string }[] };
  /** qué hacer según el estado */
  ideas: [{ t: string; m: string }[], { t: string; m: string }[], { t: string; m: string }[], { t: string; m: string }[]];
  /** señales normales (sirve) y de descarte */
  normal: { stage: Stage; label: string }[];
  discard: ("moho" | "liquido" | "agrio")[];
  /** guardar para después (escalera del rescate, paso 2) */
  save: { icon: "congelar" | "mermelada" | "nevera" | "salsa"; label: string }[];
  /** consejo de compra cuando se bota seguido */
  buyTip: string;
  /** verbo de compra para la huerta: "Compra fresas para 3 días" */
  buyLess: string;
}

export const FOODS: Record<Kind, Food> = {
  banano: {
    kind: "banano", name: "Banano", plural: "Bananos", article: "un", grams: 120, pesos: 500,
    days: [3, 2, 2],
    stageNames: ["Verde", "En su punto", "Con pintas", "Muy maduro"],
    storage: { title: "En el frutero, fuera de la nevera", tip: "¿Muy maduro? Congélalo pelado." },
    nutrition: { label: "1 mediano", per: "Orientativo · 1 mediano", values: [{ v: "3 g", u: "fibra" }, { v: "420", u: "mg potasio" }, { v: "10", u: "mg vit. C" }, { v: "105", u: "kcal" }] },
    ideas: [
      [{ t: "Para la lonchera", m: "Ya" }, { t: "Con avena", m: "5 min" }],
      [{ t: "Cómelo así", m: "Ya" }, { t: "Batido", m: "5 min" }],
      [{ t: "Batido", m: "5 min" }, { t: "Paletas", m: "10 min" }],
      [{ t: "Pan de banano", m: "1 h" }, { t: "Congélalo pelado", m: "2 min" }],
    ],
    normal: [{ stage: 2, label: "Pintas" }, { stage: 1, label: "Blando" }, { stage: 3, label: "Cáscara negra" }],
    discard: ["moho", "liquido", "agrio"],
    save: [{ icon: "congelar", label: "Congela en rodajas" }, { icon: "mermelada", label: "Mermelada" }],
    buyTip: "Compra un racimo con unos verdes.",
    buyLess: "Compra bananos para 4 días",
  },
  papaya: {
    kind: "papaya", name: "Papaya", plural: "Papayas", article: "una", grams: 1200, pesos: 5000,
    days: [3, 2, 2],
    stageNames: ["Firme", "En su punto", "Muy madura", "Pasada"],
    storage: { title: "Fuera hasta que ceda al tacto", tip: "Abierta, en la nevera tapada: 2 días." },
    nutrition: { label: "1 taza", per: "Orientativo · 1 taza", values: [{ v: "2,5 g", u: "fibra" }, { v: "260", u: "mg potasio" }, { v: "88", u: "mg vit. C" }, { v: "62", u: "kcal" }] },
    ideas: [
      [{ t: "Déjala madurar", m: "2 días" }, { t: "Ensalada verde", m: "15 min" }],
      [{ t: "Cómela así", m: "Ya" }, { t: "Con limón", m: "2 min" }],
      [{ t: "Jugo con fresa", m: "5 min" }, { t: "Paletas", m: "10 min" }],
      [{ t: "Mermelada", m: "40 min" }, { t: "Congélala en cubos", m: "5 min" }],
    ],
    normal: [{ stage: 2, label: "Manchas" }, { stage: 1, label: "Cede al tacto" }, { stage: 3, label: "Muy blanda" }],
    discard: ["moho", "liquido", "agrio"],
    save: [{ icon: "congelar", label: "Congela en cubos" }, { icon: "mermelada", label: "Mermelada" }],
    buyTip: "Mejor una pequeña, o media.",
    buyLess: "Compra papaya pequeña",
  },
  fresa: {
    kind: "fresa", name: "Fresas", plural: "Fresas", article: "una", grams: 250, pesos: 4000,
    days: [1, 1, 1],
    stageNames: ["Firmes", "En su punto", "Blanditas", "Con moho"],
    storage: { title: "En la nevera, sin lavar", tip: "Lávalas justo antes de comer." },
    nutrition: { label: "1 taza", per: "Orientativo · 1 taza", values: [{ v: "3 g", u: "fibra" }, { v: "230", u: "mg potasio" }, { v: "85", u: "mg vit. C" }, { v: "50", u: "kcal" }] },
    ideas: [
      [{ t: "Con yogur", m: "2 min" }, { t: "Así no más", m: "Ya" }],
      [{ t: "Cómelas así", m: "Ya" }, { t: "Con avena", m: "5 min" }],
      [{ t: "Jugo con papaya", m: "5 min" }, { t: "Mermelada", m: "40 min" }],
      [{ t: "Revisa una a una", m: "2 min" }, { t: "A la compostera", m: "1 min" }],
    ],
    normal: [{ stage: 2, label: "Blanditas" }, { stage: 1, label: "Opacas" }, { stage: 2, label: "Arrugadas" }],
    discard: ["moho", "liquido", "agrio"],
    save: [{ icon: "congelar", label: "Congela enteras" }, { icon: "mermelada", label: "Mermelada" }],
    buyTip: "Mejor media libra.",
    buyLess: "Compra fresas para 3 días",
  },
  mango: {
    kind: "mango", name: "Mango", plural: "Mangos", article: "un", grams: 300, pesos: 1500,
    days: [3, 2, 2],
    stageNames: ["Verde", "En su punto", "Muy maduro", "Pasado"],
    storage: { title: "Afuera hasta que huela dulce", tip: "Ya maduro, a la nevera: 4 días más." },
    nutrition: { label: "1 taza", per: "Orientativo · 1 taza", values: [{ v: "2,6 g", u: "fibra" }, { v: "280", u: "mg potasio" }, { v: "60", u: "mg vit. C" }, { v: "99", u: "kcal" }] },
    ideas: [
      [{ t: "Con sal y limón", m: "2 min" }, { t: "Déjalo madurar", m: "2 días" }],
      [{ t: "Cómelo así", m: "Ya" }, { t: "Jugo", m: "5 min" }],
      [{ t: "Jugo", m: "5 min" }, { t: "Paletas", m: "10 min" }],
      [{ t: "Mermelada", m: "40 min" }, { t: "Congélalo en cubos", m: "5 min" }],
    ],
    normal: [{ stage: 2, label: "Pintas" }, { stage: 1, label: "Cede al tacto" }, { stage: 3, label: "Arrugado" }],
    discard: ["moho", "liquido", "agrio"],
    save: [{ icon: "congelar", label: "Congela en cubos" }, { icon: "mermelada", label: "Mermelada" }],
    buyTip: "Lleva dos y uno verde.",
    buyLess: "Compra mangos de a dos",
  },
  tomate: {
    kind: "tomate", name: "Tomate", plural: "Tomates", article: "un", grams: 120, pesos: 400,
    days: [4, 3, 2],
    stageNames: ["Firme", "En su punto", "Blando", "Pasado"],
    storage: { title: "Afuera, con el tallo abajo", tip: "Blandos, mejor en hogao o salsa." },
    nutrition: { label: "1 mediano", per: "Orientativo · 1 mediano", values: [{ v: "1,5 g", u: "fibra" }, { v: "290", u: "mg potasio" }, { v: "17", u: "mg vit. C" }, { v: "22", u: "kcal" }] },
    ideas: [
      [{ t: "Ensalada", m: "5 min" }, { t: "Con sal", m: "Ya" }],
      [{ t: "Ensalada", m: "5 min" }, { t: "Guacamole", m: "10 min" }],
      [{ t: "Hogao", m: "15 min" }, { t: "Salsa", m: "20 min" }],
      [{ t: "Hogao", m: "15 min" }, { t: "Congela la salsa", m: "5 min" }],
    ],
    normal: [{ stage: 2, label: "Blando" }, { stage: 3, label: "Arrugado" }, { stage: 1, label: "Muy rojo" }],
    discard: ["moho", "liquido", "agrio"],
    save: [{ icon: "salsa", label: "Hogao para la semana" }, { icon: "congelar", label: "Congela la salsa" }],
    buyTip: "Compra de a cuatro.",
    buyLess: "Compra tomates de a cuatro",
  },
  aguacate: {
    kind: "aguacate", name: "Aguacate", plural: "Aguacates", article: "un", grams: 250, pesos: 2500,
    days: [3, 2, 2],
    stageNames: ["Duro", "En su punto", "Muy blando", "Pasado"],
    storage: { title: "Afuera hasta que ceda", tip: "En su punto, a la nevera: 3 días más." },
    nutrition: { label: "½ aguacate", per: "Orientativo · ½ aguacate", values: [{ v: "7 g", u: "fibra" }, { v: "490", u: "mg potasio" }, { v: "10", u: "mg vit. C" }, { v: "160", u: "kcal" }] },
    ideas: [
      [{ t: "Déjalo madurar", m: "2 días" }, { t: "Junto a un banano", m: "1 día" }],
      [{ t: "Guacamole", m: "10 min" }, { t: "En tostada", m: "5 min" }],
      [{ t: "Guacamole", m: "10 min" }, { t: "Batido", m: "5 min" }],
      [{ t: "Revisa por dentro", m: "1 min" }, { t: "A la compostera", m: "1 min" }],
    ],
    normal: [{ stage: 2, label: "Muy blando" }, { stage: 1, label: "Cede al tacto" }, { stage: 2, label: "Cáscara oscura" }],
    discard: ["moho", "liquido", "agrio"],
    save: [{ icon: "nevera", label: "A la nevera entero" }, { icon: "congelar", label: "Congela en puré" }],
    buyTip: "Uno en su punto y uno duro.",
    buyLess: "Compra aguacates de a uno",
  },
  limon: {
    kind: "limon", name: "Limón", plural: "Limones", article: "un", grams: 80, pesos: 600,
    days: [4, 4, 3],
    stageNames: ["Fresco", "Jugoso", "Piel seca", "Pasado"],
    storage: { title: "En la nevera en bolsa o frasco", tip: "Cortado: tapa la mitad con plástico o boca abajo en un plato." },
    nutrition: { label: "1 limón", per: "Orientativo · 1 mediano", values: [{ v: "2,8 g", u: "fibra" }, { v: "116", u: "mg potasio" }, { v: "31", u: "mg vit. C" }, { v: "17", u: "kcal" }] },
    ideas: [
      [{ t: "Limonada fresca", m: "5 min" }, { t: "Aderezo para ensalada", m: "2 min" }],
      [{ t: "Con sal y mango", m: "2 min" }, { t: "Para el guacamole", m: "5 min" }],
      [{ t: "Ralla la cáscara", m: "2 min" }, { t: "Té caliente con miel", m: "5 min" }],
      [{ t: "Desinfectante casero", m: "10 min" }, { t: "A la compostera", m: "1 min" }],
    ],
    normal: [{ stage: 2, label: "Piel seca" }, { stage: 1, label: "Firme y brillante" }, { stage: 3, label: "Blando o arrugado" }],
    discard: ["moho", "liquido", "agrio"],
    save: [{ icon: "congelar", label: "Congela en cubos de jugo" }, { icon: "nevera", label: "En frasco con agua" }],
    buyTip: "Compra limones pesados para su tamaño.",
    buyLess: "Compra limones de a tres",
  },
  zanahoria: {
    kind: "zanahoria", name: "Zanahoria", plural: "Zanahorias", article: "una", grams: 110, pesos: 600,
    days: [6, 4, 3],
    stageNames: ["Firme y crujiente", "En su punto", "Algo flexible", "Pasada"],
    storage: { title: "En el cajón de la nevera", tip: "¿Algo flexible? Sumérgela en agua fría 30 min y recupera su textura crocante." },
    nutrition: { label: "1 mediana", per: "Orientativo · 1 mediana", values: [{ v: "2,2 g", u: "fibra" }, { v: "320", u: "mg potasio" }, { v: "6", u: "mg vit. C" }, { v: "25", u: "kcal" }] },
    ideas: [
      [{ t: "Bastones con limón", m: "2 min" }, { t: "Rallada en ensalada", m: "5 min" }],
      [{ t: "Salteada con arroz", m: "10 min" }, { t: "Sopa campesina", m: "20 min" }],
      [{ t: "Crema de zanahoria", m: "25 min" }, { t: "Jugo de zanahoria", m: "5 min" }],
      [{ t: "Torta de zanahoria", m: "50 min" }, { t: "A la compostera", m: "1 min" }],
    ],
    normal: [{ stage: 1, label: "Firme" }, { stage: 2, label: "Flexible" }, { stage: 2, label: "Puntas secas" }, { stage: 3, label: "Blanda o arrugada" }],
    discard: ["moho", "liquido", "agrio"],
    save: [{ icon: "congelar", label: "Congela en rodajas o cubos" }, { icon: "nevera", label: "En frasco con agua en la nevera" }],
    buyTip: "Elige zanahorias firmes, lisas y sin manchas oscuras.",
    buyLess: "Compra zanahorias para la semana",
  },
};

export const isKind = (k: unknown): k is Kind => typeof k === "string" && (KINDS as readonly string[]).includes(k);

/** kg de CO₂e evitados por kg de fruta que no se bota (orientativo) */
export const CO2_PER_KG = 0.83;
