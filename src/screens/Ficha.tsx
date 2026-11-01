import { useMemo, useState } from "react";
import { FOODS, isKind, STAGE_COLORS, type Kind, type Stage } from "../data/foods";
import { RECIPES } from "../data/recipes";
import { byUrgency, currentStage, openItems } from "../lib/domain";
import { actions, useStore } from "../state/store";
import { BackButton, C, useNow } from "../ui/Common";
import { Fruta } from "../ui/Fruta";
import { IconCheck, IconClock, IconClose } from "../ui/Icons";
import { DishArt, FruitBowl, Fridge, Liquid, Mold, Smoothie, Sour } from "../ui/Illustrations";

const WORDS = ["Verde", "En su punto", "Úsalo ya", "Muy maduro"];
const DISCARD = { moho: { label: "Moho", Art: Mold }, liquido: { label: "Suelta líquido", Art: Liquid }, agrio: { label: "Huele agrio", Art: Sour } };

export default function Ficha({ kind: k }: { kind: string }) {
  const kind: Kind = isKind(k) ? k : "banano";
  const f = FOODS[kind];
  const now = useNow();
  const items = useStore((s) => s.items);
  const mine = useMemo(() => byUrgency(openItems(items).filter((i) => i.kind === kind), now)[0] ?? null, [items, kind, now]);
  const [local, setLocal] = useState<Stage>(mine ? currentStage(mine, now) : 2);
  const st: Stage = mine ? currentStage(mine, now) : local;
  const recipes = RECIPES.filter((r) => r.saves.includes(kind));
  const fridge = kind === "fresa";

  const onStage = (v: number) => {
    const s = v as Stage;
    if (mine) actions.setStage(mine.id, s);
    else setLocal(s);
  };
  const recipeForIdea = (t: string) => recipes.find((r) => r.name.toLowerCase().includes(t.toLowerCase().split(" ")[0]));

  return (
    <div className="screen grain">
      <div className="scroll" style={{ paddingBottom: 40 }}>
        <div className="zoomable">
          <div style={{ padding: "14px 12px 0" }}><BackButton label="Volver" /></div>

          <div className="scene" style={{ height: 250 }}>
            <div style={{ position: "absolute", left: 30, right: 30, top: 150, height: 90, borderRadius: "50%", background: C.plato, boxShadow: "inset 0 6px 16px rgba(120,84,40,.12)" }} />
            <div style={{ position: "absolute", left: 65, top: -10 }}><Fruta kind={kind} stage={st} size={260} /></div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", margin: "0 20px", gap: 10 }}>
            <h1 className="bric" style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 0.95 }}>{f.name}</h1>
            <span role="status" style={{ display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 12px", borderRadius: 17, background: "#FFFFFF", fontSize: 15, fontWeight: 700, flex: "none" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: STAGE_COLORS[st], transition: "background 300ms ease" }} />{WORDS[st]}
            </span>
          </div>
          {mine && <p style={{ margin: "6px 20px 0", fontSize: 14, color: C.suave }}>Tienes {mine.qty} en la canasta. Si no se ve así, muévelo.</p>}

          <div style={{ margin: "18px 20px 0" }}>
            <label htmlFor="madurez" style={{ fontSize: 15, fontWeight: 700 }}>Mueve la madurez</label>
            <input id="madurez" type="range" min={0} max={3} step={1} value={st} onChange={(e) => onStage(Number(e.target.value))} aria-valuetext={WORDS[st]} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", fontSize: 13, fontWeight: 600, color: C.suave }}>
              <span>{f.stageNames[0]}</span><span style={{ textAlign: "center" }}>{f.stageNames[1]}</span><span style={{ textAlign: "center" }}>{f.stageNames[2]}</span><span style={{ textAlign: "right" }}>{f.stageNames[3]}</span>
            </div>
          </div>

          {st >= 2 && (
            <p className="fadein" style={{ margin: "14px 20px 0", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 16, background: C.hojaClaro, color: C.hoja, fontSize: 15, fontWeight: 700 }}><IconCheck />Maduro no es dañado</p>
          )}

          <p style={{ margin: "18px 20px 8px", fontSize: 16, fontWeight: 700 }}>En este punto, hazle</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, margin: "0 20px" }}>
            {f.ideas[st].map((i) => {
              const r = recipeForIdea(i.t);
              const inner = (
                <>
                  <span className="bric" style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}>{i.t}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14, color: C.suave }}><IconClock size={14} />{i.m}</span>
                </>
              );
              const style = { display: "flex", flexDirection: "column" as const, alignItems: "flex-start", gap: 2, padding: 14, borderRadius: 20, textAlign: "left" as const, minHeight: 76 };
              return r ? (
                <a key={`${st}-${i.t}`} href={`#/receta/${r.id}`} className="press tray fadein" style={style}>{inner}</a>
              ) : (
                <div key={`${st}-${i.t}`} className="tray fadein" style={style}>{inner}</div>
              );
            })}
          </div>

          <h2 className="bric" style={{ margin: "26px 20px 10px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>¿Todavía sirve?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, margin: "0 20px" }}>
            <div className="tray" style={{ borderRadius: 22, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 700, color: C.hoja }}><IconCheck strokeWidth={2.6} />Normal</span>
              {f.normal.map((n) => (
                <div key={n.label} style={{ display: "flex", alignItems: "center", gap: 8 }}><Fruta kind={kind} stage={n.stage} ring={false} size={48} decorative /><span style={{ fontSize: 15, fontWeight: 600 }}>{n.label}</span></div>
              ))}
            </div>
            <div className="tray" style={{ borderRadius: 22, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 700, color: C.peligro }}><IconClose size={16} strokeWidth={3} />Descarta</span>
              {f.discard.map((d) => {
                const { label, Art } = DISCARD[d];
                return <div key={d} style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 48 }}><Art size={48} /><span style={{ fontSize: 15, fontWeight: 600 }}>{label}</span></div>;
              })}
            </div>
          </div>

          <h2 className="bric" style={{ margin: "26px 20px 10px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>Cómo guardarlo</h2>
          <div className="tray" style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 20px", padding: "10px 16px 10px 10px", borderRadius: 22 }}>
            {fridge ? <Fridge /> : <FruitBowl />}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{f.storage.title}</span>
              <span style={{ fontSize: 14, color: C.suave }}>{f.storage.tip}</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "26px 20px 10px" }}>
            <h2 className="bric" style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>Nutrición</h2>
            <span style={{ fontSize: 13, color: C.suave }}>{f.nutrition.per}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8, margin: "0 20px" }}>
            {f.nutrition.values.map((n) => (
              <div key={n.u} style={{ aspectRatio: "1 / 1", borderRadius: "50%", background: C.bandeja, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <span className="bric num" style={{ fontSize: n.v.length > 3 ? 19 : 22, fontWeight: 800 }}>{n.v}</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{n.u}</span>
              </div>
            ))}
          </div>

          {recipes.length > 0 && (
            <>
              <h2 className="bric" style={{ margin: "26px 20px 0", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>Puedes hacer</h2>
              <div className="hscroll" style={{ gap: 12, padding: "32px 20px 8px" }}>
                {recipes.map((r) => (
                  <a key={r.id} href={`#/receta/${r.id}`} className="press tray" style={{ flex: "none", width: 150, scrollSnapAlign: "start", borderRadius: 22, padding: "0 12px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textAlign: "center" }}>
                    {r.dish === "glass" ? <Smoothie width={74} height={92} color={r.color} shine={false} style={{ marginTop: -26 }} /> : <DishArt dish={r.dish} recipeId={r.id} color={r.color} topping={r.topping} size={92} style={{ marginTop: -24 }} />}
                    <span className="bric" style={{ fontSize: 17, fontWeight: 700 }}>{r.name}</span>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
