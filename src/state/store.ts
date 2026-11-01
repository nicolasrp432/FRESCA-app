import { useSyncExternalStore } from "react";
import type { Kind, Stage } from "../data/foods";
import { DEFAULT_PANTRY, type Recipe } from "../data/recipes";
import { eventFor, uid, type Item, type LogEvent, type TossReason, currentStage } from "../lib/domain";

export interface Flags {
  notif: boolean;
  uno: boolean;
  rm: boolean;
  big: boolean;
}

export interface Profile {
  name: string;
  phone: string;
  people: number;
  hour: number;
  flags: Flags;
  onboarded: boolean;
  account: "guest" | "account";
  userId?: string;
  avatar?: string;
}

export interface AppState {
  v: 1;
  profile: Profile;
  items: Item[];
  events: LogEvent[];
  pantry: string[];
  /** recetas creadas con IA (aún sin validar) */
  generated: Recipe[];
  seenNoticesAt: number;
  lastNotifiedDay: string;
  updatedAt: number;
}

const KEY = "fresca:v1";

export const initialState = (): AppState => ({
  v: 1,
  profile: { name: "", phone: "", people: 3, hour: 0, flags: { notif: true, uno: true, rm: false, big: false }, onboarded: false, account: "guest" },
  items: [],
  events: [],
  pantry: [...DEFAULT_PANTRY],
  generated: [],
  seenNoticesAt: 0,
  lastNotifiedDay: "",
  updatedAt: Date.now(),
});

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const base = initialState();
    return { ...base, ...parsed, profile: { ...base.profile, ...parsed.profile, flags: { ...base.profile.flags, ...parsed.profile?.flags } } } as AppState;
  } catch {
    return initialState();
  }
}

let state: AppState = typeof localStorage === "undefined" ? initialState() : load();
const listeners = new Set<() => void>();
const changeHooks = new Set<(s: AppState) => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* almacenamiento lleno o bloqueado: la app sigue en memoria */
  }
}

export function getState() {
  return state;
}

export function setState(fn: (s: AppState) => AppState, opts: { silent?: boolean } = {}) {
  state = { ...fn(state), updatedAt: Date.now() };
  persist();
  listeners.forEach((l) => l());
  if (!opts.silent) changeHooks.forEach((h) => h(state));
}

/** Reemplaza todo (al bajar la copia de la nube) sin volver a subirla */
export function replaceState(next: AppState) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

export function onChange(h: (s: AppState) => void) {
  changeHooks.add(h);
  return () => changeHooks.delete(h);
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(sel: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state), () => sel(state));
}

/* ── Acciones ───────────────────────────────────── */

export const actions = {
  updateProfile(p: Partial<Profile>) {
    setState((s) => ({ ...s, profile: { ...s.profile, ...p } }));
  },
  setFlag(k: keyof Flags, v: boolean) {
    setState((s) => ({ ...s, profile: { ...s.profile, flags: { ...s.profile.flags, [k]: v } } }));
  },

  /** Agrega a la canasta; si ya hay del mismo tipo y estado, suma cantidad */
  addItems(list: { kind: Kind; qty: number; stage?: Stage; confirmed?: boolean }[], now = Date.now()) {
    setState((s) => {
      const items = [...s.items];
      list.forEach(({ kind, qty, stage = 0, confirmed }) => {
        if (qty <= 0) return;
        const same = items.find((i) => i.status === "open" && i.kind === kind && currentStage(i, now) === stage && now - i.addedAt < 60 * 60 * 1000);
        if (same) {
          const idx = items.indexOf(same);
          items[idx] = { ...same, qty: same.qty + qty };
        } else {
          items.push({ id: uid(), kind, qty, addedAt: now, stage, stageAt: now, confirmed, status: "open" });
        }
      });
      return { ...s, items };
    });
  },

  /** La persona corrige o confirma el estado de un alimento */
  setStage(itemId: string, stage: Stage, now = Date.now()) {
    setState((s) => ({ ...s, items: s.items.map((i) => (i.id === itemId ? { ...i, stage, stageAt: now, confirmed: true } : i)) }));
  },

  /** Lo usé: todo el ítem (o una parte) pasa a rescatado */
  useItem(itemId: string, qty?: number, recipeId?: string, now = Date.now()) {
    setState((s) => closeItem(s, itemId, "used", qty, { recipeId }, now));
  },

  tossItem(itemId: string, reason: TossReason, qty?: number, now = Date.now()) {
    setState((s) => closeItem(s, itemId, "tossed", qty, { reason }, now));
  },

  /** Registra algo que se botó sin estar en la canasta (p. ej. la fresa con moho del escaneo) */
  logToss(kind: Kind, qty: number, reason: TossReason, now = Date.now()) {
    setState((s) => ({ ...s, events: [...s.events, eventFor("tossed", kind, qty, { reason }, now)] }));
  },

  /** Cocinar una receta consume de la canasta lo que pide (lo más maduro primero) */
  cookRecipe(recipe: Recipe, now = Date.now()) {
    let rescued = { grams: 0, pesos: 0 };
    setState((s) => {
      let next = s;
      recipe.ingredients.forEach((ing) => {
        if (!ing.kind) return;
        let need = ing.qty;
        const candidates = next.items
          .filter((i) => i.status === "open" && i.kind === ing.kind)
          .sort((a, b) => currentStage(b, now) - currentStage(a, now) || a.addedAt - b.addedAt);
        for (const c of candidates) {
          if (need <= 0) break;
          const take = Math.min(need, c.qty);
          next = closeItem(next, c.id, "used", take, { recipeId: recipe.id }, now);
          need -= take;
        }
      });
      const added = next.events.slice(s.events.length);
      rescued = { grams: added.reduce((a, e) => a + e.grams, 0), pesos: added.reduce((a, e) => a + e.pesos, 0) };
      return next;
    });
    return rescued;
  },

  togglePantry(key: string) {
    setState((s) => ({ ...s, pantry: s.pantry.includes(key) ? s.pantry.filter((p) => p !== key) : [...s.pantry, key] }));
  },

  saveGenerated(r: Recipe) {
    setState((s) => ({ ...s, generated: [r, ...s.generated.filter((g) => g.id !== r.id)].slice(0, 10) }));
  },

  markNoticesSeen(now = Date.now()) {
    setState((s) => ({ ...s, seenNoticesAt: now }), { silent: true });
  },

  markNotified(day: string) {
    setState((s) => ({ ...s, lastNotifiedDay: day }), { silent: true });
  },

  signOut() {
    setState((s) => ({ ...s, profile: { ...s.profile, account: "guest", userId: undefined, onboarded: false } }));
  },

  wipe() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* nada */
    }
    replaceState(initialState());
  },
};

function closeItem(s: AppState, itemId: string, status: "used" | "tossed", qty: number | undefined, extra: Partial<LogEvent>, now: number): AppState {
  const it = s.items.find((i) => i.id === itemId);
  if (!it || it.status !== "open") return s;
  const take = Math.min(qty ?? it.qty, it.qty);
  const ev = eventFor(status === "used" ? "rescued" : "tossed", it.kind, take, extra, now);
  let items: Item[];
  if (take >= it.qty) {
    items = s.items.map((i) => (i.id === itemId ? { ...i, status, closedAt: now, reason: extra.reason } : i));
  } else {
    items = s.items.map((i) => (i.id === itemId ? { ...i, qty: i.qty - take } : i));
  }
  return { ...s, items, events: [...s.events, ev] };
}
