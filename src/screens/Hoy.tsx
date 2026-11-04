import { useMemo, useState } from "react";
import { FOODS, STAGE_COLORS, type Stage } from "../data/foods";
import { buildNotices, byUrgency, computeStats, currentStage, fmtKg, openItems, stageWord, whenLabel } from "../lib/domain";
import { askCandidate, ideaName, itemName, plateItems, recipeFor } from "../lib/pick";
import { actions, useStore } from "../state/store";
import { BottomNav, C, useNow } from "../ui/Common";
import { Fruta } from "../ui/Fruta";
import { Difficulty, IconBell, IconCheck, IconChevron, IconClock, IconScan, IconStar } from "../ui/Icons";
import { DishArt, PotSprout, Smoothie } from "../ui/Illustrations";

/* Posiciones del plato (de la más urgente a la menos), tal cual el diseño */
const SLOTS = [
  { left: 106, top: 134, size: 170, delay: 360 },
  { left: 8, top: 106, size: 142, delay: 280 },
  { left: 270, top: 94, size: 106, delay: 200 },
  { left: 164, top: 54, size: 100, delay: 120 },
];
const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const FEEDBACK = ["Anotado. Aún aguanta.", "Anotado. Úsalo pronto.", "Anotado. Pasa a Úsalo hoy."];

export default function Hoy() {
  const now = useNow();
  const items = useStore((s) => s.items);
  const events = useStore((s) => s.events);
  const profile = useStore((s) => s.profile);
  const seenAt = useStore((s) => s.seenNoticesAt);
  const generated = useStore((s) => s.generated);
  const plate = useMemo(() => plateItems(items, now), [items, now]);
  const [selId, setSelId] = useState<string | null>(null);
  const sel = plate.find((p) => p.id === selId) ?? plate[0] ?? null;
  const stats = useMemo(() => computeStats(events, now), [events, now]);
  const unseen = useMemo(() => buildNotices(items, events, ideaName, now).filter((n) => n.at > seenAt).length, [items, events, now, seenAt]);
  const toUse = openItems(items).filter((i) => currentStage(i, now) >= 2).length;
  const urgent = byUrgency(openItems(items), now)[0];
  const idea = urgent ? recipeFor(urgent.kind, currentStage(urgent, now), generated) : null;
  const ask = askCandidate(items, now);
  const [answered, setAnswered] = useState<{ id: string; stage: Stage } | null>(null);
  const askItem = answered ? items.find((i) => i.id === answered.id) ?? ask : ask;

  const sub = `${DAYS[new Date(now).getDay()]} · ${openItems(items).length === 0 ? "canasta vacía" : toUse === 0 ? "todo bien por ahora" : toUse === 1 ? "1 cosa por usar" : `${toUse} cosas por usar`}`;

  return (
    <section aria-label="Hoy" className="screen grain enter">
      <div className="scroll" style={{ paddingBottom: 128 }}>
        <div className="zoomable">
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 20px 0" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 17, fontWeight: 600 }}>{profile.name ? `Buenas, ${profile.name}` : "Buenas"}</span>
              <span style={{ fontSize: 14, color: C.suave }}>{sub}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <a href="#/avisos" className="press tray" aria-label={unseen ? `Avisos, ${unseen} nuevos` : "Avisos"} style={{ position: "relative", width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconBell />
                {unseen > 0 && <span aria-hidden="true" style={{ position: "absolute", right: 9, top: 9, width: 9, height: 9, borderRadius: "50%", background: C.papaya, boxShadow: "0 0 0 2px #FFFFFF" }} />}
              </a>
              <a href="#/huerta" className="press tray" aria-label={`Tu huerta, nivel ${stats.levelName}`} style={{ display: "flex", alignItems: "center", gap: 6, height: 44, padding: "0 14px 0 6px", borderRadius: 22 }}>
                <PotSprout size={34} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{stats.levelName}</span>
              </a>
            </div>
          </header>

          <h1 className="bric" style={{ margin: "18px 20px 0", fontSize: 50, fontWeight: 800, lineHeight: 0.92, letterSpacing: "-0.035em" }}>Úsalo hoy</h1>

          <div className="scene" style={{ height: 304, marginTop: -18 }}>
            <div style={{ position: "absolute", left: 6, right: 6, top: 122, height: 170, borderRadius: "50%", background: C.plato, boxShadow: "inset 0 8px 20px rgba(120,84,40,0.12), 0 1px 0 rgba(255,255,255,0.9)" }} />
            {plate.length === 0 && (
              <div className="fadein" style={{ position: "absolute", left: 40, right: 40, top: 150, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center" }}>
                <span className="bric" style={{ fontSize: 22, fontWeight: 700 }}>Tu plato está vacío</span>
                <span style={{ fontSize: 15, color: C.media }}>Tómale una foto a lo que tienes.</span>
                <a href="#/escanear" className="press" style={{ display: "flex", alignItems: "center", gap: 6, height: 48, padding: "0 20px", borderRadius: 24, background: C.papaya, fontSize: 16, fontWeight: 700 }}><IconScan size={22} />Escanear</a>
              </div>
            )}
            {[...plate.keys()].reverse().map((idx) => {
              const it = plate[idx];
              const slot = SLOTS[idx];
              const st = currentStage(it, now);
              return (
                <button
                  key={it.id}
                  className="press drop"
                  onClick={() => setSelId(it.id)}
                  aria-label={`${itemName(it)}, ${stageWord(st).toLowerCase()}`}
                  aria-pressed={sel?.id === it.id}
                  style={{ position: "absolute", left: slot.left, top: slot.top, width: slot.size, height: slot.size, animationDelay: `${slot.delay}ms` }}
                >
                  <Fruta kind={it.kind} stage={st} size={slot.size} lifted={sel?.id === it.id} decorative />
                </button>
              );
            })}
          </div>

          {sel && (
            <div className="tray" role="status" style={{ display: "flex", alignItems: "center", gap: 12, margin: "0 20px", padding: "10px 10px 10px 16px", borderRadius: 20 }}>
              <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: "50%", background: STAGE_COLORS[currentStage(sel, now)], flex: "none" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{itemName(sel)} · {stageWord(currentStage(sel, now))}</span>
                <span style={{ fontSize: 14, color: C.suave }}>{whenLabel(sel, now)}</span>
              </div>
              <a href={`#/ficha/${sel.kind}`} className="press" style={{ display: "flex", alignItems: "center", gap: 2, height: 44, padding: "0 10px 0 16px", borderRadius: 22, background: C.hojaClaro, color: C.hoja, fontSize: 15, fontWeight: 600 }}>Ficha<IconChevron /></a>
            </div>
          )}

          {idea && urgent && (
            <div className="tray" style={{ position: "relative", display: "flex", gap: 12, alignItems: "center", margin: "34px 20px 0", padding: "0 16px 16px 8px", borderRadius: 24 }}>
              <div style={{ position: "relative", width: 110, height: 128, marginTop: -26, flex: "none", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                {idea.dish === "glass" ? <Smoothie color={idea.color} /> : <DishArt dish={idea.dish} recipeId={idea.id} color={idea.color} topping={idea.topping} size={110} />}
                <div style={{ position: "absolute", right: -8, top: -6 }}><Fruta kind={urgent.kind} stage={currentStage(urgent, now)} ring={false} size={54} decorative /></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, paddingTop: 14 }}>
                <span style={{ fontSize: 14, color: C.suave }}>Tu idea de hoy</span>
                <span className="bric" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.02, letterSpacing: "-0.02em" }}>{idea.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.suave }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><IconClock />{idea.time}</span>
                  <Difficulty level={idea.difficulty} dot={7} />
                </div>
                <a href={`#/receta/${idea.id}`} className="press" style={{ alignSelf: "flex-start", height: 48, padding: "0 22px", borderRadius: 24, background: C.hoja, color: "#FFFFFF", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", boxShadow: "inset 0 1px 0 rgba(255,255,255,.18), 0 6px 14px -6px rgba(47,107,58,.7)" }}>Ver cómo</a>
              </div>
            </div>
          )}

          {askItem && (
            <div style={{ margin: "16px 20px 0", padding: "18px 14px 14px", borderRadius: 24, background: C.bandeja, display: "flex", flexDirection: "column", gap: 12 }}>
              <h2 className="bric" style={{ margin: "0 4px", fontSize: 22, fontWeight: 700, letterSpacing: "-0.015em" }}>
                ¿Cómo {askItem.qty > 1 || askItem.kind === "fresa" ? "están tus" : "está tu"} {itemName(askItem).toLowerCase()}?
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                {([0, 1, 2] as Stage[]).map((n) => {
                  const on = answered?.id === askItem.id && answered.stage === n;
                  return (
                    <button
                      key={n}
                      className="press"
                      onClick={() => {
                        actions.setStage(askItem.id, n);
                        setAnswered({ id: askItem.id, stage: n });
                      }}
                      aria-pressed={on}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 4px 10px", borderRadius: 18, background: "#FFFFFF", border: `2px solid ${on ? C.hoja : "transparent"}`, transition: "border-color 180ms ease" }}
                    >
                      <Fruta kind={askItem.kind} stage={n} ring={false} size={86} decorative />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{FOODS[askItem.kind].stageNames[n]}</span>
                    </button>
                  );
                })}
              </div>
              {answered?.id === askItem.id && (
                <p role="status" className="fadein" style={{ margin: "0 4px", display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 600, color: C.hoja }}><IconCheck />{FEEDBACK[answered.stage]}</p>
              )}
            </div>
          )}

          <a href="#/huerta" className="press tray" style={{ display: "flex", alignItems: "center", gap: 14, margin: "16px 20px 0", padding: "12px 14px", borderRadius: 24 }}>
            <PotSprout size={58} shadow />
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <span className="bric num" style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em" }}>{fmtKg(stats.weekRescuedKg)} kg</span>
              <span style={{ fontSize: 14, color: C.suave }}>rescatados esta semana</span>
            </div>
            <IconChevron size={22} style={{ color: C.suave }} />
          </a>

          <a
            href="#/resenas"
            className="press"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              margin: "14px 20px 0",
              padding: "12px 16px",
              borderRadius: 20,
              background: "linear-gradient(135deg, #FFFFFF 0%, #FFF9EB 100%)",
              border: "1px solid #EEE6D8",
              boxShadow: "0 4px 12px rgba(110,74,30,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(233,181,48,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconStar size={18} filled color="#E9B530" />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.tinta }}>¿Te gusta FRESCA? Valóranos con estrellas</span>
                <span style={{ fontSize: 12, color: C.suave }}>4.9 ★ · Deja tu reseña o lee las opiniones</span>
              </div>
            </div>
            <IconChevron size={18} style={{ color: C.suave }} />
          </a>
        </div>
      </div>
      <BottomNav active="hoy" />
    </section>
  );
}
