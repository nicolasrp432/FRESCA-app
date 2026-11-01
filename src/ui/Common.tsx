import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { back, navigate } from "../lib/router";
import { IconBack, IconClose, IconScan } from "./Icons";

export const C = {
  tinta: "#1F2A1E",
  suave: "#5E685A",
  media: "#4E574B",
  hoja: "#2F6B3A",
  hojaClaro: "#EAF1E6",
  papaya: "#F28C5B",
  bandeja: "#F4EDE1",
  plato: "#F1E5D1",
  peligro: "#A8331F",
};

export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function BackButton({ to, label = "Volver", close, onClick, style }: { to?: string; label?: string; close?: boolean; onClick?: () => void; style?: CSSProperties }) {
  return (
    <button
      className="press"
      aria-label={label}
      onClick={onClick ?? (() => (to ? navigate(to) : back()))}
      style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", ...style }}
    >
      {close ? <IconClose /> : <IconBack />}
    </button>
  );
}

type Tab = "hoy" | "canasta" | "recetas" | "huerta" | null;

const NAV_ICONS: Record<Exclude<Tab, null>, ReactNode> = {
  hoy: <><path d="M7 17 A 5 5 0 0 1 17 17 Z" /><path d="M3 17 L 21 17 M12 5 L 12 8 M5.5 9.5 L 7 11 M18.5 9.5 L 17 11" /></>,
  canasta: <><path d="M4 10 L 20 10 L 18.4 18.4 A 2 2 0 0 1 16.4 20 L 7.6 20 A 2 2 0 0 1 5.6 18.4 Z" /><path d="M8 10 L 11 4 M16 10 L 13 4 M9 14 L 9 16.5 M12 14 L 12 16.5 M15 14 L 15 16.5" /></>,
  recetas: <><path d="M4 12 L 20 12 A 8 8 0 0 1 4 12 Z" /><path d="M9 8.5 C 9 6.8, 10.5 6.6, 10.5 5 M14 8.5 C 14 6.8, 15.5 6.6, 15.5 5" /></>,
  huerta: <><path d="M12 21 L 12 12" fill="none" /><path d="M12 12 C 12 8, 9 6, 5 6 C 5 10, 8 12, 12 12 Z" /><path d="M12 10 C 12 7, 15 5, 19 5 C 19 8, 16 10, 12 10 Z" /></>,
};
const NAV_LABEL = { hoy: "Hoy", canasta: "Canasta", recetas: "Recetas", huerta: "Huerta" };

function NavLink({ tab, active }: { tab: Exclude<Tab, null>; active: boolean }) {
  return (
    <a
      href={`#/${tab}`}
      aria-current={active ? "page" : undefined}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minHeight: 56, justifyContent: "center", color: active ? C.hoja : C.suave, transform: active ? "translateY(-2px)" : undefined }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill={active ? "rgba(47,107,58,.16)" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {NAV_ICONS[tab]}
      </svg>
      <span style={{ fontSize: 12, fontWeight: active ? 700 : 600 }}>{NAV_LABEL[tab]}</span>
      {active && <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: "50%", background: "#E9B530" }} />}
    </a>
  );
}

export function BottomNav({ active }: { active: Tab }) {
  return (
    <nav
      aria-label="Principal"
      style={{
        position: "absolute", left: 14, right: 14, bottom: "calc(18px + env(safe-area-inset-bottom))", height: 72, borderRadius: 28,
        background: "rgba(255,255,255,0.86)", backdropFilter: "blur(18px) saturate(160%)", WebkitBackdropFilter: "blur(18px) saturate(160%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.9), 0 16px 30px -14px rgba(110,74,30,.45)",
        display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", alignItems: "center", zIndex: 5,
      }}
    >
      <NavLink tab="hoy" active={active === "hoy"} />
      <NavLink tab="canasta" active={active === "canasta"} />
      <a
        href="#/escanear"
        className="press"
        aria-label="Escanear lo que tienes"
        style={{
          justifySelf: "center", width: 70, height: 70, marginTop: -34, borderRadius: "50%", background: C.papaya, color: C.tinta,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 12px 22px -8px rgba(226,112,46,.8), inset 0 2px 0 rgba(255,255,255,.35), inset 0 -4px 0 rgba(150,60,20,.18), 0 0 0 6px #FBF7EF",
        }}
      >
        <IconScan />
      </a>
      <NavLink tab="recetas" active={active === "recetas"} />
      <NavLink tab="huerta" active={active === "huerta"} />
    </nav>
  );
}

export function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <div className="scrim" onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(31,42,30,.45)", zIndex: 20 }} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label} style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "12px 20px calc(28px + env(safe-area-inset-bottom))", borderRadius: "32px 32px 0 0", background: "#FBF7EF", zIndex: 21, maxHeight: "90%", overflowY: "auto" }}>
        <div style={{ width: 40, height: 5, borderRadius: 3, background: "#D9D2C4", margin: "0 auto 12px" }} />
        {children}
      </div>
    </>
  );
}

export function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <h2 className="bric" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.025em" }}>{title}</h2>
      <button className="press" onClick={onClose} aria-label="Cerrar" style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <IconClose />
      </button>
    </div>
  );
}

export const primaryBtn = (h = 60, extra: CSSProperties = {}): CSSProperties => ({
  height: h, borderRadius: h / 2, background: C.hoja, color: "#FFFFFF", fontSize: h >= 60 ? 19 : 17, fontWeight: 700,
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.18), 0 10px 20px -8px rgba(47,107,58,.7)", ...extra,
});

export const ghostBtn = (h = 52, extra: CSSProperties = {}): CSSProperties => ({
  height: h, borderRadius: h / 2, fontSize: 16, fontWeight: 600, color: C.media, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", ...extra,
});

export function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 2600);
    return () => window.clearTimeout(t);
  }, [onDone, text]);
  return (
    <p role="status" className="enter" style={{ position: "absolute", left: 20, right: 20, top: "calc(16px + env(safe-area-inset-top))", zIndex: 30, padding: "12px 16px", borderRadius: 18, background: C.tinta, color: "#FFFFFF", fontSize: 15, fontWeight: 600, textAlign: "center" }}>
      {text}
    </p>
  );
}

/** Ráfaga de semillas y hojas · nunca se repite en bucle */
export function Seeds({ n = 14, spread = 120, delay = 0 }: { n?: number; spread?: number; delay?: number }) {
  const seeds = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + 0.2;
    const d = spread + (i % 3) * 26;
    const leaf = i % 2 === 0;
    return {
      dx: Math.round(Math.cos(a) * d), dy: Math.round(Math.sin(a) * d * 0.8 - 30),
      c: ["#F2C14E", "#F28C5B", "#6FAE57", "#3B2E1E"][i % 4],
      w: leaf ? 14 : 7, h: leaf ? 8 : 10, r: leaf ? "10px 0" : "50%", d: delay + (i % 5) * 40,
    };
  });
  return (
    <>
      {seeds.map((p, i) => (
        <span key={i} className="seed" style={{ position: "absolute", left: 0, top: 0, width: p.w, height: p.h, borderRadius: p.r, background: p.c, animationDelay: `${p.d}ms`, ["--dx" as string]: `${p.dx}px`, ["--dy" as string]: `${p.dy}px` }} />
      ))}
    </>
  );
}
