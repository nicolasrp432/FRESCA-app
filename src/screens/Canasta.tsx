import { useMemo, useState, type ReactElement } from "react";
import { STAGE_COLORS } from "../data/foods";
import { ageLabel, byUrgency, currentStage, DAY, openItems, REASONS, stageWord, type TossReason } from "../lib/domain";
import { itemName } from "../lib/pick";
import { actions, useStore } from "../state/store";
import { BottomNav, C, Sheet, SheetHeader, useNow } from "../ui/Common";
import { Fruta } from "../ui/Fruta";
import { IconBasket, IconCheck, IconScan } from "../ui/Icons";

/* Arriba y más grande: lo que va primero */
const PILE = [
  { left: 112, top: 250, size: 170, delay: 60 },
  { left: 236, top: 236, size: 120, delay: 120 },
  { left: 30, top: 230, size: 140, delay: 180 },
  { left: 150, top: 120, size: 100, delay: 240 },
  { left: 70, top: 150, size: 100, delay: 300 },
  { left: 216, top: 160, size: 96, delay: 360 },
];

const REASON_ICONS: Record<TossReason, ReactElement> = {
  danio: <svg width="40" height="40" viewBox="0 0 48 48" aria-hidden="true"><circle cx="20" cy="26" r="11" fill="#ECE8DC" /><circle cx="30" cy="20" r="8" fill="#E2DED2" /><circle cx="19" cy="24" r="1.5" fill="#A9A495" /><circle cx="28" cy="19" r="1.3" fill="#A9A495" /></svg>,
  tiempo: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1F2A1E" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M12 8 L 12 12 L 15 14" /></svg>,
  nosupe: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1F2A1E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12 L 20 12 A 8 8 0 0 1 4 12 Z" /><path d="M10 6.5 A 2.2 2.2 0 1 1 12.6 8.6 L 12 9.4" /></svg>,
  demas: <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1F2A1E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 10 L 20 10 L 18.4 18.4 A 2 2 0 0 1 16.4 20 L 7.6 20 A 2 2 0 0 1 5.6 18.4 Z" /><path d="M9 6 L 9 3 M12 6 L 12 2 M15 6 L 15 3" /></svg>,
};

export default function Canasta() {
  const now = useNow();
  const items = useStore((s) => s.items);
  const [view, setView] = useState<"canasto" | "lista">("canasto");
  const [asking, setAsking] = useState<string | null>(null);
  const [thanks, setThanks] = useState(false);
  const open = useMemo(() => byUrgency(openItems(items), now), [items, now]);
  // lo cerrado hoy se queda visible (apagado) en la lista
  const closedToday = useMemo(() => items.filter((i) => i.status !== "open" && i.closedAt && now - i.closedAt < DAY).sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0)), [items, now]);
  const pile = open.slice(0, PILE.length);
  const extra = open.length - pile.length;
  const empty = open.length === 0;

  const seg = (on: boolean) => ({ height: 40, borderRadius: 18, fontSize: 15, fontWeight: 600, background: on ? "#FFFFFF" : "transparent", boxShadow: on ? "0 2px 6px rgba(110,74,30,.15)" : "none", transition: "background 180ms ease" });

  return (
    <section aria-label="Mi canasta" className="screen grain">
      <div className="scroll" style={{ paddingBottom: 128 }}>
        <div className="zoomable">
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 20px 0" }}>
            <h1 className="bric" style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1 }}>Mi canasta</h1>
            <a href="#/mercar" className="press" style={{ display: "flex", alignItems: "center", gap: 6, height: 44, padding: "0 14px", borderRadius: 22, border: `2px solid ${C.hoja}`, color: C.hoja, fontSize: 15, fontWeight: 600 }}><IconBasket size={18} strokeWidth={2.2} />Voy a mercar</a>
          </header>

          <div role="group" aria-label="Vista" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", margin: "18px 20px 0", padding: 4, borderRadius: 22, background: C.bandeja }}>
            <button className="press" onClick={() => setView("canasto")} aria-pressed={view === "canasto"} style={seg(view === "canasto")}>Canasto</button>
            <button className="press" onClick={() => setView("lista")} aria-pressed={view === "lista"} style={seg(view === "lista")}>Lista</button>
          </div>

          {empty && view === "canasto" && (
            <div className="enter" style={{ margin: "40px 20px 0", padding: 22, borderRadius: 24, background: C.bandeja, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
              <span className="bric" style={{ fontSize: 24, fontWeight: 800 }}>El canasto está vacío</span>
              <span style={{ fontSize: 15, color: C.media }}>Escanea lo que tienes o agrégalo a mano.</span>
              <div style={{ display: "flex", gap: 8 }}>
                <a href="#/escanear" className="press" style={{ display: "flex", alignItems: "center", gap: 6, height: 48, padding: "0 18px", borderRadius: 24, background: C.papaya, fontSize: 15, fontWeight: 700 }}><IconScan size={20} />Escanear</a>
                <a href="#/mercar?agregar=1" className="press" style={{ display: "flex", alignItems: "center", height: 48, padding: "0 18px", borderRadius: 24, background: "#FFFFFF", fontSize: 15, fontWeight: 600 }}>A mano</a>
              </div>
            </div>
          )}

          {!empty && view === "canasto" && (
            <div className="enter scene" style={{ height: 430, marginTop: 10 }}>
              <svg aria-hidden="true" width="370" height="330" viewBox="0 0 370 330" style={{ position: "absolute", left: 10, top: 70 }}>
                <ellipse cx="185" cy="306" rx="160" ry="16" fill="#5A3E22" opacity="0.16" />
                <ellipse cx="185" cy="160" rx="176" ry="146" fill="#B98A52" />
                <ellipse cx="185" cy="160" rx="176" ry="146" fill="none" stroke="#A2743E" strokeWidth="16" />
                <ellipse cx="185" cy="164" rx="150" ry="122" fill="#9C6E3A" />
                <g fill="none" stroke="#B58550" strokeWidth="5" opacity="0.7"><ellipse cx="185" cy="164" rx="122" ry="98" /><ellipse cx="185" cy="164" rx="92" ry="72" /><ellipse cx="185" cy="164" rx="60" ry="46" /></g>
                <g stroke="#87592C" strokeWidth="3" opacity="0.5"><path d="M185 42 L 185 286 M35 164 L 335 164 M80 78 L 290 250 M290 78 L 80 250" /></g>
                <ellipse cx="185" cy="160" rx="176" ry="146" fill="none" stroke="#D2A770" strokeWidth="3" strokeDasharray="10 8" />
              </svg>
              {[...pile.keys()].reverse().map((idx) => {
                const it = pile[idx];
                const p = PILE[idx];
                const st = currentStage(it, now);
                return (
                  <a key={it.id} href={`#/ficha/${it.kind}`} className="press drop" aria-label={`${itemName(it)} ×${it.qty}, ${stageWord(st).toLowerCase()}`} style={{ position: "absolute", left: p.left, top: p.top, animationDelay: `${p.delay}ms` }}>
                    <Fruta kind={it.kind} stage={st} size={p.size} decorative />
                  </a>
                );
              })}
              <span style={{ position: "absolute", left: 20, top: 20, fontSize: 15, color: C.suave }}>Arriba y más grande: lo que va primero.</span>
              {extra > 0 && (
                <button className="press" onClick={() => setView("lista")} style={{ position: "absolute", right: 20, top: 46, height: 36, padding: "0 12px", borderRadius: 18, background: "#FFFFFF", fontSize: 14, fontWeight: 700 }}>+{extra} más</button>
              )}
            </div>
          )}

          {view === "lista" && (
            <div className="enter" style={{ display: "flex", flexDirection: "column", gap: 10, margin: "16px 20px 0" }}>
              {empty && closedToday.length === 0 && <p style={{ padding: 18, borderRadius: 20, background: C.bandeja, fontSize: 15, fontWeight: 600, textAlign: "center" }}>Nada por ahora. <a href="#/mercar?agregar=1" style={{ color: C.hoja, textDecoration: "underline" }}>Agrega lo que compraste</a>.</p>}
              {[...open, ...closedToday].map((it) => {
                const st = currentStage(it, now);
                const isOpen = it.status === "open";
                return (
                  <div key={it.id} className="tray" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px 6px 4px", borderRadius: 22, opacity: isOpen ? 1 : 0.6, transition: "opacity 240ms ease" }}>
                    <a href={`#/ficha/${it.kind}`} aria-label={`Ficha de ${itemName(it)}`}><Fruta kind={it.kind} stage={st} size={70} decorative /></a>
                    <div style={{ display: "flex", flexDirection: "column", gap: 1, flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 16, fontWeight: 700 }}>{itemName(it)} {isOpen && <span className="num" style={{ fontWeight: 800 }}>×{it.qty}</span>}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: C.suave }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: STAGE_COLORS[st] }} />{stageWord(st)} · {ageLabel(it.addedAt, now)}</span>
                    </div>
                    {isOpen ? (
                      <>
                        <button className="press" onClick={() => { actions.useItem(it.id, 1); setThanks(false); }} aria-label={`Lo usé: ${itemName(it)}${it.qty > 1 ? ", uno" : ""}`} style={{ width: 44, height: 44, borderRadius: "50%", background: C.hojaClaro, color: C.hoja, display: "flex", alignItems: "center", justifyContent: "center" }}><IconCheck size={20} strokeWidth={2.6} /></button>
                        <button className="press" onClick={() => { setAsking(it.id); setThanks(false); }} aria-label={`Lo boté: ${itemName(it)}${it.qty > 1 ? ", uno" : ""}`} style={{ width: 44, height: 44, borderRadius: "50%", background: C.bandeja, color: C.media, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 11 L 19 11 L 17.5 20 L 6.5 20 Z" /><path d="M12 11 L 12 7 M12 8 C 12 6, 10 4.5, 8 4.5 C 8 6.5, 10 8, 12 8 Z" /></svg>
                        </button>
                      </>
                    ) : (
                      <span style={{ padding: "0 10px", fontSize: 14, fontWeight: 700, color: C.hoja }}>{it.status === "used" ? "Rescatado" : "A la tierra"}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {thanks && <p role="status" className="enter" style={{ margin: "14px 20px 0", padding: "12px 14px", borderRadius: 16, background: C.bandeja, fontSize: 15, fontWeight: 600 }}>Gracias, esto te ayuda a comprar mejor.</p>}
        </div>
      </div>

      <BottomNav active="canasta" />

      {asking && (
        <Sheet label="¿Qué pasó?" onClose={() => setAsking(null)}>
          <SheetHeader title="¿Qué pasó?" onClose={() => setAsking(null)} />
          <p style={{ margin: "4px 0 14px", fontSize: 15, color: C.suave }}>No pasa nada. Así te aviso antes.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
            {(Object.keys(REASONS) as TossReason[]).map((r) => (
              <button key={r} className="press tray" onClick={() => { actions.tossItem(asking, r, 1); setAsking(null); setThanks(true); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "16px 8px", borderRadius: 22 }}>
                {REASON_ICONS[r]}
                <span style={{ fontSize: 15, fontWeight: 600 }}>{REASONS[r]}</span>
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </section>
  );
}
