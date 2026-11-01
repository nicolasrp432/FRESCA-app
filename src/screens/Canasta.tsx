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
  danio: (
    <img
      src="/images/3d/compost.png"
      alt="Daño"
      style={{ width: 44, height: 44, objectFit: "contain" }}
    />
  ),
  tiempo: (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #FFE4A0 0%, #F5B041 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 10px rgba(245,176,65,0.3)",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B2E1E" strokeWidth="2.4" strokeLinecap="round">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8 L 12 12 L 15 14" />
      </svg>
    </div>
  ),
  nosupe: (
    <img
      src="/images/3d/receta.png"
      alt="No supe cómo usarlo"
      style={{ width: 44, height: 44, objectFit: "contain" }}
    />
  ),
  demas: (
    <img
      src="/images/3d/canasta.png"
      alt="Compré de más"
      style={{ width: 44, height: 44, objectFit: "contain" }}
    />
  ),
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
            <div className="enter" style={{ margin: "30px 20px 0", padding: 24, borderRadius: 24, background: C.bandeja, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
              <img
                src="/images/3d/canasta.png"
                alt="Canasto vacío"
                style={{ width: 140, height: 140, objectFit: "contain", filter: "drop-shadow(0 8px 18px rgba(70,45,20,0.18))" }}
              />
              <span className="bric" style={{ fontSize: 24, fontWeight: 800 }}>El canasto está vacío</span>
              <span style={{ fontSize: 15, color: C.media }}>Escanea lo que tienes o agrégalo a mano.</span>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <a href="#/escanear" className="press" style={{ display: "flex", alignItems: "center", gap: 6, height: 48, padding: "0 18px", borderRadius: 24, background: C.papaya, fontSize: 15, fontWeight: 700 }}><IconScan size={20} />Escanear</a>
                <a href="#/mercar?agregar=1" className="press" style={{ display: "flex", alignItems: "center", height: 48, padding: "0 18px", borderRadius: 24, background: "#FFFFFF", fontSize: 15, fontWeight: 600 }}>A mano</a>
              </div>
            </div>
          )}

          {!empty && view === "canasto" && (
            <div className="enter scene" style={{ height: 430, marginTop: 10 }}>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 45,
                  transform: "translateX(-50%)",
                  width: 350,
                  height: 350,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <img
                  src="/images/3d/canasta.png"
                  alt=""
                  loading="eager"
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    filter: "drop-shadow(0 16px 32px rgba(90,62,34,0.22))",
                  }}
                />
              </div>
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
