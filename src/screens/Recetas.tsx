import { useEffect, useMemo, useRef, useState } from "react";
import { FOODS, isKind, type Kind } from "../data/foods";
import { RECIPES, type Recipe, type Tag } from "../data/recipes";
import { FrescaError, idea } from "../lib/api";
import { byUrgency, currentStage, openItems, uid } from "../lib/domain";
import { actions, getState, useStore } from "../state/store";
import { BottomNav, C, useNow } from "../ui/Common";
import { Fruta } from "../ui/Fruta";
import { IconCheck, IconClock } from "../ui/Icons";
import { DishArt } from "../ui/Illustrations";

const TAGS: { id: Tag; name: string; icon: string }[] = [
  { id: "dulce", name: "Dulce", icon: "M12 3 C 16 9, 18 12, 18 15 A 6 6 0 0 1 6 15 C 6 12, 8 9, 12 3 Z" },
  { id: "salado", name: "Salado", icon: "M8 3 L 16 3 L 17 8 L 7 8 Z M7 8 L 17 8 L 18 21 L 6 21 Z M10 5.5 L 10 5.6 M14 5.5 L 14 5.6" },
  { id: "rapido", name: "Rápido", icon: "M13 2 L 4 14 L 11 14 L 10 22 L 20 9 L 13 9 Z" },
];

type Gen = { state: "idle" } | { state: "busy" } | { state: "done"; recipe: Recipe } | { state: "error"; text: string };

export default function Recetas() {
  const now = useNow();
  const items = useStore((s) => s.items);
  const generated = useStore((s) => s.generated);
  const [picked, setPicked] = useState<Partial<Record<Kind, boolean>>>({});
  const [tags, setTags] = useState<Partial<Record<Tag, boolean>>>({});
  const [gen, setGen] = useState<Gen>(() => (generated[0] ? { state: "done", recipe: generated[0] } : { state: "idle" }));
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  // Chips: lo que tienes y se está pasando primero
  const urgent = useMemo(() => byUrgency(openItems(items), now), [items, now]);
  const chipKinds = useMemo(() => {
    const ks: Kind[] = [];
    urgent.forEach((i) => !ks.includes(i.kind) && ks.push(i.kind));
    return ks.length ? ks : (["banano", "fresa", "papaya"] as Kind[]);
  }, [urgent]);
  const genKinds = (urgent.length ? urgent.map((i) => i.kind) : chipKinds).filter((k, i, a) => a.indexOf(k) === i).slice(0, 3);

  const all = useMemo(() => [...generated, ...RECIPES], [generated]);
  const anyPicked = Object.values(picked).some(Boolean);
  const activeTags = (Object.keys(tags) as Tag[]).filter((t) => tags[t]);
  const list = all.filter((r) => (!anyPicked || r.saves.some((k) => picked[k])) && activeTags.every((t) => r.tags.includes(t)));

  const generate = async () => {
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    setGen({ state: "busy" });
    try {
      const have = urgent.slice(0, 8).map((i) => ({ kind: i.kind, stage: currentStage(i, now), qty: i.qty }));
      const res = await idea({ have: have.length ? have : genKinds.map((k) => ({ kind: k, stage: 2 as const, qty: 1 })), pantry: getState().pantry, avoid: all.map((r) => r.name) }, ac.signal);
      const saves = [...new Set(res.ingredients.map((i) => i.kind).filter(isKind))];
      const recipe: Recipe = {
        id: `ia-${uid()}`,
        name: res.name,
        minutes: res.minutes,
        time: res.minutes >= 60 ? `${Math.round(res.minutes / 60)} h` : `${res.minutes} min`,
        difficulty: Math.max(1, Math.min(3, res.difficulty)) as 1 | 2 | 3,
        serves: res.serves,
        tags: res.tags,
        saves: saves.length ? saves : genKinds,
        dish: res.dish,
        color: /^#[0-9a-f]{6}$/i.test(res.color) ? res.color : "#F28C5B",
        validated: false,
        ingredients: res.ingredients.map((i) => ({ kind: isKind(i.kind) ? i.kind : undefined, pantry: i.pantry ?? undefined, qty: i.qty, label: i.label })),
        steps: res.steps.map((s) => ({ action: s.action, verb: s.verb, detail: s.detail, note: s.note, timer: s.timer ?? undefined })),
      };
      actions.saveGenerated(recipe);
      setGen({ state: "done", recipe });
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      const code = e instanceof FrescaError ? e.code : "upstream";
      setGen({
        state: "error",
        text: code === "offline" ? "Sin internet. La vitrina sí funciona." : code === "ai_off" ? "Las ideas nuevas no están activas aquí. Mira la vitrina." : code === "rate" || code === "busy" ? "Vamos muy rápido. Prueba en un momento." : "No salió la idea. Prueba otra vez.",
      });
    }
  };

  return (
    <section aria-label="Con lo que tienes" className="screen grain">
      <div className="scroll" style={{ paddingBottom: 128 }}>
        <div className="zoomable">
          <h1 className="bric" style={{ margin: "26px 20px 0", fontSize: 40, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1 }}>Con lo que tienes</h1>

          <div role="group" aria-label="Filtrar por lo que hay que usar" className="hscroll" style={{ gap: 8, padding: "14px 20px 4px" }}>
            {chipKinds.map((k) => {
              const on = !!picked[k];
              const it = urgent.find((i) => i.kind === k);
              return (
                <button key={k} className="press" onClick={() => setPicked((p) => ({ ...p, [k]: !on }))} aria-pressed={on} style={{ flex: "none", display: "flex", alignItems: "center", gap: 2, height: 48, padding: "0 14px 0 2px", borderRadius: 24, background: on ? C.hoja : "#FFFFFF", color: on ? "#FFFFFF" : C.tinta, fontSize: 15, fontWeight: 700, boxShadow: `inset 0 0 0 2px ${on ? C.hoja : "#E6DCCB"}`, transition: "background 180ms ease, color 180ms ease" }}>
                  <Fruta kind={k} stage={it ? currentStage(it, now) : 2} ring={false} size={44} decorative />{k === "fresa" ? FOODS[k].plural : FOODS[k].name}
                </button>
              );
            })}
          </div>

          <div role="group" aria-label="Tipo de receta" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, margin: "10px 20px 0" }}>
            {TAGS.map((f) => {
              const on = !!tags[f.id];
              return (
                <button key={f.id} className="press" onClick={() => setTags((t) => ({ ...t, [f.id]: !on }))} aria-pressed={on} style={{ height: 44, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: on ? C.tinta : C.bandeja, color: on ? "#FFFFFF" : C.tinta, fontSize: 15, fontWeight: 600, transition: "background 180ms ease, color 180ms ease" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={f.icon} /></svg>{f.name}
                </button>
              );
            })}
          </div>

          <div style={{ position: "relative", margin: "18px 20px 0", borderRadius: 26, overflow: "hidden", padding: 2 }}>
            <div className={gen.state === "busy" ? "spinb" : undefined} aria-hidden="true" style={{ position: "absolute", left: -100, top: -200, width: 550, height: 550, background: "conic-gradient(from 0deg, #F28C5B, #F2C14E, #FBF7EF, #F28C5B 60%, #F2C14E, #F28C5B)" }} />
            <div style={{ position: "relative", borderRadius: 24, background: "#FFF8F1", padding: 16 }}>
              {(gen.state === "idle" || gen.state === "error") && (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ position: "relative", width: 84, height: 76, flex: "none" }}>
                    {genKinds[0] && <div style={{ position: "absolute", left: -6, top: -4 }}><Fruta kind={genKinds[0]} stage={2} ring={false} size={60} decorative /></div>}
                    {genKinds[1] && <div style={{ position: "absolute", left: 34, top: 4 }}><Fruta kind={genKinds[1]} stage={2} ring={false} size={48} decorative /></div>}
                    {genKinds[2] && <div style={{ position: "absolute", left: 18, top: 26 }}><Fruta kind={genKinds[2]} stage={1} ring={false} size={58} decorative /></div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    <span className="bric" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>Créala con lo mío</span>
                    <span role={gen.state === "error" ? "status" : undefined} style={{ fontSize: 14, color: gen.state === "error" ? C.peligro : C.suave, fontWeight: gen.state === "error" ? 600 : 400 }}>{gen.state === "error" ? gen.text : "Una idea nueva con lo que está por pasarse."}</span>
                    <button className="press" onClick={generate} style={{ alignSelf: "flex-start", height: 44, padding: "0 18px", borderRadius: 22, background: C.papaya, color: C.tinta, fontSize: 15, fontWeight: 700, boxShadow: "inset 0 2px 0 rgba(255,255,255,.35), inset 0 -3px 0 rgba(150,60,20,.18)" }}>{gen.state === "error" ? "Probar otra vez" : "Crear idea"}</button>
                  </div>
                </div>
              )}
              {gen.state === "busy" && (
                <div role="status" aria-live="polite" style={{ display: "flex", alignItems: "center", gap: 14, minHeight: 120 }}>
                  <div style={{ position: "relative", width: 110, height: 110, flex: "none" }}>
                    <div className="orbit" style={{ position: "absolute", inset: 0 }}>
                      {genKinds[0] && <div className="counter" style={{ position: "absolute", left: 30, top: -6 }}><Fruta kind={genKinds[0]} stage={2} ring={false} size={50} decorative /></div>}
                      {genKinds[1] && <div className="counter" style={{ position: "absolute", left: -4, top: 44 }}><Fruta kind={genKinds[1]} stage={2} ring={false} size={42} decorative /></div>}
                      {genKinds[2] && <div className="counter" style={{ position: "absolute", left: 64, top: 44 }}><Fruta kind={genKinds[2]} stage={1} ring={false} size={48} decorative /></div>}
                    </div>
                    <img
                      src="/images/3d/canasta.png"
                      alt=""
                      style={{
                        width: 110,
                        height: 75,
                        objectFit: "contain",
                        position: "absolute",
                        left: 0,
                        bottom: -6,
                        filter: "drop-shadow(0 6px 12px rgba(70,45,20,0.18))",
                      }}
                    />
                  </div>
                  <span className="bric" style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>Mezclando lo que tienes…</span>
                </div>
              )}
              {gen.state === "done" && (
                <div className="pop" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <DishArt dish={gen.recipe.dish} recipeId={gen.recipe.id} color={gen.recipe.color} topping={gen.recipe.topping} size={84} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#A04A1E" }}>Idea nueva · aún sin validar</span>
                      <span className="bric" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.02 }}>{gen.recipe.name}</span>
                      <span style={{ fontSize: 14, color: C.suave }}>{gen.recipe.time} · {gen.recipe.steps.some((s) => s.action === "hervir" || s.action === "hornear") ? "con fuego" : "sin cocinar"}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <a href={`#/receta/${gen.recipe.id}`} className="press" style={{ flex: 1, height: 48, borderRadius: 24, background: C.hoja, color: "#FFFFFF", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>Ver cómo</a>
                    <button className="press" onClick={generate} style={{ height: 48, padding: "0 18px", borderRadius: 24, background: C.bandeja, fontSize: 16, fontWeight: 600 }}>Otra idea</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "24px 20px 0" }}>
            <h2 className="bric" style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>Vitrina</h2>
            <span role="status" className="num" style={{ fontSize: 14, color: C.suave }}>{list.length === 1 ? "1 receta" : `${list.length} recetas`}</span>
          </div>

          {list.length > 0 ? (
            <div className="recipe-grid">
              {list.map((r, i) => (
                <a key={r.id} href={`#/receta/${r.id}`} className="press tray enter" style={{ position: "relative", display: "flex", flexDirection: "column", gap: 4, padding: "0 12px 12px", borderRadius: 24, animationDelay: `${i * 40}ms` }}>
                  <DishArt dish={r.dish} recipeId={r.id} color={r.color} topping={r.topping} size={96} style={{ margin: "-30px auto 0", display: "block" }} />
                  {r.validated && (
                    <span title="Validada por Nutrición" aria-label="Validada por Nutrición" style={{ position: "absolute", right: 10, top: 10, width: 34, height: 34, borderRadius: "50%", background: C.hoja, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "inset 0 0 0 3px #3D8049, 0 3px 6px rgba(31,60,30,.35)" }}><IconCheck size={16} strokeWidth={3} /></span>
                  )}
                  {r.id.startsWith("ia-") && <span style={{ fontSize: 12, fontWeight: 700, color: "#A04A1E" }}>Idea tuya</span>}
                  <span className="bric" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.08, minHeight: 40 }}>{r.name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: C.suave }}><IconClock size={14} />{r.time}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 13, fontWeight: 600, marginTop: 2 }}>Rescata
                    {r.saves.map((k) => <Fruta key={k} kind={k} stage={2} ring={false} size={28} label={FOODS[k].name} />)}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <div className="enter" style={{ margin: "18px 20px 0", padding: 22, borderRadius: 24, background: C.bandeja, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
              <img
                src="/images/3d/receta.png"
                alt=""
                style={{ width: 90, height: 90, objectFit: "contain", opacity: 0.7 }}
              />
              <span style={{ fontSize: 16, fontWeight: 700 }}>Nada con esos filtros</span>
              <button className="press" onClick={() => { setPicked({}); setTags({}); }} style={{ height: 44, padding: "0 18px", borderRadius: 22, background: "#FFFFFF", fontSize: 15, fontWeight: 600, color: C.hoja }}>Quitar filtros</button>
            </div>
          )}
        </div>
      </div>
      <BottomNav active="recetas" />
    </section>
  );
}
