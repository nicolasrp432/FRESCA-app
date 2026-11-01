import { useMemo, useState } from "react";
import { FOODS, KINDS, type Kind } from "../data/foods";
import { buyLessTips, haveByKind } from "../lib/domain";
import { vibrate } from "../lib/device";
import { query, usePath } from "../lib/router";
import { actions, useStore } from "../state/store";
import { BackButton, C, primaryBtn, useNow } from "../ui/Common";
import { Fruta } from "../ui/Fruta";
import { IconHand, IconMinus, IconScan, IconTrend } from "../ui/Icons";

type View = "mercar" | "agregar" | "saved";

export default function Mercar() {
  const path = usePath();
  const now = useNow();
  const items = useStore((s) => s.items);
  const events = useStore((s) => s.events);
  const people = useStore((s) => s.profile.people);
  const [view, setView] = useState<View>(query(path).get("agregar") ? "agregar" : "mercar");
  const [counts, setCounts] = useState<Partial<Record<Kind, number>>>({});
  const [tokens, setTokens] = useState<Kind[]>([]);
  const have = useMemo(() => haveByKind(items, now), [items, now]);
  const tips = useMemo(() => buyLessTips(events, now), [events, now]);
  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0);

  const add = (k: Kind) => {
    setCounts((c) => ({ ...c, [k]: (c[k] ?? 0) + 1 }));
    setTokens((t) => [...t, k]);
    vibrate(8);
  };
  const sub = (k: Kind) => {
    if (!counts[k]) return;
    setCounts((c) => ({ ...c, [k]: (c[k] ?? 0) - 1 }));
    setTokens((t) => {
      const i = t.lastIndexOf(k);
      return i < 0 ? t : [...t.slice(0, i), ...t.slice(i + 1)];
    });
  };
  const save = () => {
    if (!total) return;
    actions.addItems(KINDS.filter((k) => counts[k]).map((k) => ({ kind: k, qty: counts[k]!, stage: 0 })));
    setView("saved");
  };
  const productos = (n: number) => (n === 1 ? "1 producto" : `${n} productos`);

  return (
    <div className="screen grain">
      {view === "mercar" && (
        <section aria-label="Voy a mercar" className="enter screen">
          <div className="scroll" style={{ paddingBottom: 110 }}>
            <div className="zoomable">
              <div style={{ padding: "14px 12px 0" }}><BackButton to="/canasta" label="Volver a la canasta" /></div>
              <h1 className="bric" style={{ margin: "4px 20px 2px", fontSize: 40, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1 }}>Voy a mercar</h1>
              <p style={{ margin: "0 20px", fontSize: 16, color: C.media }}>Un consejo antes de salir.</p>

              <p style={{ margin: "22px 20px 8px", fontSize: 18, fontWeight: 700 }}>Ya tienes</p>
              {have.length > 0 ? (
                <>
                  <div className="tray" style={{ margin: "0 20px", padding: "10px 6px 12px", borderRadius: 24, display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", rowGap: 6 }}>
                    {have.map((h) => (
                      <div key={h.kind} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <Fruta kind={h.kind} stage={h.stage} size={70} />
                        <span className="num" style={{ fontSize: 16, fontWeight: 800 }}>×{h.qty}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ margin: "8px 24px 0", fontSize: 14, color: C.suave }}>De esto no hace falta comprar.</p>
                </>
              ) : (
                <p className="tray" style={{ margin: "0 20px", padding: "14px 16px", borderRadius: 20, fontSize: 15, fontWeight: 600 }}>Nada en casa. Compra tranquilo.</p>
              )}

              <p style={{ margin: "24px 20px 8px", fontSize: 18, fontWeight: 700 }}>{tips.length ? "Esta vez compra menos" : "Para que te rinda"}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, margin: "0 20px" }}>
                {tips.length ? (
                  tips.map((t) => (
                    <div key={t.kind} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px 8px 6px", borderRadius: 22, background: C.bandeja }}>
                      <div style={{ position: "relative" }}>
                        <Fruta kind={t.kind} stage={2} ring={false} size={68} decorative />
                        <span aria-hidden="true" style={{ position: "absolute", right: -2, bottom: 4, width: 26, height: 26, borderRadius: "50%", background: C.tinta, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}><IconTrend /></span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}><span style={{ fontSize: 16, fontWeight: 700 }}>{t.title}</span><span style={{ fontSize: 14, color: C.media }}>{t.tip}</span></div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: "14px 16px", borderRadius: 22, background: C.bandeja, display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>Para {people === 1 ? "ti" : `${people} en casa`}, fruta para 3 o 4 días</span>
                    <span style={{ fontSize: 14, color: C.media }}>Mezcla maduras y verdes: unas para hoy, otras para el fin de semana.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "12px 20px calc(24px + env(safe-area-inset-bottom))", background: "rgba(251,247,239,.9)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
            <button className="press" onClick={() => setView("agregar")} style={primaryBtn(60, { boxShadow: "none" })}>Volví del mercado</button>
          </div>
        </section>
      )}

      {view === "agregar" && (
        <section aria-label="Agregar mercado" className="enter screen">
          <div className="scroll" style={{ paddingBottom: 190 }}>
            <div style={{ padding: "14px 12px 0" }}><BackButton onClick={() => setView("mercar")} label="Volver" /></div>
            <h1 className="bric" style={{ margin: "4px 20px 14px", fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>¿Qué compraste?</h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, margin: "0 20px" }}>
              <a href="#/escanear?modo=mercado" className="press tray" style={{ display: "flex", flexDirection: "column", gap: 6, padding: 14, borderRadius: 22, minHeight: 120 }}>
                <span style={{ width: 48, height: 48, borderRadius: "50%", background: C.papaya, display: "flex", alignItems: "center", justifyContent: "center" }}><IconScan size={24} /></span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>Escanear el mercado</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#A04A1E" }}>Recomendado · todo de una</span>
              </a>
              <div className="tray" style={{ display: "flex", flexDirection: "column", gap: 6, padding: 14, borderRadius: 22, minHeight: 120, boxShadow: `inset 0 0 0 2px ${C.hoja}` }}>
                <span style={{ width: 48, height: 48, borderRadius: "50%", background: C.hojaClaro, color: C.hoja, display: "flex", alignItems: "center", justifyContent: "center" }}><IconHand /></span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>Elegir a mano</span>
                <span style={{ fontSize: 13, color: C.suave }}>Toca para echar al canasto</span>
              </div>
            </div>
            <div style={{ margin: "20px 12px 0" }}>
              <Shelf kinds={KINDS.slice(0, 3)} counts={counts} add={add} sub={sub} />
              <Shelf kinds={KINDS.slice(3)} counts={counts} add={add} sub={sub} />
            </div>
          </div>
          <div className="tray" style={{ position: "absolute", left: 12, right: 12, bottom: "calc(16px + env(safe-area-inset-bottom))", padding: "10px 10px 10px 12px", borderRadius: 28, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
              <div style={{ position: "relative", width: 150, height: 60, flex: "none" }}>
                <div style={{ position: "absolute", left: 6, right: 6, bottom: 0, height: 34, borderRadius: "6px 6px 22px 22px", background: "#B98A52", boxShadow: "inset 0 -6px 0 #9C6E3A", zIndex: 2 }} />
                <div style={{ position: "absolute", left: 6, right: 6, bottom: 0, height: 34, borderRadius: "6px 6px 22px 22px", backgroundImage: "repeating-linear-gradient(90deg, rgba(90,60,30,.18) 0 3px, transparent 3px 14px)", zIndex: 3 }} />
                {tokens.slice(-4).map((k, i) => (
                  <div key={`${tokens.length}-${i}`} className="drop" style={{ position: "absolute", left: 8 + i * 26, bottom: 16, zIndex: 1 }}><Fruta kind={k} stage={0} ring={false} size={50} decorative /></div>
                ))}
              </div>
              <div role="status" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <span className="bric num" style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{total}</span>
                <span style={{ fontSize: 14, color: C.suave }}>{total === 1 ? "producto en el canasto" : "productos en el canasto"}</span>
              </div>
            </div>
            <button className="press" onClick={save} disabled={!total} style={{ height: 56, borderRadius: 28, background: total ? C.hoja : "#9DB3A0", color: "#FFFFFF", fontSize: 18, fontWeight: 700, transition: "background 200ms ease" }}>{total ? `Guardar ${productos(total)}` : "Toca lo que compraste"}</button>
          </div>
        </section>
      )}

      {view === "saved" && (
        <section aria-label="Mercado guardado" className="enter" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "0 24px", textAlign: "center" }}>
          <div style={{ position: "relative", width: 260, height: 170 }}>
            {tokens.slice(0, 8).map((k, i) => (
              <div key={i} className="drop" style={{ position: "absolute", left: 10 + (i % 4) * 44 + (Math.floor(i / 4) % 2) * 20, top: 40 - Math.floor(i / 4) * 30, animationDelay: `${i * 70}ms` }}><Fruta kind={k} stage={0} size={80} decorative /></div>
            ))}
            <div style={{ position: "absolute", left: 10, right: 10, bottom: 0, height: 80, borderRadius: "10px 10px 60px 60px", background: "#B98A52", boxShadow: "inset 0 -10px 0 #9C6E3A, 0 16px 24px -12px rgba(90,62,34,.5)" }} />
            <div style={{ position: "absolute", left: 10, right: 10, bottom: 0, height: 80, borderRadius: "10px 10px 60px 60px", backgroundImage: "repeating-linear-gradient(90deg, rgba(90,60,30,.18) 0 4px, transparent 4px 20px)" }} />
          </div>
          <h1 className="bric" style={{ marginTop: 10, fontSize: 40, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1 }}>¡{productos(total)} adentro!</h1>
          <p style={{ fontSize: 16, color: C.media }}>Te aviso cuando algo esté por pasarse.</p>
          <a href="#/canasta" className="press" style={primaryBtn(60, { marginTop: 14, boxShadow: "none" })}>Ver mi canasta</a>
        </section>
      )}
    </div>
  );
}

function Shelf({ kinds, counts, add, sub }: { kinds: readonly Kind[]; counts: Partial<Record<Kind, number>>; add: (k: Kind) => void; sub: (k: Kind) => void }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 4, padding: "0 4px" }}>
        {kinds.map((k) => {
          const n = counts[k] ?? 0;
          const name = k === "fresa" ? FOODS[k].plural : FOODS[k].name;
          return (
            <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, position: "relative" }}>
              <button className="press" onClick={() => add(k)} aria-label={`Agregar ${name}${n ? `, llevas ${n}` : ""}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", paddingTop: 4 }}>
                <Fruta kind={k} stage={0} ring={false} size={92} decorative />
              </button>
              {n > 0 && <span key={n} className="pop num" aria-hidden="true" style={{ position: "absolute", right: 8, top: 2, minWidth: 28, height: 28, padding: "0 6px", borderRadius: 14, background: C.hoja, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800 }}>{n}</span>}
            </div>
          );
        })}
      </div>
      <div className="wood" style={{ height: 14, borderRadius: 7, boxShadow: "0 8px 12px -6px rgba(90,62,34,.5)" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 4, padding: "4px 4px 10px" }}>
        {kinds.map((k) => {
          const n = counts[k] ?? 0;
          const name = k === "fresa" ? FOODS[k].plural : FOODS[k].name;
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <button className="press" onClick={() => sub(k)} disabled={!n} aria-label={`Quitar ${FOODS[k].article} ${FOODS[k].name.toLowerCase()}`} style={{ width: 44, height: 44, borderRadius: "50%", background: C.bandeja, opacity: n ? 1 : 0.4, display: "flex", alignItems: "center", justifyContent: "center" }}><IconMinus size={18} strokeWidth={2.8} /></button>
              <span style={{ fontSize: 14, fontWeight: 700, minWidth: 50, textAlign: "center" }}>{name}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
