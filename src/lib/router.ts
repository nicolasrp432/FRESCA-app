import { useSyncExternalStore } from "react";

/** Router por hash: funciona offline, en cualquier hosting estático y con el service worker */
export function getPath() {
  const h = typeof location === "undefined" ? "" : location.hash.replace(/^#/, "");
  return h || "/";
}
function subscribe(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
export function usePath() {
  return useSyncExternalStore(subscribe, getPath, () => "/");
}
export function navigate(to: string, replace = false) {
  const hash = to.startsWith("#") ? to : `#${to}`;
  if (replace) history.replaceState(history.state, "", hash);
  else history.pushState({ fresca: true }, "", hash);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}
export function back(fallback = "/hoy") {
  if ((history.state as { fresca?: boolean } | null)?.fresca) history.back();
  else navigate(fallback, true);
}
/** "/ficha/:kind" → { kind } */
export function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split("/").filter(Boolean);
  const a = path.split("?")[0].split("/").filter(Boolean);
  if (p.length !== a.length) return null;
  const out: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(":")) out[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return out;
}
export function query(path: string) {
  return new URLSearchParams(path.split("?")[1] ?? "");
}
