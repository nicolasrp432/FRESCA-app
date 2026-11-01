import { useMemo, useState, type ReactNode } from "react";
import { FOODS } from "../data/foods";
import { computeStats, fmtKg, fmtPesos, LEVELS } from "../lib/domain";
import { useStore } from "../state/store";
import { BottomNav, C, useNow } from "../ui/Common";
import { Fruta } from "../ui/Fruta";
import { Cloud, Coins, FruitPile, PotLevels } from "../ui/Illustrations";

const FRUIT_DOTS = [["#F28C5B", "#D9703E"], ["#F2C14E", "#C9962A"], ["#E2483C", "#A82C22"], ["#6FAE57", "#46702A"]];
const DAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export default function Huerta() {
  const now = useNow();
  const events = useStore((s) => s.events);
  const name = useStore((s) => s.profile.name);
  const st = useMemo(() => computeStats(events, now), [events, now]);
  const [preview, setPreview] = useState<number | null>(null);
  const lvl = preview ?? st.level;
  const max = Math.max(5, ...st.days.map((d) => d.rescued + d.tossed));
  const chartLabel =
    "Rescatado por día: " + st.days.map((d, i) => `${DAY_NAMES[i]} ${d.rescued * 100} gramos`).join(", ") +
    (st.days.some((d) => d.tossed) ? ". Botado: " + st.days.filter((d) => d.tossed).map((d) => `${DAY_NAMES[st.days.indexOf(d)]} ${d.tossed * 100} gramos`).join(", ") : "") + ".";

  return (
    <section aria-label="Tu huerta" className="screen grain">
      <div className="scroll" style={{ paddingBottom: 128 }}>
        <div className="zoomable">
          <header style={{ position: "relative", padding: "22px 20px 0" }}>
            <a href="#/perfil" className="press tray" aria-label="Tu perfil y ajustes" style={{ position: "absolute", right: 20, top: 20, width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700 }}>{(name || "Tú").slice(0, 1).toUpperCase()}</a>
            <h1 className="bric" style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1 }}>Tu huerta</h1>
            <p style={{ marginTop: 4, fontSize: 15, color: C.suave }}>Crece con lo que rescatas.</p>
          </header>

          <div className="scene" style={{ height: 250, marginTop: 4 }}>
            <div style={{ position: "absolute", left: 60, right: 60, top: 196, height: 44, borderRadius: "50%", background: C.plato }} />
            <PotLevels level={lvl} label={`Matera en nivel ${LEVELS[lvl].name}`} style={{ position: "absolute", left: 80, top: 0 }} />
            {preview != null && preview !== st.level && <span style={{ position: "absolute", right: 20, top: 10, padding: "6px 10px", borderRadius: 12, background: C.bandeja, fontSize: 13, fontWeight: 600 }}>Vista previa</span>}
          </div>

          <div role="group" aria-label="Niveles de la huerta" style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 4, margin: "0 14px" }}>
            {LEVELS.map((l, i) => {
              const reached = i <= st.level;
              const on = i === lvl;
              return (
                <button key={l.name} className="press" onClick={() => setPreview(i === st.level ? null : i)} aria-pressed={on} aria-label={`${l.name}${reached ? "" : `, desde ${l.kg} kg`}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minHeight: 52, justifyContent: "center" }}>
                  <span style={{ width: 14, height: 14, borderRadius: "50%", background: reached ? C.hoja : "#E6DCCB", boxShadow: on ? "0 0 0 4px #FBF7EF, 0 0 0 6px #2F6B3A" : "none" }} />
                  <span style={{ fontSize: 13, fontWeight: on ? 700 : 600, color: on ? C.tinta : C.suave }}>{l.name}</span>
                </button>
              );
            })}
          </div>
          <p style={{ margin: "6px 20px 0", textAlign: "center", fontSize: 14, color: C.suave }}>
            {st.nextLevelName ? `Te faltan ${fmtKg(st.kgToNext)} kg para ${st.nextLevelName}.` : "Llegaste a Cosecha. ¡Qué huerta!"}
          </p>

          <div className="huerta-stats">
            <Stat art={<FruitPile />} value={`${fmtKg(st.rescuedKg)} kg`} label="rescatados" />
            <Stat art={<Coins />} value={`$${fmtPesos(st.pesos)}`} label="pesos ahorrados" />
            <Stat art={<Cloud />} value={`≈ ${fmtKg(st.co2)} kg`} label="de CO₂ evitado" />
          </div>

          <h2 className="bric" style={{ margin: "26px 20px 4px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>Esta semana</h2>
          <div style={{ display: "flex", gap: 14, margin: "0 20px 10px", fontSize: 13, fontWeight: 600, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: "50%", background: "#F28C5B" }} />Rescatado · {fmtKg(st.weekRescuedKg)} kg</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: "50%", background: "#CFC6B6" }} />Botado · {fmtKg(st.weekTossedKg)} kg</span>
          </div>
          <div className="tray" role="img" aria-label={chartLabel} style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4, margin: "0 20px", padding: "14px 10px 10px", borderRadius: 24, alignItems: "end" }}>
            {st.days.map((d, i) => {
              const scale = max > 5 ? 5 / max : 1;
              const r = Math.round(d.rescued * scale);
              const t = Math.round(d.tossed * scale);
              const dots = [
                ...Array.from({ length: r }, (_, k) => ({ c: FRUIT_DOTS[(i + k) % 4], delay: i * 40 + k * 60 })),
                ...Array.from({ length: t }, (_, j) => ({ c: ["#CFC6B6", "#B3A996"], delay: i * 40 + (r + j) * 60 })),
              ];
              return (
                <div key={d.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 2, height: 108, justifyContent: "flex-start" }}>
                    {dots.map((p, k) => <span key={k} className="pile" style={{ width: 18, height: 18, borderRadius: "50%", background: p.c[0], boxShadow: `inset -3px -3px 0 ${p.c[1]}`, animationDelay: `${p.delay}ms` }} />)}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: d.today ? 800 : 600, color: "#4E574B" }}>{d.label}</span>
                </div>
              );
            })}
          </div>
          <p style={{ margin: "6px 20px 0", fontSize: 13, color: C.suave }}>{max > 5 ? `Cada bolita, unos ${Math.round((100 * max) / 5)} g.` : "Cada bolita, unos 100 g."}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, margin: "22px 20px 0" }}>
            <div className="tray" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 10px 14px", borderRadius: 24, textAlign: "center" }}>
              <Fruta kind={st.star?.kind ?? "banano"} stage={2} ring={false} size={96} decorative />
              <span style={{ fontSize: 13, color: C.suave }}>Tu fruta estrella</span>
              <span className="bric" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>
                {st.star ? `${st.star.count} ${(st.star.count === 1 ? FOODS[st.star.kind].name : FOODS[st.star.kind].plural).toLowerCase()} salvad${FOODS[st.star.kind].article === "una" ? "as" : "os"}` : "Rescata tu primera"}
              </span>
            </div>
            <div className="tray" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 10px 14px", borderRadius: 24, textAlign: "center" }}>
              <Fruta kind={st.escape?.kind ?? "fresa"} stage={2} ring={false} size={96} decorative />
              <span style={{ fontSize: 13, color: C.suave }}>La que más se te escapa</span>
              <span className="bric" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>{st.escape ? FOODS[st.escape.kind].buyLess : "Ninguna por ahora"}</span>
            </div>
          </div>
        </div>
      </div>
      <BottomNav active="huerta" />
    </section>
  );
}

function Stat({ art, value, label }: { art: ReactNode; value: string; label: string }) {
  return (
    <div className="tray" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px 12px 10px", borderRadius: 24 }}>
      {art}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span className="bric num" style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 15, color: C.suave }}>{label}</span>
      </div>
    </div>
  );
}
