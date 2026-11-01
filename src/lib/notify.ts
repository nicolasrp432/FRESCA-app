import { FOODS } from "../data/foods";
import { RECIPES } from "../data/recipes";
import { actions, getState } from "../state/store";
import { byUrgency, currentStage, hourOf, openItems } from "./domain";

export const notifSupported = () => typeof window !== "undefined" && "Notification" in window;

export async function askPermission(): Promise<NotificationPermission> {
  if (!notifSupported()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

const today = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);

/** Arma el aviso del día: "Hoy úsalo: 2 bananos · Perfectos para un batido." */
export function dailyMessage(now = Date.now()) {
  const s = getState();
  const urgent = byUrgency(openItems(s.items), now).filter((i) => currentStage(i, now) >= 2);
  if (!urgent.length) return null;
  const first = urgent[0];
  const f = FOODS[first.kind];
  const recipe = RECIPES.find((r) => r.saves.includes(first.kind));
  const what = first.qty > 1 ? `${first.qty} ${f.plural.toLowerCase()}` : f.name.toLowerCase();
  if (s.profile.flags.uno && urgent.length > 1) {
    const rest = urgent.slice(1, 3).map((i) => FOODS[i.kind].name.toLowerCase());
    return { title: `Hoy úsalo: ${what}`, body: `También ${rest.join(" y ")}.${recipe ? ` Idea: ${recipe.name.toLowerCase()}.` : ""}`, url: "#/hoy", kind: first.kind };
  }
  return { title: `Hoy úsalo: ${what}`, body: recipe ? `Perfectos para ${recipe.name.toLowerCase().startsWith("batido") ? "un batido" : recipe.name.toLowerCase()}.` : "Míralo en FRESCA.", url: "#/hoy", kind: first.kind };
}

async function show(msg: { title: string; body: string; url: string }) {
  const reg = await navigator.serviceWorker?.getRegistration().catch(() => undefined);
  const opts: NotificationOptions & { actions?: { action: string; title: string }[] } = {
    body: msg.body,
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: "fresca-diario",
    data: { url: msg.url },
    actions: [{ action: "ver", title: "Ver la idea" }],
  };
  if (reg) await reg.showNotification(msg.title, opts);
  else new Notification(msg.title, opts);
}

/**
 * Revisa si toca el aviso del día. Corre al abrir la app, cada minuto mientras está abierta
 * y desde el service worker con Periodic Background Sync donde el navegador lo permite.
 */
export async function checkDaily(now = Date.now()) {
  const s = getState();
  if (!s.profile.onboarded || !s.profile.flags.notif || !notifSupported() || Notification.permission !== "granted") return false;
  if (s.lastNotifiedDay === today(now)) return false;
  if (new Date(now).getHours() < hourOf(s.profile.hour)) return false;
  const msg = dailyMessage(now);
  if (!msg) return false;
  actions.markNotified(today(now));
  await show(msg);
  return true;
}

export function startScheduler() {
  checkDaily();
  const id = window.setInterval(() => checkDaily(), 60_000);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && checkDaily());
  return () => window.clearInterval(id);
}

export async function registerSW() {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    // Periodic Background Sync (Chrome/Android instalada): el SW abre la app para revisar
    const ps = (reg as ServiceWorkerRegistration & { periodicSync?: { register: (t: string, o: { minInterval: number }) => Promise<void> } }).periodicSync;
    if (ps) await ps.register("fresca-diario", { minInterval: 6 * 60 * 60 * 1000 }).catch(() => undefined);
  } catch {
    /* sin SW: la app sigue funcionando */
  }
}

/**
 * Deja listo el aviso del día para que el service worker lo muestre aunque la app esté cerrada
 * (el SW no puede leer localStorage; Cache Storage sí).
 */
export async function publishDailySnapshot() {
  if (!("caches" in window)) return;
  const s = getState();
  const msg = s.profile.onboarded && s.profile.flags.notif ? dailyMessage() : null;
  try {
    const c = await caches.open("fresca-meta");
    await c.put("/__daily", new Response(JSON.stringify({ msg, hour: hourOf(s.profile.hour), lastDay: s.lastNotifiedDay }), { headers: { "content-type": "application/json" } }));
  } catch {
    /* nada */
  }
}
