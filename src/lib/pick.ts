import { FOODS, type Kind } from "../data/foods";
import { RECIPES, type Recipe } from "../data/recipes";
import { byUrgency, currentStage, openItems, type Item } from "./domain";

/** La receta que mejor rescata un alimento: la más rápida del catálogo que lo usa */
export function recipeFor(kind: Kind, stage = 2, extra: Recipe[] = []): Recipe | null {
  const list = [...RECIPES, ...extra].filter((r) => r.saves.includes(kind));
  if (!list.length) return null;
  // muy maduro: preferir lo que lo aprovecha horneado o licuado; en su punto: lo más rápido
  return [...list].sort((a, b) => (stage >= 3 ? b.minutes - a.minutes : a.minutes - b.minutes) || Number(b.validated) - Number(a.validated))[0];
}

export function ideaName(kind: Kind) {
  return recipeFor(kind)?.name ?? null;
}

/** Ítems para el plato de Hoy, del más urgente al menos */
export function plateItems(items: Item[], now = Date.now(), n = 4) {
  return byUrgency(openItems(items), now).slice(0, n);
}

export function itemName(i: Pick<Item, "kind" | "qty">) {
  const f = FOODS[i.kind];
  return i.qty > 1 || i.kind === "fresa" ? f.plural : f.name;
}

/** ¿Por cuál alimento conviene preguntar? El más urgente que nadie ha confirmado */
export function askCandidate(items: Item[], now = Date.now()) {
  return byUrgency(openItems(items), now).find((i) => !i.confirmed && currentStage(i, now) <= 2) ?? null;
}
