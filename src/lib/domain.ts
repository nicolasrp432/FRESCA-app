import { CO2_PER_KG, FOODS, KINDS, STAGE_WORDS, type Kind, type Stage } from "../data/foods";

export const DAY = 24 * 60 * 60 * 1000;

export type ItemStatus = "open" | "used" | "tossed";
export type TossReason = "danio" | "tiempo" | "nosupe" | "demas";
export const REASONS: Record<TossReason, string> = {
  danio: "Se dañó",
  tiempo: "No me dio tiempo",
  nosupe: "No supe qué hacer",
  demas: "Compré de más",
};

export interface Item {
  id: string;
  kind: Kind;
  qty: number;
  addedAt: number;
  /** último estado conocido (por foto, por la persona o al agregar) */
  stage: Stage;
  stageAt: number;
  /** la persona confirmó el estado (más confiable que la estimación) */
  confirmed?: boolean;
  status: ItemStatus;
  closedAt?: number;
  reason?: TossReason;
}

export interface LogEvent {
  id: string;
  type: "rescued" | "tossed";
  kind: Kind;
  qty: number;
  grams: number;
  pesos: number;
  at: number;
  recipeId?: string;
  reason?: TossReason;
}

/** Estado estimado hoy: parte del último estado conocido y suma los días que tarda cada fase. */
export function currentStage(item: Pick<Item, "kind" | "stage" | "stageAt">, now = Date.now()): Stage {
  const days = FOODS[item.kind].days;
  let st = item.stage as number;
  let elapsed = Math.max(0, (now - item.stageAt) / DAY);
  while (st < 3 && elapsed >= days[st]) {
    elapsed -= days[st];
    st += 1;
  }
  return st as Stage;
}

/** Días que faltan para pasar al siguiente estado (0 si ya está en el último) */
export function daysToNext(item: Pick<Item, "kind" | "stage" | "stageAt">, now = Date.now()): number {
  const days = FOODS[item.kind].days;
  let st = item.stage as number;
  let elapsed = Math.max(0, (now - item.stageAt) / DAY);
  while (st < 3 && elapsed >= days[st]) {
    elapsed -= days[st];
    st += 1;
  }
  return st >= 3 ? 0 : Math.max(0, days[st] - elapsed);
}

export function ageLabel(at: number, now = Date.now()): string {
  const d = Math.floor((startOfDay(now) - startOfDay(at)) / DAY);
  if (d <= 0) return "hoy";
  if (d === 1) return "ayer";
  return `hace ${d} días`;
}

/** Frase corta para la bandeja de Hoy */
export function whenLabel(item: Item, now = Date.now()): string {
  const st = currentStage(item, now);
  const d = Math.floor((startOfDay(now) - startOfDay(item.addedAt)) / DAY);
  const left = daysToNext(item, now);
  if (st === 3) return "Revísalo antes de usarlo";
  if (st === 2) return d >= 2 ? `Lleva ${d} días en casa: hoy` : "Úsalo hoy";
  if (st === 1) return left < 1 ? "Listo hoy, mañana pide uso" : "Listo para comer";
  return left >= 2 ? `Aguanta unos ${Math.round(left)} días` : "Firme, aguanta unos días";
}

export function startOfDay(t: number) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Lunes de la semana de `t` */
export function startOfWeek(t: number) {
  const d = new Date(startOfDay(t));
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return d.getTime();
}

export const openItems = (items: Item[]) => items.filter((i) => i.status === "open");

/** Lo que va primero: más maduro arriba, luego lo más viejo */
export function byUrgency(items: Item[], now = Date.now()): Item[] {
  return [...items].sort((a, b) => currentStage(b, now) - currentStage(a, now) || daysToNext(a, now) - daysToNext(b, now) || a.addedAt - b.addedAt);
}

export const gramsOf = (kind: Kind, qty: number) => FOODS[kind].grams * qty;
export const pesosOf = (kind: Kind, qty: number) => FOODS[kind].pesos * qty;

export function eventFor(type: LogEvent["type"], kind: Kind, qty: number, extra: Partial<LogEvent> = {}, now = Date.now()): LogEvent {
  return { id: uid(), type, kind, qty, grams: gramsOf(kind, qty), pesos: pesosOf(kind, qty), at: now, ...extra };
}

export interface Stats {
  rescuedKg: number;
  tossedKg: number;
  pesos: number;
  co2: number;
  weekRescuedKg: number;
  weekTossedKg: number;
  level: number;
  levelName: string;
  nextLevelName: string | null;
  kgToNext: number;
  days: { label: string; rescued: number; tossed: number; today: boolean }[];
  star: { kind: Kind; count: number } | null;
  escape: { kind: Kind; count: number } | null;
}

export const LEVELS = [
  { name: "Semilla", kg: 0 },
  { name: "Brote", kg: 1 },
  { name: "Mata", kg: 3 },
  { name: "Huerta", kg: 6 },
  { name: "Cosecha", kg: 10 },
];

export function levelFor(kg: number) {
  let lvl = 0;
  LEVELS.forEach((l, i) => {
    if (kg >= l.kg) lvl = i;
  });
  return lvl;
}

export function computeStats(events: LogEvent[], now = Date.now()): Stats {
  const rescued = events.filter((e) => e.type === "rescued");
  const tossed = events.filter((e) => e.type === "tossed");
  const sum = (es: LogEvent[], f: (e: LogEvent) => number) => es.reduce((a, e) => a + f(e), 0);
  const rescuedKg = sum(rescued, (e) => e.grams) / 1000;
  const week0 = startOfWeek(now);
  const inWeek = (e: LogEvent) => e.at >= week0 && e.at < week0 + 7 * DAY;
  const level = levelFor(rescuedKg);
  const next = LEVELS[level + 1];
  const todayIdx = Math.floor((startOfDay(now) - week0) / DAY);
  const days = ["L", "M", "X", "J", "V", "S", "D"].map((label, i) => {
    const from = week0 + i * DAY;
    const within = (e: LogEvent) => e.at >= from && e.at < from + DAY;
    return {
      label,
      rescued: Math.round(sum(rescued.filter(within), (e) => e.grams) / 100),
      tossed: Math.round(sum(tossed.filter(within), (e) => e.grams) / 100),
      today: i === todayIdx,
    };
  });
  const top = (es: LogEvent[]) => {
    const c = new Map<Kind, number>();
    es.forEach((e) => c.set(e.kind, (c.get(e.kind) ?? 0) + e.qty));
    let best: { kind: Kind; count: number } | null = null;
    c.forEach((count, kind) => {
      if (!best || count > best.count) best = { kind, count };
    });
    return best as { kind: Kind; count: number } | null;
  };
  return {
    rescuedKg,
    tossedKg: sum(tossed, (e) => e.grams) / 1000,
    pesos: sum(rescued, (e) => e.pesos),
    co2: rescuedKg * CO2_PER_KG,
    weekRescuedKg: sum(rescued.filter(inWeek), (e) => e.grams) / 1000,
    weekTossedKg: sum(tossed.filter(inWeek), (e) => e.grams) / 1000,
    level,
    levelName: LEVELS[level].name,
    nextLevelName: next?.name ?? null,
    kgToNext: next ? Math.max(0, next.kg - rescuedKg) : 0,
    days,
    star: top(rescued),
    escape: top(tossed.filter((e) => e.at > now - 30 * DAY)),
  };
}

/** Consejos de compra: lo que se botó en los últimos 30 días */
export function buyLessTips(events: LogEvent[], now = Date.now()) {
  const c = new Map<Kind, number>();
  events
    .filter((e) => e.type === "tossed" && e.at > now - 30 * DAY)
    .forEach((e) => c.set(e.kind, (c.get(e.kind) ?? 0) + 1));
  return [...c.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([kind, times]) => ({
      kind,
      times,
      title: times > 1 ? `Botaste ${FOODS[kind].plural.toLowerCase()} ${times} veces` : `Se te pasó ${FOODS[kind].article === "una" ? "una" : "un"} ${FOODS[kind].name.toLowerCase()}`,
      tip: FOODS[kind].buyTip,
    }));
}

/** Agrupa lo que hay abierto por tipo (para "Ya tienes") */
export function haveByKind(items: Item[], now = Date.now()) {
  const m = new Map<Kind, { qty: number; stage: Stage }>();
  openItems(items).forEach((i) => {
    const prev = m.get(i.kind);
    const st = currentStage(i, now);
    m.set(i.kind, { qty: (prev?.qty ?? 0) + i.qty, stage: Math.max(prev?.stage ?? 0, st) as Stage });
  });
  return KINDS.filter((k) => m.has(k)).map((k) => ({ kind: k, ...m.get(k)! }));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export const fmtKg = (kg: number) => (Math.round(kg * 10) / 10).toFixed(1).replace(".", ",");
export const fmtPesos = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
export const stageWord = (s: Stage) => STAGE_WORDS[s];

export interface Notice {
  id: string;
  title: string;
  sub: string;
  at: number;
  href: string;
  kind?: Kind;
  stage?: Stage;
  plant?: boolean;
}

const HOURS = [7, 12, 17, 20];
export const HOUR_LABELS = ["7:00 a. m.", "12:00 m.", "5:00 p. m.", "8:00 p. m."];
export const hourOf = (idx: number) => HOURS[idx] ?? 7;

/** Avisos derivados de la canasta y del historial */
export function buildNotices(items: Item[], events: LogEvent[], ideaFor: (k: Kind) => string | null, now = Date.now()): Notice[] {
  const out: Notice[] = [];
  byUrgency(openItems(items), now).forEach((i) => {
    const st = currentStage(i, now);
    const f = FOODS[i.kind];
    const idea = ideaFor(i.kind);
    // momento estimado en que cruzó al estado actual
    const crossedAt = estimateCrossing(i, now);
    if (st === 3) out.push({ id: `rev-${i.id}`, title: `Revisa ${i.qty > 1 || i.kind === "fresa" ? "tus" : "tu"} ${(i.qty > 1 || i.kind === "fresa" ? f.plural : f.name).toLowerCase()}`, sub: `${relTime(crossedAt, now)} · Mira si tiene moho`, at: crossedAt, href: `#/ficha/${i.kind}`, kind: i.kind, stage: st });
    else if (st === 2) out.push({ id: `uso-${i.id}`, title: i.qty > 1 ? `${i.qty} ${f.plural.toLowerCase()} piden uso` : `Tu ${f.name.toLowerCase()}: úsalo hoy`, sub: `${relTime(crossedAt, now)}${idea ? ` · Idea: ${idea.toLowerCase()}` : ""}`, at: crossedAt, href: `#/ficha/${i.kind}`, kind: i.kind, stage: st });
    else if (st === 1 && i.stage === 0) out.push({ id: `pto-${i.id}`, title: `${f.article === "una" ? "La" : "El"} ${f.name.toLowerCase()} ya está en su punto`, sub: relTime(crossedAt, now), at: crossedAt, href: `#/ficha/${i.kind}`, kind: i.kind, stage: st });
  });
  // subidas de nivel en la huerta
  const sorted = [...events].filter((e) => e.type === "rescued").sort((a, b) => a.at - b.at);
  let kg = 0;
  sorted.forEach((e) => {
    const before = levelFor(kg);
    kg += e.grams / 1000;
    const after = levelFor(kg);
    if (after > before) out.push({ id: `lvl-${after}`, title: after === 1 ? "Tu matera sacó un brote" : `Tu huerta subió a ${LEVELS[after].name}`, sub: `${relTime(e.at, now)} · ${fmtKg(kg)} kg rescatados`, at: e.at, href: "#/huerta", plant: true });
  });
  return out.sort((a, b) => b.at - a.at).slice(0, 12);
}

function estimateCrossing(i: Item, now: number) {
  const days = FOODS[i.kind].days;
  const target = currentStage(i, now);
  let t = i.stageAt;
  for (let s = i.stage as number; s < target; s++) t += (days[s] ?? 0) * DAY;
  return Math.min(t, now);
}

export function relTime(at: number, now = Date.now()) {
  const diff = now - at;
  if (diff < 60 * 60 * 1000) return "Ahora";
  const d = Math.floor((startOfDay(now) - startOfDay(at)) / DAY);
  if (d === 0) {
    const h = new Date(at).getHours();
    return HOUR_LABELS[HOURS.indexOf(h)] ?? `Hoy, ${h > 12 ? h - 12 : h}:${String(new Date(at).getMinutes()).padStart(2, "0")} ${h >= 12 ? "p. m." : "a. m."}`;
  }
  if (d === 1) return "Ayer";
  return `Hace ${d} días`;
}
