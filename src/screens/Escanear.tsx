import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FOODS, KINDS, STAGE_COLORS, type Kind, type Stage } from "../data/foods";
import { RECIPES } from "../data/recipes";
import { analyze, brightness, fileToJpegWithMeta, FrescaError, toJpegWithMeta, type Analysis, type ColorMeta, type DetectedItem } from "../lib/api";
import { vibrate } from "../lib/device";
import { stageWord } from "../lib/domain";
import { navigate, query, usePath } from "../lib/router";
import { actions } from "../state/store";
import { C, ghostBtn, primaryBtn, Toast } from "../ui/Common";
import { Fruta } from "../ui/Fruta";
import { Difficulty, IconAlert, IconBack, IconBasket, IconCheck, IconClock, IconClose, IconGallery, IconRetry, IconSun, IconTorch } from "../ui/Icons";
import { Compost, SaveArt } from "../ui/Illustrations";

const RECIPE_3D: Record<string, string> = {
  "batido-banano": "/images/3d/smoothie.png",
  "pan-banano": "/images/3d/receta-pan.png",
  "jugo-papaya-fresa": "/images/3d/smoothie.png",
  "paletas-papaya": "/images/3d/receta-paleta.png",
  "mermelada-fresa": "/images/3d/receta-mermelada.png",
  "hogao": "/images/3d/receta-hogao.png",
  "guacamole": "/images/3d/receta-guacamole.png",
  "avena-banano": "/images/3d/receta-avena.png",
  "limonada-casera": "/images/3d/smoothie.png",
};

type View = "camara" | "analizando" | "resultado" | "danio" | "noreco";
interface Found extends DetectedItem {
  uid: string;
  /** la persona confirmó el tipo cuando había duda */
  sure: boolean;
  removed?: boolean;
}

const MSGS = ["Mirando esas pintas…", "Revisando la cáscara…", "Contando lo que hay…"];
const LOW = 0.7;

export default function Escanear() {
  const path = usePath();
  const mercado = query(path).get("modo") === "mercado";
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [view, setView] = useState<View>("camara");
  const [camErr, setCamErr] = useState<string | null>(null);
  const [torchOk, setTorchOk] = useState(false);
  const [torch, setTorch] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [msg, setMsg] = useState(0);
  const [found, setFound] = useState<Found[] | null>(null);
  const [others, setOthers] = useState<string[]>([]);
  const [focus, setFocus] = useState<string | null>(null);
  const [added, setAdded] = useState(0);
  const [noreco, setNoreco] = useState<{ title: string; sub: string; dark: boolean; aiOff?: boolean }>({ title: "", sub: "", dark: false });
  const [retries, setRetries] = useState(0);
  const [toast, setToast] = useState("");

  /* ── Cámara ─────────────────────────────── */
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setCamErr(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamErr("Este navegador no deja usar la cámara. Sube una foto de la galería.");
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play().catch(() => undefined);
      }
      const track = s.getVideoTracks()[0];
      const caps = (track.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
      setTorchOk(Boolean(caps.torch));
    } catch (e) {
      const name = (e as Error).name;
      setCamErr(name === "NotAllowedError" ? "Necesito permiso para usar la cámara. Puedes darlo en los ajustes del navegador, o subir una foto." : "No pude abrir la cámara. Sube una foto de la galería.");
    }
  }, []);

  useEffect(() => {
    if (view === "camara") startCamera();
    else stopCamera();
    return () => {
      if (view === "camara") stopCamera();
    };
  }, [view, startCamera, stopCamera]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const setTorchOn = async (on: boolean) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] });
      setTorch(on);
    } catch {
      setTorchOk(false);
    }
  };

  /* ── Analizar ───────────────────────────── */
  const run = async (image: string, meta?: ColorMeta) => {
    setPhoto(`data:image/jpeg;base64,${image}`);
    setFound(null);
    setAdded(0);
    setMsg(0);
    setView("analizando");
    const tick = window.setInterval(() => setMsg((m) => (m + 1) % MSGS.length), 950);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res: Analysis = await analyze(image, meta, ac.signal);
      const items: Found[] = res.items
        .filter((i) => KINDS.includes(i.kind))
        .map((i, n) => ({ ...i, stage: Math.max(0, Math.min(3, i.stage)) as Stage, uid: `${i.kind}-${n}`, sure: i.confidence >= LOW || !i.alternative }));
      setOthers(res.others ?? []);
      if (!items.length) {
        const dark = res.quality === "oscura";
        setNoreco({
          title: res.others?.length ? `Veo ${res.others.slice(0, 2).join(" y ")}, pero aún no los conozco.` : "¿Eh? No la reconocí.",
          sub: dark ? "Está muy oscuro. Busca la luz." : res.quality === "borrosa" ? "Quedó movida. Quieto un segundo." : res.quality === "lejos" ? "Acércate un poco más." : "Pasa con la luz, o muy de cerca.",
          dark,
        });
        setView("noreco");
        return;
      }
      setFound(items);
      vibrate(30);
      window.setTimeout(() => !ac.signal.aborted && setView("resultado"), 1300);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      const code = e instanceof FrescaError ? e.code : "upstream";
      if (code === "offline") {
        navigate("/offline");
        return;
      }
      setNoreco(
        code === "rate" || code === "busy"
          ? { title: "Vamos muy rápido.", sub: "Espera un momentico y prueba otra vez.", dark: false }
          : { title: "Algo se enredó.", sub: "Prueba otra vez en un momento.", dark: false },
      );
      setView("noreco");
    } finally {
      window.clearInterval(tick);
    }
  };

  const shoot = async () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) {
      fileRef.current?.click();
      return;
    }
    vibrate(15);
    const light = brightness(v);
    const { image, meta } = await toJpegWithMeta(v, v.videoWidth, v.videoHeight);
    if (light < 22) {
      setPhoto(`data:image/jpeg;base64,${image}`);
      setNoreco({ title: "¿Eh? No la reconocí.", sub: "Está muy oscuro. Pasa con la luz, o muy de cerca.", dark: true });
      setView("noreco");
      return;
    }
    run(image, meta);
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const { image, meta } = await fileToJpegWithMeta(f);
      run(image, meta);
    } catch {
      setToast("No pude abrir esa foto. Prueba con otra.");
    }
  };

  const retry = async () => {
    setRetries((n) => n + 1);
    setView("camara");
    if (noreco.dark && torchOk) window.setTimeout(() => setTorchOn(true), 600);
  };

  /* ── Resultado ──────────────────────────── */
  const visible = (found ?? []).filter((f) => !f.removed);
  const healthy = visible.filter((f) => f.damage === "ninguno");
  const main = useMemo(() => [...healthy].sort((a, b) => b.stage - a.stage)[0] ?? null, [healthy]);
  const ladder = main ? RECIPES.filter((r) => r.saves.includes(main.kind)).slice(0, 4) : [];
  const damaged = visible.find((f) => f.uid === focus);

  const totalPesos = useMemo(
    () => healthy.reduce((acc, f) => acc + (FOODS[f.kind]?.pesos ?? 500) * f.count, 0),
    [healthy]
  );
  const totalGrams = useMemo(
    () => healthy.reduce((acc, f) => acc + (FOODS[f.kind]?.grams ?? 100) * f.count, 0),
    [healthy]
  );
  const totalKg = (totalGrams / 1000).toFixed(2);
  const totalCo2 = ((totalGrams / 1000) * 0.83).toFixed(2);

  const confirmKind = (f: Found, kind: Kind) => setFound((list) => list?.map((x) => (x.uid === f.uid ? { ...x, kind, sure: true, confidence: 1 } : x)) ?? null);

  const addAll = () => {
    const list = healthy.map((f) => ({ kind: f.kind, qty: f.count, stage: f.stage, confirmed: f.sure }));
    actions.addItems(list);
    setAdded(list.reduce((a, b) => a + b.qty, 0));
    vibrate(20);
  };

  const toCompost = (f: Found) => {
    actions.logToss(f.kind, f.count, "danio");
    setFound((list) => list?.map((x) => (x.uid === f.uid ? { ...x, removed: true } : x)) ?? null);
    setToast("A la tierra. La próxima te aviso antes.");
    setView("resultado");
  };
  const notMold = (f: Found) => {
    setFound((list) => list?.map((x) => (x.uid === f.uid ? { ...x, damage: "ninguno", stage: Math.min(2, x.stage) as Stage } : x)) ?? null);
    setView("resultado");
  };

  const damageTitle = (d: Found["damage"]) => (d === "moho" ? "Tiene moho" : d === "liquido" ? "Suelta líquido" : "Está podrido");
  const damageWhy = (f: Found) =>
    f.kind === "aguacate" ? "Si llegó a la pulpa, ya no sirve." : f.damage === "moho" ? "En frutas blandas el moho no se quita cortando." : "Mejor no arriesgarse con este.";

  return (
    <div className="screen" style={{ background: "#2E241A" }}>
      {toast && <Toast text={toast} onDone={() => setToast("")} />}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />

      {/* ============ ESCANEAR ============ */}
      {view === "camara" && (
        <section aria-label="Escanear" className="fadein" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <video ref={videoRef} playsInline muted autoPlay aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", background: "#2E241A" }} />
          {camErr && (
            <div className="scene" style={{ height: "100%" }} aria-hidden="true">
              <div style={{ position: "absolute", left: 0, right: 0, top: 300, bottom: 0, background: "#4A3424" }} />
              <div style={{ position: "absolute", left: 36, top: 424, width: 318, height: 124, borderRadius: "50%", background: "#6E4C2E", boxShadow: "inset 0 -14px 0 #4E3420" }} />
            </div>
          )}
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 140px 60px rgba(0,0,0,.62)", pointerEvents: "none" }} />
          <div className="breathe" aria-hidden="true" style={{ position: "absolute", left: 26, right: 26, top: "18%", bottom: "26%" }}>
            {(["tl", "tr", "bl", "br"] as const).map((k) => (
              <div key={k} style={{ position: "absolute", width: 56, height: 56, [k[0] === "t" ? "top" : "bottom"]: 0, [k[1] === "l" ? "left" : "right"]: 0, [`border${k[0] === "t" ? "Top" : "Bottom"}`]: "5px solid #F28C5B", [`border${k[1] === "l" ? "Left" : "Right"}`]: "5px solid #F28C5B", [`border${k[0] === "t" ? "Top" : "Bottom"}${k[1] === "l" ? "Left" : "Right"}Radius`]: 32 }} />
            ))}
          </div>
          {camErr && (
            <p role="alert" className="fadein" style={{ position: "absolute", left: 40, right: 40, top: "40%", textAlign: "center", color: "#FFFFFF", fontSize: 17, fontWeight: 600, lineHeight: 1.35 }}>{camErr}</p>
          )}
          <div style={{ position: "absolute", top: "calc(18px + env(safe-area-inset-top))", left: 16, right: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button className="press" onClick={() => navigate(mercado ? "/mercar" : "/hoy")} aria-label="Cerrar cámara" style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,.16)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}><IconClose /></button>
            <span style={{ padding: "10px 16px", borderRadius: 22, background: "rgba(0,0,0,.4)", color: "#FFFFFF", fontSize: 15, fontWeight: 600 }}>{mercado ? "Muestra tu mercado" : "Muestra tus frutas o verduras"}</span>
            <span style={{ width: 44 }} />
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: "calc(36px + env(safe-area-inset-bottom))", display: "flex", justifyContent: "space-evenly", alignItems: "center" }}>
            <button className="press" onClick={() => fileRef.current?.click()} aria-label="Subir una foto de la galería" style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,.16)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}><IconGallery /></button>
            <button className="press" onClick={shoot} aria-label="Tomar foto" style={{ width: 84, height: 84, borderRadius: "50%", border: "4px solid #FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ width: 64, height: 64, borderRadius: "50%", background: C.papaya, boxShadow: "inset 0 2px 0 rgba(255,255,255,.35), inset 0 -4px 0 rgba(150,60,20,.2)" }} />
            </button>
            <button className="press" onClick={() => setTorchOn(!torch)} disabled={!torchOk} aria-label={torch ? "Apagar linterna" : "Encender linterna"} aria-pressed={torch} style={{ width: 52, height: 52, borderRadius: "50%", background: torch ? "#F2C14E" : "rgba(255,255,255,.16)", color: torch ? C.tinta : "#FFFFFF", opacity: torchOk ? 1 : 0.4, display: "flex", alignItems: "center", justifyContent: "center" }}><IconTorch /></button>
          </div>
        </section>
      )}

      {/* ============ ANALIZANDO ============ */}
      {view === "analizando" && (
        <section aria-label="Analizando" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          {photo && <img src={photo} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(.45) brightness(.92)" }} />}
          <div aria-hidden="true" className="wave" style={{ position: "absolute", left: 0, right: 0, top: 0, height: 200, background: "linear-gradient(180deg, rgba(242,193,78,0), rgba(242,193,78,.34) 50%, rgba(242,193,78,0))" }} />
          <div className="sheet grain" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 384, borderRadius: "32px 32px 0 0", boxShadow: "0 -12px 30px rgba(0,0,0,.25)" }}>
            <div className="scene" style={{ height: 384 }}>
              <div style={{ position: "absolute", left: 16, right: 16, top: 70, height: 96, borderRadius: "50%", background: C.plato }} />
              {(found ?? []).slice(0, 3).map((f, i) => (
                <div key={f.uid} className="drop" style={{ position: "absolute", left: [142, 22, 248][i], top: [30, 36, 36][i], animationDelay: `${i * 300}ms` }}>
                  <Fruta kind={f.kind} stage={f.stage} mold={f.damage !== "ninguno"} size={[104, 120, 120][i]} />
                </div>
              ))}
              <p className="bric" role="status" aria-live="polite" style={{ position: "absolute", left: 24, right: 24, top: 210, textAlign: "center", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>
                {found ? (found.length === 1 ? "1 encontrado" : `${found.length} encontrados`) : MSGS[msg]}
              </p>
            </div>
            <button className="press" onClick={() => { abortRef.current?.abort(); setView("camara"); }} style={{ position: "absolute", left: "50%", bottom: "calc(28px + env(safe-area-inset-bottom))", transform: "translateX(-50%)", height: 48, padding: "0 22px", borderRadius: 24, fontSize: 16, fontWeight: 600, color: C.suave }}>Cancelar</button>
          </div>
        </section>
      )}

      {/* ============ RESULTADO ============ */}
      {view === "resultado" && (
        <section aria-label="Esto es lo que tienes" className="screen grain enter">
          <div className="scroll" style={{ paddingBottom: 120 }}>
            <div className="zoomable">
              <div style={{ padding: "14px 12px 0" }}>
                <button className="press" onClick={() => setView("camara")} aria-label="Volver a la cámara" style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><IconBack /></button>
              </div>
              <h1 className="bric" style={{ margin: "4px 20px 0", fontSize: 36, fontWeight: 800, lineHeight: 0.98, letterSpacing: "-0.03em" }}>Esto es lo que tienes</h1>

              <div style={{ margin: "16px 12px 0", padding: "14px 4px", borderRadius: 28, background: C.plato, boxShadow: "inset 0 6px 16px rgba(120,84,40,.10)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 4, rowGap: 10 }}>
                  {visible.map((f, i) => {
                    const bad = f.damage !== "ninguno";
                    const content = (
                      <>
                        {f.sure ? (
                          <Fruta kind={f.kind} stage={bad ? 3 : f.stage} mold={bad} size={104} />
                        ) : (
                          <div style={{ border: "2px dashed #8A8F80", borderRadius: 30, padding: "0 2px" }}><Fruta kind={f.kind} stage={f.stage} size={100} /></div>
                        )}
                        <span style={{ fontSize: 15, fontWeight: 600 }}>{f.sure ? FOODS[f.kind].name : `¿${FOODS[f.kind].name}?`}{f.count > 1 ? ` ×${f.count}` : ""}</span>
                        {f.sure && (bad ? (
                          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: C.peligro }}><IconAlert />Revisar</span>
                        ) : (
                          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: STAGE_COLORS[f.stage] }} />{stageWord(f.stage)}</span>
                        ))}
                      </>
                    );
                    const st = { display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2, paddingBottom: 4, animationDelay: `${80 + i * 80}ms` };
                    if (bad) return <button key={f.uid} className="press drop" onClick={() => { setFocus(f.uid); setView("danio"); }} style={st}>{content}</button>;
                    if (f.sure) return <a key={f.uid} href={`#/ficha/${f.kind}`} className="press drop" style={st}>{content}</a>;
                    return <div key={f.uid} className="drop" style={st}>{content}</div>;
                  })}
                </div>
                {visible.filter((f) => !f.sure).map((f) => (
                  <div key={f.uid} style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 10px 0", padding: "8px 8px 8px 14px", borderRadius: 20, background: "#FFFFFF" }}>
                    <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>¿Es {FOODS[f.kind].article === "una" ? "una" : "un"} {FOODS[f.kind].name.toLowerCase()}?</span>
                    <button className="press" onClick={() => confirmKind(f, f.kind)} style={{ display: "flex", alignItems: "center", gap: 4, height: 44, padding: "0 12px 0 2px", borderRadius: 22, background: C.hojaClaro, color: C.hoja, fontSize: 14, fontWeight: 600 }}><Fruta kind={f.kind} stage={f.stage} ring={false} size={40} decorative />Sí</button>
                    {f.alternative && (
                      <button className="press" onClick={() => confirmKind(f, f.alternative!)} style={{ display: "flex", alignItems: "center", gap: 4, height: 44, padding: "0 12px 0 2px", borderRadius: 22, background: C.bandeja, fontSize: 14, fontWeight: 600 }}><Fruta kind={f.alternative} stage={f.stage} ring={false} size={40} decorative />{FOODS[f.alternative].name}</button>
                    )}
                  </div>
                ))}
                {others.length > 0 && <p style={{ margin: "10px 14px 0", fontSize: 14, color: C.suave }}>También vi {others.slice(0, 3).join(", ")}. Aún no los conozco.</p>}
                {visible.length === 0 && <p style={{ padding: 16, textAlign: "center", fontSize: 15, fontWeight: 600 }}>Todo a la tierra. ¡Bien hecho!</p>}
              </div>

              {/* Selector rápido para confirmar o cambiar alimento con 1 toque */}
              <div style={{ margin: "12px 14px 0", display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.suave }}>¿Es otro alimento? Toca para cambiar:</span>
                <div className="hscroll" style={{ gap: 8, paddingBottom: 4 }}>
                  {KINDS.map((k) => {
                    const isSelected = main?.kind === k;
                    return (
                      <button
                        key={k}
                        className="press"
                        onClick={() => {
                          if (found && found.length > 0) {
                            setFound((list) => list?.map((x, idx) => idx === 0 ? { ...x, kind: k, sure: true, confidence: 1 } : x) ?? null);
                          } else {
                            setFound([{ kind: k, count: 1, stage: 1, confidence: 1, alternative: null, damage: "ninguno", note: `${FOODS[k].name} seleccionado`, uid: `${k}-0`, sure: true }]);
                          }
                        }}
                        style={{
                          flex: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          height: 38,
                          padding: "0 12px",
                          borderRadius: 19,
                          background: isSelected ? C.hoja : "#FFFFFF",
                          color: isSelected ? "#FFFFFF" : C.tinta,
                          border: `1.5px solid ${isSelected ? C.hoja : "#DDD3C1"}`,
                          fontSize: 14,
                          fontWeight: 700,
                          boxShadow: isSelected ? "0 4px 10px rgba(47,107,58,0.2)" : "0 2px 4px rgba(0,0,0,0.03)",
                          transition: "all 180ms ease",
                        }}
                      >
                        <img src={`/images/3d/${k}.png`} alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
                        <span>{FOODS[k].name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Indicador de impacto real y ahorro en pesos colombianos */}
              {healthy.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, margin: "14px 12px 0" }}>
                  <div className="tray" style={{ padding: "10px 8px", borderRadius: 18, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.suave }}>Ahorro estimado</span>
                    <span className="bric num" style={{ fontSize: 18, fontWeight: 800, color: C.hoja }}>${totalPesos.toLocaleString("es-CO")}</span>
                  </div>
                  <div className="tray" style={{ padding: "10px 8px", borderRadius: 18, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.suave }}>Rescatado</span>
                    <span className="bric num" style={{ fontSize: 18, fontWeight: 800, color: C.tinta }}>{totalGrams >= 1000 ? `${totalKg} kg` : `${totalGrams} g`}</span>
                  </div>
                  <div className="tray" style={{ padding: "10px 8px", borderRadius: 18, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.suave }}>CO₂ evitado</span>
                    <span className="bric num" style={{ fontSize: 18, fontWeight: 800, color: "#2F6B3A" }}>{totalCo2} kg</span>
                  </div>
                </div>
              )}

              {main && (
                <>
                  <h2 className="bric" style={{ margin: "26px 20px 2px", fontSize: 26, fontWeight: 800, letterSpacing: "-0.025em" }}>La escalera del rescate</h2>
                  <p style={{ margin: "0 20px", fontSize: 15, color: C.suave }}>Para {main.count > 1 || main.kind === "fresa" ? "tus" : "tu"} {(main.count > 1 || main.kind === "fresa" ? FOODS[main.kind].plural : FOODS[main.kind].name).toLowerCase()}: de lo mejor al último recurso.</p>

                  {/* ── Opción 1: Cómetelo ya ── */}
                  <Step n={1} text="Opción 1: Cómetelo ya" active />
                  <div className="hscroll" style={{ gap: 12, padding: "18px 20px 10px" }}>
                    {ladder.map((r) => (
                      <a key={r.id} href={`#/receta/${r.id}`} className="press tray" style={{ flex: "none", width: 210, scrollSnapAlign: "start", borderRadius: 24, padding: "14px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, background: "#FFFFFF", border: "1px solid #EAE0D2", boxShadow: "0 4px 14px rgba(0,0,0,0.04)" }}>
                        <div style={{ width: "100%", height: 110, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <img
                            src={RECIPE_3D[r.id] || "/images/3d/receta.png"}
                            alt=""
                            style={{ maxWidth: 110, maxHeight: 110, objectFit: "contain", filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.15))" }}
                          />
                        </div>
                        <span className="bric" style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.015em", lineHeight: 1.15 }}>{r.name}</span>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", fontSize: 13, color: C.suave }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><IconClock size={14} />{r.time}</span>
                          <Difficulty level={r.difficulty} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.hoja, marginTop: 2 }}>Cocinar ahora →</span>
                      </a>
                    ))}
                  </div>

                  {/* ── Opción 2: Guárdalo para después (Nevera 3D) ── */}
                  <Step n={2} text="Opción 2: Guárdalo para después" />
                  <div style={{ margin: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* Tarjeta destacada con el refrigerador 3D */}
                    <div className="tray" style={{ padding: "16px", borderRadius: 24, display: "flex", alignItems: "center", gap: 16, background: "#FFFFFF", border: "1px solid #EAE0D2" }}>
                      <div style={{ width: 84, height: 84, flex: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img
                          src="/images/3d/refrigerador.png"
                          alt="Refrigerador 3D"
                          style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 8px 18px rgba(47,107,58,0.22))" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: C.hoja, letterSpacing: "0.04em", textTransform: "uppercase" }}>Nevera y conservación</span>
                        <span className="bric" style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.2 }}>{FOODS[main.kind].storage.title}</span>
                        <span style={{ fontSize: 14, color: C.media, lineHeight: 1.35 }}>{FOODS[main.kind].storage.tip}</span>
                      </div>
                    </div>

                    {/* Métodos específicos de conservación */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                      {FOODS[main.kind].save.map((s) => (
                        <div key={s.label} className="tray" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8, padding: "14px", borderRadius: 20, background: "#FFFFFF", border: "1px solid #EAE0D2" }}>
                          <SaveArt icon={s.icon} size={60} />
                          <span style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.2 }}>{s.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.suave }}>{s.icon === "congelar" ? "Hasta 6 meses" : "2 a 3 semanas"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Opción 3: Devuélvelo a la tierra (Compost 3D) ── */}
                  <Step n={3} text="Opción 3: Devuélvelo a la tierra" />
                  <div style={{ margin: "0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div className="tray" style={{ padding: "16px", borderRadius: 24, display: "flex", alignItems: "flex-start", gap: 14, background: "#F5EEE4", border: "1px solid #E4D7C5" }}>
                      <div style={{ width: 70, height: 70, flex: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src="/images/3d/compost.png" alt="Compostera 3D" style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 6px 14px rgba(90,60,20,0.18))" }} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span className="bric" style={{ fontSize: 16, fontWeight: 800 }}>Cáscaras y partes que no te comas</span>
                        <p style={{ margin: 0, fontSize: 14, color: C.media, lineHeight: 1.4 }}>
                          {main.kind === "limon"
                            ? "¡No botes las cáscaras de limón! Ralla la piel para infusiones o macéralas en vinagre blanco 10 días para un limpiador desinfectante antigrasa 100% natural."
                            : main.kind === "banano"
                            ? "La cáscara de banano es rica en potasio: ponla 24h en agua y riega tus plantas, o córtala en trozos para compost rápido."
                            : main.kind === "aguacate"
                            ? "La pepa y cáscara de aguacate tienen taninos y minerales: rállala para abonar macetas o ponla en agua a germinar."
                            : main.kind === "tomate"
                            ? "Piel y semillas de tomate: sofríelas con cebolla para salsas base o llévalas a la compostera."
                            : main.kind === "zanahoria"
                            ? "Los extremos y piel de zanahoria son ideales para hacer caldo de verduras casero; las hojas verdes se pueden picar como perejil o en pesto."
                            : "Cáscaras y restos orgánicos: devuélvelos a la tierra para nutrir tus macetas y huerta comunitaria."}
                        </p>
                      </div>
                    </div>
                    <button
                      className="press"
                      onClick={() => {
                        actions.logToss(main.kind, 1, "danio");
                        setToast("¡Restos registrados para abono! +50 pts a tu huerta");
                      }}
                      style={{
                        width: "100%",
                        height: 50,
                        borderRadius: 25,
                        background: "#E8F0EA",
                        color: C.hoja,
                        border: `1.5px solid ${C.hoja}`,
                        fontSize: 15,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <img src="/images/3d/huerta.png" alt="" style={{ width: 22, height: 22, objectFit: "contain" }} />
                      <span>Registrar restos a la huerta (+50 pts)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {healthy.length > 0 && (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "12px 20px calc(22px + env(safe-area-inset-bottom))", background: "rgba(251,247,239,.9)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
              {added === 0 ? (
                <button className="press" onClick={addAll} style={{ width: "100%", height: 56, borderRadius: 28, border: `2px solid ${C.hoja}`, color: C.hoja, fontSize: 17, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><IconBasket />Agregar a mi canasta</button>
              ) : (
                <a href="#/canasta" className="pop" role="status" style={{ width: "100%", height: 56, borderRadius: 28, background: C.hojaClaro, color: C.hoja, fontSize: 17, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><IconCheck size={22} />{added === 1 ? "1 producto en tu canasta" : `${added} productos en tu canasta`}</a>
              )}
            </div>
          )}
        </section>
      )}

      {/* ============ DAÑO DETECTADO ============ */}
      {view === "danio" && damaged && (
        <section aria-label={`${FOODS[damaged.kind].name}: ${damageTitle(damaged.damage).toLowerCase()}`} className="enter scroll" style={{ background: "#F2EEE7" }}>
          <div className="zoomable">
            <div style={{ padding: "14px 12px 0" }}>
              <button className="press" onClick={() => setView("resultado")} aria-label="Volver" style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><IconBack /></button>
            </div>
            <div style={{ position: "relative", width: 240, height: 240, margin: "0 auto" }}>
              <Fruta kind={damaged.kind} stage={3} mold size={240} />
              <div aria-hidden="true" style={{ position: "absolute", left: 98, top: 96, width: 84, height: 84, borderRadius: "50%", border: "4px solid #1F2A1E", background: "rgba(255,255,255,.16)", boxShadow: "0 6px 14px rgba(0,0,0,.18)" }} />
              <div aria-hidden="true" style={{ position: "absolute", left: 172, top: 172, width: 12, height: 40, borderRadius: 6, background: "#1F2A1E", transform: "rotate(-45deg)" }} />
              <span className="stamp bric" style={{ position: "absolute", right: -24, top: 18, display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 16, background: "#C2412F", color: "#FFFFFF", fontSize: 22, fontWeight: 800, transform: "rotate(-8deg)", boxShadow: "0 8px 18px -6px rgba(194,65,47,.6)" }}><IconClose size={20} strokeWidth={3} />Este no</span>
            </div>
            <h1 className="bric" style={{ margin: "8px 20px 4px", fontSize: 32, fontWeight: 800, letterSpacing: "-0.025em" }}>{damageTitle(damaged.damage)}</h1>
            <p style={{ margin: "0 20px", fontSize: 16, lineHeight: 1.45, color: C.media }}>{damageWhy(damaged)}{damaged.note ? ` ${damaged.note}` : ""}</p>
            <p style={{ margin: "22px 20px 10px", fontSize: 16, fontWeight: 700 }}>Apto vs. dañado</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, margin: "0 20px" }}>
              <div className="tray" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 8px 12px", borderRadius: 20 }}>
                <Fruta kind={damaged.kind} stage={2} ring={false} size={90} decorative />
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 600 }}><span style={{ width: 22, height: 22, borderRadius: "50%", background: C.hoja, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}><IconCheck size={14} strokeWidth={3} /></span>Blanda: sirve</span>
              </div>
              <div className="tray" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 8px 12px", borderRadius: 20 }}>
                <Fruta kind={damaged.kind} stage={3} mold ring={false} size={90} decorative />
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 600 }}><span style={{ width: 22, height: 22, borderRadius: "50%", background: "#C2412F", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}><IconClose size={12} strokeWidth={3.4} /></span>{damaged.damage === "moho" ? "Moho: no" : "Dañada: no"}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 20px 0", padding: "12px 14px", borderRadius: 20, background: "#E9E3D8" }}>
              <Compost />
              <span style={{ fontSize: 16, fontWeight: 600 }}>Devuélvela a la tierra</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "18px 20px calc(28px + env(safe-area-inset-bottom))" }}>
              <button className="press" onClick={() => toCompost(damaged)} style={primaryBtn(56, { fontSize: 17, fontWeight: 600, boxShadow: "none" })}>A la compostera</button>
              <button className="press" onClick={() => notMold(damaged)} style={ghostBtn(48, { fontSize: 15 })}>{damaged.damage === "moho" ? "No es moho, corregir" : "Está bien, corregir"}</button>
            </div>
          </div>
        </section>
      )}

      {/* ============ NO RECONOCIDA ============ */}
      {view === "noreco" && (
        <section aria-label="Foto no reconocida" style={{ position: "absolute", inset: 0, background: "#1E1914", overflow: "hidden" }}>
          {photo && <img src={photo} alt="" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: `blur(14px) brightness(${noreco.dark ? 0.8 : 1})` }} />}
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 140px 60px rgba(0,0,0,.6)" }} />
          <div key={retries} className="huh" aria-hidden="true" style={{ position: "absolute", left: 26, right: 26, top: "18%", height: 452, maxHeight: "50%" }}>
            {(["tl", "tr", "bl", "br"] as const).map((k) => (
              <div key={k} style={{ position: "absolute", width: 56, height: 56, [k[0] === "t" ? "top" : "bottom"]: 0, [k[1] === "l" ? "left" : "right"]: 0, [`border${k[0] === "t" ? "Top" : "Bottom"}`]: "5px solid #F28C5B", [`border${k[1] === "l" ? "Left" : "Right"}`]: "5px solid #F28C5B", [`border${k[0] === "t" ? "Top" : "Bottom"}${k[1] === "l" ? "Left" : "Right"}Radius`]: 32 }} />
            ))}
            <span className="bric" style={{ position: "absolute", left: 0, right: 0, top: "42%", textAlign: "center", fontSize: 64, fontWeight: 800, color: "#F28C5B" }}>¿?</span>
          </div>
          <div style={{ position: "absolute", top: "calc(18px + env(safe-area-inset-top))", left: 16 }}>
            <button className="press" onClick={() => navigate("/hoy")} aria-label="Cerrar cámara" style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,.16)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}><IconClose /></button>
          </div>
          <div className="sheet" role="status" style={{ position: "absolute", left: 12, right: 12, bottom: "calc(16px + env(safe-area-inset-bottom))", padding: "20px 18px 16px", borderRadius: 30, background: "#FBF7EF" }}>
            <h1 className="bric" style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.025em" }}>{noreco.title}</h1>
            <p style={{ margin: "6px 0 16px", fontSize: 16, color: C.media }}>{noreco.sub}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {!noreco.aiOff && (
                <button className="press" onClick={retry} style={primaryBtn(58, { fontSize: 18 })}>
                  {noreco.dark && retries === 0 ? <><IconSun />Intenta con más luz</> : <><IconRetry />Probar otra vez</>}
                </button>
              )}
              <a href="#/mercar?agregar=1" className="press" style={{ height: 52, borderRadius: 26, background: noreco.aiOff ? C.hoja : C.bandeja, color: noreco.aiOff ? "#FFFFFF" : C.tinta, fontSize: 17, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>Elegir a mano</a>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Step({ n, text, active }: { n: number; text: string; active?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: n === 1 ? "18px 20px 0" : "20px 20px 10px" }}>
      <span className="bric" style={{ width: 30, height: 30, borderRadius: "50%", background: active ? C.hoja : "#E7DFCF", color: active ? "#FFFFFF" : C.tinta, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800 }}>{n}</span>
      <span style={{ fontSize: 18, fontWeight: 700 }}>{text}</span>
    </div>
  );
}
