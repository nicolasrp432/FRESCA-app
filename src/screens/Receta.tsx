import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Kind } from "../data/foods";
import { PANTRY, recipeById, type Recipe, type Step } from "../data/recipes";
import { useWakeLock, vibrate } from "../lib/device";
import { computeStats, fmtKg, fmtPesos, LEVELS, openItems } from "../lib/domain";
import { navigate } from "../lib/router";
import { actions, getState, useStore } from "../state/store";
import { BackButton, C, ghostBtn, primaryBtn, Seeds } from "../ui/Common";
import { Fruta } from "../ui/Fruta";
import { ActionIcon, IconBack, IconCheck, IconClock, IconClose, IconPhone } from "../ui/Icons";
import { Cinnamon, DishArt, MilkMug, PantryJar, Smoothie } from "../ui/Illustrations";

type View = "portada" | "paso" | "final" | "celebra";

export default function Receta({ id }: { id: string }) {
  const generated = useStore((s) => s.generated);
  const recipe = recipeById(id, generated);
  if (!recipe) {
    return (
      <div className="screen grain" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 24, textAlign: "center" }}>
        <h1 className="bric" style={{ fontSize: 30, fontWeight: 800 }}>Esa receta ya no está</h1>
        <a href="#/recetas" className="press" style={primaryBtn(56, { width: "auto", padding: "0 24px" })}>Ver recetas</a>
      </div>
    );
  }
  return <RecetaFlow recipe={recipe} />;
}

function RecetaFlow({ recipe }: { recipe: Recipe }) {
  const [view, setView] = useState<View>("portada");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<{ grams: number; pesos: number; levelBefore: number; levelAfter: number } | null>(null);
  const items = useStore((s) => s.items);
  const pantry = useStore((s) => s.pantry);
  const held = useWakeLock(view === "paso");
  const art = (w: number, h: number, cls?: string) =>
    recipe.dish === "glass" ? <Smoothie width={w} height={h} color={recipe.color} className={cls} /> : <DishArt dish={recipe.dish} color={recipe.color} topping={recipe.topping} size={w} style={{ display: "block" }} />;

  const has = (kind: Kind, qty: number) => openItems(items).filter((i) => i.kind === kind).reduce((a, i) => a + i.qty, 0) >= qty;

  const done = () => {
    const before = computeStats(getState().events).level;
    const r = actions.cookRecipe(recipe);
    const after = computeStats(getState().events).level;
    setResult({ ...r, levelBefore: before, levelAfter: after });
    vibrate([20, 60, 20]);
    setView("celebra");
  };

  return (
    <div className="screen">
      {view === "portada" && (
        <section aria-label={recipe.name} className="screen grain enter">
          <div className="scroll" style={{ paddingBottom: 110 }}>
            <div className="zoomable">
              <div style={{ padding: "14px 12px 0" }}><BackButton close label="Salir de la receta" /></div>
              <div className={recipe.dish === "glass" ? "sway" : undefined} style={{ width: 170, height: 212, margin: "-8px auto 0", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>{art(170, 212)}</div>
              <h1 className="bric" style={{ margin: "6px 20px 6px", textAlign: "center", fontSize: 38, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>{recipe.name}</h1>
              {!recipe.validated && <p style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "#A04A1E", marginBottom: 4 }}>{recipe.id.startsWith("ia-") ? "Idea nueva · aún sin validar por Nutrición" : "Aún sin validar por Nutrición"}</p>}
              <div style={{ display: "flex", justifyContent: "center", gap: 16, fontSize: 15, color: C.suave }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}><IconClock />{recipe.time}</span>
                <span>{recipe.serves}</span>
                <span>{["Fácil", "Media", "Retadora"][recipe.difficulty - 1]}</span>
              </div>
              <p style={{ margin: "22px 20px 10px", fontSize: 18, fontWeight: 700 }}>Necesitas</p>
              <div className="wood" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6, rowGap: 14, margin: "0 20px", padding: "14px 8px 12px", borderRadius: 24, boxShadow: "inset 0 -5px 0 rgba(120,76,36,.2), 0 10px 20px -12px rgba(110,74,30,.5)" }}>
                {recipe.ingredients.map((ing) => {
                  const ok = ing.kind ? has(ing.kind, ing.qty) : ing.pantry ? pantry.includes(ing.pantry) : true;
                  const visual = ing.kind ? (
                    <div style={{ position: "relative", width: 96, height: 76 }}>
                      <div style={{ position: "absolute", left: ing.qty > 1 ? 0 : 13, top: -6 }}><Fruta kind={ing.kind} stage={2} ring={false} size={70} decorative /></div>
                      {ing.qty > 1 && <div style={{ position: "absolute", left: 24, top: 8 }}><Fruta kind={ing.kind} stage={2} ring={false} size={70} decorative /></div>}
                    </div>
                  ) : (
                    <div style={{ width: 76, height: 76, display: "flex", alignItems: "center", justifyContent: "center", border: ok ? "none" : "2px dashed rgba(43,33,18,.55)", borderRadius: 22 }}>
                      {ing.pantry === "leche" ? <MilkMug /> : ing.pantry === "canela" ? <Cinnamon /> : <PantryJar color={PANTRY[ing.pantry ?? ""]?.color} faded={!ok} />}
                    </div>
                  );
                  const check = ok && <span aria-hidden="true" style={{ position: "absolute", right: 0, top: 0, width: 24, height: 24, borderRadius: "50%", background: C.hoja, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}><IconCheck size={14} strokeWidth={3} /></span>;
                  const label = <span style={{ fontSize: 15, fontWeight: 700, color: "#2B2112", textAlign: "center", lineHeight: 1.15 }}>{ing.label}{ok ? "" : " · falta"}</span>;
                  const body = <><div style={{ position: "relative", width: 96, display: "flex", justifyContent: "center" }}>{visual}{check}</div>{label}</>;
                  return ing.pantry ? (
                    <button key={ing.label} className="press" onClick={() => actions.togglePantry(ing.pantry!)} aria-pressed={ok} aria-label={`${ing.label}: ${ok ? "lo tienes" : "falta"}. Toca para cambiar`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>{body}</button>
                  ) : (
                    <div key={ing.label} role="group" aria-label={`${ing.label}: ${ok ? "lo tienes" : "falta"}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>{body}</div>
                  );
                })}
              </div>
              <p style={{ margin: "8px 24px 0", fontSize: 13, color: C.suave }}>Toca lo de la despensa para marcar si lo tienes.</p>
            </div>
          </div>
          <div style={{ position: "absolute", left: 20, right: 20, bottom: "calc(26px + env(safe-area-inset-bottom))" }}>
            <button className="press" onClick={() => { setStep(0); setView("paso"); }} style={primaryBtn(60)}>¡A cocinar!</button>
          </div>
        </section>
      )}

      {view === "paso" && (
        <section aria-label="Modo cocina" className="screen wood fadein">
          <div style={{ display: "flex", gap: 6, padding: "calc(16px + env(safe-area-inset-top)) 20px 0" }}>
            {recipe.steps.map((_, i) => <span key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i <= step ? C.tinta : "rgba(31,42,30,.18)", transition: "background 240ms ease" }} />)}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px 0" }}>
            <button className="press" onClick={() => setView("portada")} aria-label="Salir del modo cocina" style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,.5)", display: "flex", alignItems: "center", justifyContent: "center" }}><IconClose /></button>
            {held && <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 16, background: "rgba(255,255,255,.55)", fontSize: 13, fontWeight: 600, color: "#2B2112" }}><IconPhone />Pantalla encendida</span>}
          </div>
          <StepView key={step} step={recipe.steps[step]} recipe={recipe} />
          <div style={{ position: "absolute", left: 20, right: 20, bottom: "calc(26px + env(safe-area-inset-bottom))", display: "flex", gap: 12, alignItems: "center" }}>
            <button className="press" onClick={() => (step > 0 ? setStep(step - 1) : setView("portada"))} aria-label="Paso anterior" style={{ width: 76, height: 76, flex: "none", borderRadius: "50%", background: "rgba(255,255,255,.6)", display: "flex", alignItems: "center", justifyContent: "center" }}><IconBack size={28} strokeWidth={2.4} /></button>
            <button className="press bric" onClick={() => { vibrate(15); if (step < recipe.steps.length - 1) setStep(step + 1); else setView("final"); }} style={{ flex: 1, height: 92, borderRadius: 46, background: C.hoja, color: "#FFFFFF", fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "inset 0 2px 0 rgba(255,255,255,.18), 0 14px 24px -10px rgba(31,60,30,.8)" }}>
              <IconCheck size={30} strokeWidth={2.8} />Listo
            </button>
          </div>
        </section>
      )}

      {view === "final" && (
        <section aria-label="Plato listo" className="screen grain fadein">
          <div className="scene" style={{ position: "absolute", top: 90, height: 330 }}>
            {recipe.saves.slice(0, 2).map((k, i) => (
              <div key={k + i} className="fuse" style={{ position: "absolute", left: i ? 210 : 60, top: i ? 160 : 150, animationDelay: `${i * 140}ms` }}><Fruta kind={k} stage={2} ring={false} size={110} decorative /></div>
            ))}
            {recipe.saves.length === 1 && <div className="fuse" style={{ position: "absolute", left: 210, top: 160, animationDelay: "140ms" }}><Fruta kind={recipe.saves[0]} stage={2} ring={false} size={110} decorative /></div>}
            <div className="pop" style={{ position: "absolute", left: 115, top: 40, animationDelay: "1000ms" }}>{art(160, 200)}</div>
          </div>
          <h1 className="bric" style={{ position: "absolute", left: 20, right: 20, top: 470, textAlign: "center", fontSize: 44, fontWeight: 800, letterSpacing: "-0.035em" }}>¿Lo hiciste?</h1>
          <div style={{ position: "absolute", left: 20, right: 20, bottom: "calc(30px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="press" onClick={done} style={primaryBtn(64, { fontSize: 20 })}>¡Sí, lo hice!</button>
            <button className="press" onClick={() => navigate("/hoy")} style={ghostBtn(52, { fontSize: 17 })}>Después</button>
          </div>
        </section>
      )}

      {view === "celebra" && result && <Celebra recipe={recipe} result={result} art={art(150, 188)} />}
    </div>
  );
}

function Celebra({ result, art }: { recipe: Recipe; result: { grams: number; pesos: number; levelBefore: number; levelAfter: number }; art: ReactNode }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let k = 0;
    const id = window.setInterval(() => {
      k += 1;
      setT(Math.min(1, k / 24));
      if (k >= 24) window.clearInterval(id);
    }, 38);
    return () => window.clearInterval(id);
  }, []);
  const kg = (result.grams / 1000) * t;
  const pesos = Math.round((result.pesos * t) / 100) * 100;
  const up = result.levelAfter > result.levelBefore;
  const growth = result.grams === 0 ? "Agrega lo que compres y lo contamos" : up ? (result.levelAfter === 1 ? "Tu matera sacó un brote nuevo" : `Tu huerta subió a ${LEVELS[result.levelAfter].name}`) : "Tu matera creció un poquito";

  return (
    <section aria-label="Lo rescataste" className="screen warm" style={{ backgroundColor: "#FBF7EF" }}>
      <div className="scene" style={{ height: "100%" }}>
        <div aria-hidden="true" style={{ position: "absolute", left: 195, top: 210, width: 0, height: 0 }}><Seeds /></div>
        <div className="pop" style={{ position: "absolute", left: 120, top: 92 }}>{art}</div>
        <h1 className="bric enter" style={{ position: "absolute", left: 20, right: 20, top: 300, textAlign: "center", fontSize: 46, fontWeight: 800, letterSpacing: "-0.035em", animationDelay: "150ms" }}>¡Lo rescataste!</h1>
        <div role="status" style={{ position: "absolute", left: 20, right: 20, top: 380, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <div style={{ padding: "14px 16px", borderRadius: 24, background: "rgba(255,255,255,.72)" }}>
            <span className="bric num" style={{ display: "block", fontSize: 48, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>{fmtKg(kg)}</span>
            <span style={{ fontSize: 15, fontWeight: 600 }}>kg rescatados</span>
          </div>
          <div style={{ padding: "14px 16px", borderRadius: 24, background: "rgba(255,255,255,.72)" }}>
            <span className="bric num" style={{ display: "block", fontSize: 48, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>${fmtPesos(pesos)}</span>
            <span style={{ fontSize: 15, fontWeight: 600 }}>pesos ahorrados</span>
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 510, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <img
            src="/images/3d/huerta.png"
            alt="Matera creciendo"
            className="grow"
            style={{ width: 140, height: 140, objectFit: "contain", filter: "drop-shadow(0 12px 24px rgba(47,107,58,0.28))" }}
          />
          <span style={{ fontSize: 15, fontWeight: 600 }}>{growth}</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 20, right: 20, bottom: "calc(30px + env(safe-area-inset-bottom))" }}>
        <button className="press" onClick={() => navigate("/hoy")} style={primaryBtn(60, { boxShadow: "none" })}>Seguir</button>
      </div>
    </section>
  );
}

/* ── Un paso del modo cocina ─────────────────────── */
function StepView({ step, recipe }: { step: Step; recipe: Recipe }) {
  const shown = (step.show?.length ? step.show : recipe.saves).slice(0, 2);
  return (
    <div className="enter scene" style={{ position: "absolute", top: 130, height: 520 }}>
      {step.timer ? (
        <Timer seconds={step.timer} action={step.action} color={recipe.color} />
      ) : step.action === "cortar" ? (
        <>
          <div style={{ position: "absolute", left: 30, top: 90, transform: "rotate(-8deg)" }}><Fruta kind={shown[0]} stage={2} ring={false} size={150} decorative /></div>
          <div style={{ position: "absolute", left: 150, top: 120 }}><Fruta kind={shown[1] ?? shown[0]} stage={2} ring={false} size={190} decorative /></div>
          <div style={{ position: "absolute", left: 70, top: 250, display: "flex", gap: 10 }}>
            {[300, 1200, 2100, 3000].map((d) => <span key={d} className="pop" style={{ width: 38, height: 38, borderRadius: "50%", background: "#FFF1C4", boxShadow: "inset 0 0 0 4px #F3D98A, 0 4px 8px rgba(90,62,34,.25)", animationDelay: `${d}ms` }} />)}
          </div>
          <div className="chop" aria-hidden="true" style={{ position: "absolute", left: 150, top: 70, width: 200, height: 70 }}>
            <svg width="200" height="70" viewBox="0 0 160 56"><path d="M8 34 C 40 34, 92 30, 116 20 L 116 40 L 8 40 C 4 40, 4 34, 8 34 Z" fill="#CBD1CA" /><path d="M8 34 C 40 34, 92 30, 116 20 L 116 26 C 92 34, 40 38, 8 38 Z" fill="#E9EDE8" /><rect x="116" y="22" width="40" height="18" rx="7" fill="#8A5A32" /><circle cx="128" cy="31" r="2" fill="#E8C690" /><circle cx="144" cy="31" r="2" fill="#E8C690" /></svg>
          </div>
        </>
      ) : step.action === "servir" ? (
        <div style={{ position: "absolute", left: 115, top: 40 }}>
          <img
            src="/images/3d/smoothie.png"
            alt="Servir plato"
            className="fillup"
            style={{ width: 160, height: 160, objectFit: "contain", filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.2))" }}
          />
        </div>
      ) : (
        <>
          <div style={{ position: "absolute", left: 125, top: 30, width: 140, height: 140, borderRadius: 40, background: "rgba(255,255,255,.6)", display: "flex", alignItems: "center", justifyContent: "center" }}><ActionIcon action={step.action} size={84} /></div>
          <div className="pop" style={{ position: "absolute", left: 60, top: 170, animationDelay: "200ms" }}><Fruta kind={shown[0]} stage={2} ring={false} size={140} decorative /></div>
          {shown[1] && <div className="pop" style={{ position: "absolute", left: 200, top: 180, animationDelay: "320ms" }}><Fruta kind={shown[1]} stage={2} ring={false} size={120} decorative /></div>}
        </>
      )}
      <div style={{ position: "absolute", left: 24, right: 24, top: 330, textAlign: "center" }}>
        <p className="bric" style={{ fontSize: 64, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>{step.verb}</p>
        <p style={{ marginTop: 6, fontSize: 22, fontWeight: 600 }}>{step.detail}</p>
        {step.note && <p style={{ marginTop: 2, fontSize: 14, color: "#3B2E1E" }}>{step.note}</p>}
      </div>
    </div>
  );
}

/** Temporizador real: anillo que se vacía, se puede pausar y avisa al terminar */
function Timer({ seconds, action, color }: { seconds: number; action: Step["action"]; color: string }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const endAt = useRef(0);
  useEffect(() => {
    if (!running) return;
    endAt.current = Date.now() + left * 1000;
    const id = window.setInterval(() => {
      const l = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setLeft(l);
      if (l === 0) {
        setRunning(false);
        vibrate([200, 100, 200]);
        beep();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);
  const pct = (left / seconds) * 100;
  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, "0");
  const label = useMemo(() => (left === 0 ? "¡Tiempo!" : `${mm}:${ss}`), [left, mm, ss]);
  return (
    <>
      <svg aria-hidden="true" width="320" height="320" viewBox="0 0 320 320" style={{ position: "absolute", left: 35, top: 0, transform: "rotate(-90deg)" }}>
        <circle cx="160" cy="160" r="148" fill="none" stroke="rgba(43,33,18,.15)" strokeWidth="12" />
        <circle cx="160" cy="160" r="148" fill="none" stroke={C.hoja} strokeWidth="12" strokeLinecap="round" pathLength={100} strokeDasharray="100 100" strokeDashoffset={100 - pct} style={{ transition: "stroke-dashoffset 300ms linear" }} />
      </svg>
      <div style={{ position: "absolute", left: 95, top: 36, width: 200, height: 170, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {action === "licuar" ? (
          <svg aria-hidden="true" width="114" height="170" viewBox="0 0 160 240">
            <ellipse cx="80" cy="232" rx="58" ry="7" fill="#5A3E22" opacity="0.25" />
            <path d="M30 176 L 130 176 L 124 226 C 123 230, 37 230, 36 226 Z" fill="#3E4A3C" />
            <rect x="66" y="196" width="28" height="14" rx="7" fill="#F28C5B" />
            <path d="M38 36 L 122 36 L 112 172 L 48 172 Z" fill="#FFFFFF" fillOpacity="0.55" stroke="#D8CBB4" strokeWidth="2" />
            <path d="M44 92 L 116 92 L 111 170 L 49 170 Z" fill={color} />
            <g className={running ? "spin" : undefined}><path d="M60 158 L 100 158 M80 148 L 80 168" stroke="#7E8A7C" strokeWidth="5" strokeLinecap="round" /></g>
            <rect x="34" y="24" width="92" height="16" rx="6" fill="#2F6B3A" />
          </svg>
        ) : (
          <div className={running ? "breathe" : undefined} style={{ width: 120, height: 120, borderRadius: 36, background: "rgba(255,255,255,.6)", display: "flex", alignItems: "center", justifyContent: "center" }}><ActionIcon action={action} size={76} /></div>
        )}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 210, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <span className="bric num" role="timer" aria-live="off" style={{ fontSize: 34, fontWeight: 800 }}>{label}</span>
        {left > 0 && (
          <button className="press" onClick={() => setRunning(!running)} style={{ height: 44, padding: "0 20px", borderRadius: 22, background: running ? "rgba(255,255,255,.6)" : C.tinta, color: running ? C.tinta : "#FFFFFF", fontSize: 15, fontWeight: 700 }}>
            {running ? "Pausar" : left === seconds ? "Iniciar" : "Seguir"}
          </button>
        )}
      </div>
    </>
  );
}

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    g.gain.value = 0.15;
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.4);
  } catch {
    /* sin sonido */
  }
}

