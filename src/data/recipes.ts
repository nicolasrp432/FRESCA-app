import type { Action } from "../ui/Icons";
import type { Dish } from "../ui/Illustrations";
import type { Kind } from "./foods";

export type Tag = "dulce" | "salado" | "rapido";

export interface Ingredient {
  /** si es un alimento de la canasta */
  kind?: Kind;
  /** clave de despensa (leche, canela…) */
  pantry?: string;
  qty: number;
  label: string;
}

export interface Step {
  action: Action;
  verb: string;
  detail: string;
  note?: string;
  /** segundos de temporizador, si el paso lo necesita */
  timer?: number;
  /** alimentos que aparecen en la ilustración del paso */
  show?: Kind[];
}

export interface Recipe {
  id: string;
  name: string;
  time: string;
  minutes: number;
  difficulty: 1 | 2 | 3;
  serves: string;
  tags: Tag[];
  saves: Kind[];
  dish: Dish;
  color: string;
  topping?: string;
  /** validada por Nutrición (catálogo) o generada con IA */
  validated: boolean;
  ingredients: Ingredient[];
  steps: Step[];
}

export const PANTRY: Record<string, { name: string; color: string }> = {
  leche: { name: "Leche", color: "#FFFDF6" },
  canela: { name: "Canela", color: "#9A5A2E" },
  azucar: { name: "Azúcar", color: "#F6EEDC" },
  harina: { name: "Harina", color: "#F4EBD8" },
  huevo: { name: "Huevo", color: "#F6DE9A" },
  avena: { name: "Avena", color: "#EADBB8" },
  limon: { name: "Limón", color: "#A9CF5A" },
  cebolla: { name: "Cebolla", color: "#E8D7E0" },
  sal: { name: "Sal", color: "#FFFFFF" },
  aceite: { name: "Aceite", color: "#F2D27E" },
  yogur: { name: "Yogur", color: "#FBF7EF" },
  cilantro: { name: "Cilantro", color: "#6FAE57" },
  agua: { name: "Agua", color: "#DDEEF2" },
};

/** Lo que casi toda casa tiene: arranca marcado como "lo tienes" */
export const DEFAULT_PANTRY = ["leche", "azucar", "sal", "aceite", "agua", "huevo", "cebolla", "limon"];

export const RECIPES: Recipe[] = [
  {
    id: "batido-banano", name: "Batido de banano", time: "5 min", minutes: 5, difficulty: 1, serves: "1 vaso",
    tags: ["dulce", "rapido"], saves: ["banano"], dish: "glass", color: "#F4D27E", validated: true,
    ingredients: [
      { kind: "banano", qty: 2, label: "2 bananos" },
      { pantry: "leche", qty: 1, label: "1 taza de leche" },
      { pantry: "canela", qty: 1, label: "Canela" },
    ],
    steps: [
      { action: "cortar", verb: "Corta", detail: "2 bananos en rodajas", note: "≈ 240 g", show: ["banano"] },
      { action: "licuar", verb: "Licúa", detail: "1 min", note: "con la taza de leche", timer: 60 },
      { action: "servir", verb: "Sirve", detail: "1 vaso", note: "frío está mejor" },
    ],
  },
  {
    id: "pan-banano", name: "Pan de banano", time: "1 h", minutes: 60, difficulty: 2, serves: "1 molde",
    tags: ["dulce"], saves: ["banano"], dish: "loaf", color: "#B8743A", validated: true,
    ingredients: [
      { kind: "banano", qty: 3, label: "3 bananos muy maduros" },
      { pantry: "harina", qty: 1, label: "2 tazas de harina" },
      { pantry: "huevo", qty: 2, label: "2 huevos" },
      { pantry: "azucar", qty: 1, label: "½ taza de azúcar" },
    ],
    steps: [
      { action: "mezclar", verb: "Machaca", detail: "3 bananos con tenedor", note: "entre más maduros, mejor", show: ["banano"] },
      { action: "mezclar", verb: "Mezcla", detail: "con huevos, azúcar y harina", note: "sin batir de más" },
      { action: "hornear", verb: "Hornea", detail: "50 min a 180 °C", note: "un palillo sale limpio", timer: 3000 },
    ],
  },
  {
    id: "jugo-papaya-fresa", name: "Jugo de papaya y fresa", time: "5 min", minutes: 5, difficulty: 1, serves: "2 vasos",
    tags: ["dulce", "rapido"], saves: ["papaya", "fresa"], dish: "glass", color: "#F2844F", validated: true,
    ingredients: [
      { kind: "papaya", qty: 1, label: "½ papaya" },
      { kind: "fresa", qty: 1, label: "Fresas" },
      { pantry: "agua", qty: 1, label: "2 vasos de agua" },
    ],
    steps: [
      { action: "cortar", verb: "Pica", detail: "papaya y fresas", note: "quita las hojitas", show: ["papaya", "fresa"] },
      { action: "licuar", verb: "Licúa", detail: "1 min", note: "con el agua", timer: 60 },
      { action: "servir", verb: "Sirve", detail: "2 vasos", note: "sin colar: más fibra" },
    ],
  },
  {
    id: "paletas-papaya", name: "Paletas de papaya", time: "10 min", minutes: 10, difficulty: 1, serves: "6 paletas",
    tags: ["dulce", "rapido"], saves: ["papaya"], dish: "pop", color: "#F28C5B", validated: true,
    ingredients: [
      { kind: "papaya", qty: 1, label: "½ papaya madura" },
      { pantry: "limon", qty: 1, label: "1 limón" },
    ],
    steps: [
      { action: "licuar", verb: "Licúa", detail: "la papaya con limón", note: "queda espeso", timer: 45, show: ["papaya"] },
      { action: "servir", verb: "Llena", detail: "los moldes", note: "deja un dedo libre" },
      { action: "congelar", verb: "Congela", detail: "4 horas", note: "y listo para la tarde" },
    ],
  },
  {
    id: "mermelada-fresa", name: "Mermelada de fresa", time: "40 min", minutes: 40, difficulty: 2, serves: "1 frasco",
    tags: ["dulce"], saves: ["fresa"], dish: "jar", color: "#C8323A", validated: true,
    ingredients: [
      { kind: "fresa", qty: 1, label: "1 bandeja de fresas" },
      { pantry: "azucar", qty: 1, label: "½ taza de azúcar" },
      { pantry: "limon", qty: 1, label: "½ limón" },
    ],
    steps: [
      { action: "cortar", verb: "Pica", detail: "las fresas", note: "quita lo dañado", show: ["fresa"] },
      { action: "hervir", verb: "Cocina", detail: "30 min a fuego bajo", note: "con azúcar y limón", timer: 1800 },
      { action: "guardar", verb: "Envasa", detail: "en frasco limpio", note: "dura 3 semanas en nevera" },
    ],
  },
  {
    id: "hogao", name: "Hogao", time: "15 min", minutes: 15, difficulty: 1, serves: "4 porciones",
    tags: ["salado", "rapido"], saves: ["tomate"], dish: "pan", color: "#D2382E", validated: true,
    ingredients: [
      { kind: "tomate", qty: 3, label: "3 tomates blandos" },
      { pantry: "cebolla", qty: 1, label: "1 cebolla larga" },
      { pantry: "aceite", qty: 1, label: "Aceite" },
      { pantry: "sal", qty: 1, label: "Sal" },
    ],
    steps: [
      { action: "cortar", verb: "Pica", detail: "tomate y cebolla", note: "en cubitos", show: ["tomate"] },
      { action: "hervir", verb: "Sofríe", detail: "12 min", note: "a fuego medio, revolviendo", timer: 720 },
      { action: "guardar", verb: "Guarda", detail: "lo que sobre", note: "nevera: 4 días" },
    ],
  },
  {
    id: "guacamole", name: "Guacamole", time: "10 min", minutes: 10, difficulty: 1, serves: "4 porciones",
    tags: ["salado", "rapido"], saves: ["aguacate", "tomate", "limon"], dish: "bowl", color: "#8FB45A", topping: "#E24A36", validated: true,
    ingredients: [
      { kind: "aguacate", qty: 2, label: "2 aguacates" },
      { kind: "tomate", qty: 1, label: "1 tomate" },
      { kind: "limon", qty: 1, label: "1 limón" },
      { pantry: "cilantro", qty: 1, label: "Cilantro" },
    ],
    steps: [
      { action: "mezclar", verb: "Machaca", detail: "2 aguacates", note: "con limón y sal", show: ["aguacate", "limon"] },
      { action: "cortar", verb: "Pica", detail: "tomate y cilantro", note: "bien finito", show: ["tomate"] },
      { action: "mezclar", verb: "Mezcla", detail: "todo", note: "pruébalo de sal" },
    ],
  },
  {
    id: "limonada-casera", name: "Limonada fresca", time: "5 min", minutes: 5, difficulty: 1, serves: "2 vasos",
    tags: ["dulce", "rapido"], saves: ["limon"], dish: "glass", color: "#C6E872", validated: true,
    ingredients: [
      { kind: "limon", qty: 2, label: "2 limones jugosos" },
      { pantry: "agua", qty: 1, label: "2 vasos de agua fría" },
      { pantry: "azucar", qty: 1, label: "2 cucharadas de panela o azúcar" },
    ],
    steps: [
      { action: "cortar", verb: "Corta", detail: "los limones por la mitad", note: "guarda las cáscaras", show: ["limon"] },
      { action: "licuar", verb: "Licúa", detail: "el zumo con agua y panela", note: "o revuelve con cuchara", timer: 30 },
      { action: "servir", verb: "Sirve", detail: "con hielo al gusto", note: "ralla un poco de cáscara encima" },
    ],
  },
  {
    id: "avena-banano", name: "Avena con banano", time: "10 min", minutes: 10, difficulty: 1, serves: "1 tazón",
    tags: ["dulce", "rapido"], saves: ["banano", "fresa"], dish: "bowl", color: "#EADBB8", topping: "#C8323A", validated: false,
    ingredients: [
      { kind: "banano", qty: 1, label: "1 banano" },
      { kind: "fresa", qty: 1, label: "Unas fresas" },
      { pantry: "avena", qty: 1, label: "½ taza de avena" },
      { pantry: "leche", qty: 1, label: "1 taza de leche" },
    ],
    steps: [
      { action: "hervir", verb: "Cocina", detail: "la avena 5 min", note: "con la leche", timer: 300 },
      { action: "cortar", verb: "Corta", detail: "banano y fresas", note: "en rodajas", show: ["banano", "fresa"] },
      { action: "servir", verb: "Sirve", detail: "1 tazón", note: "la fruta encima" },
    ],
  },
];

export const recipeById = (id: string, extra: Recipe[] = []) => [...RECIPES, ...extra].find((r) => r.id === id);
