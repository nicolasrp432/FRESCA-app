import { useEffect, useRef, useState } from "react";
import { cloudEnabled, push, sendCode, signInWithGoogle, verifyCode } from "../lib/cloud";
import { HOUR_LABELS } from "../lib/domain";
import { askPermission } from "../lib/notify";
import { navigate, usePath } from "../lib/router";
import { actions, getState, useStore } from "../state/store";
import { C, ghostBtn, primaryBtn } from "../ui/Common";
import { Fruta } from "../ui/Fruta";
import { IconBack, IconMinus, IconPlus } from "../ui/Icons";

/** Supabase manda códigos SMS de 6 números */
const CODE_LEN = 6;

type Screen = "splash" | "onb" | "login" | "code" | "config";

const SLIDES = ["Feo por fuera, rico por dentro.", "Tómale una foto.", "Mira qué hacer, paso a paso."];
const HOURS = [
  { sky: "#FFE2A8", sx: 30, sy: 70, sc: "#F2C14E", sg: "rgba(242,193,78,.3)" },
  { sky: "#BFE3F2", sx: 90, sy: 14, sc: "#FFF1B8", sg: "rgba(255,241,184,.45)" },
  { sky: "#F7B98A", sx: 150, sy: 66, sc: "#F28C5B", sg: "rgba(242,140,91,.3)" },
  { sky: "#36405E", sx: 150, sy: 16, sc: "#FFF6D8", sg: "rgba(255,246,216,.12)" },
];

export default function Inicio() {
  const path = usePath();
  const fromGoogle = path.startsWith("/entrar/google");
  const profile = useStore((s) => s.profile);
  const [screen, setScreen] = useState<Screen>(fromGoogle ? "config" : "splash");
  const [slide, setSlide] = useState(0);
  const [mode, setMode] = useState<"crear" | "entrar">("crear");
  const [phone, setPhone] = useState(profile.phone);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [resendIn, setResendIn] = useState(30);
  const [name, setName] = useState(profile.name);
  const [people, setPeople] = useState(profile.people);
  const [hour, setHour] = useState(profile.hour);
  const x0 = useRef<number | null>(null);
  const digits = phone.replace(/\D/g, "");

  useEffect(() => {
    if (screen !== "splash") return;
    const t = window.setTimeout(() => setScreen("onb"), 1500);
    return () => window.clearTimeout(t);
  }, [screen]);

  // Si vuelve de Google ya con su copia en la nube, entra directo
  useEffect(() => {
    if (fromGoogle && getState().profile.account === "account" && getState().items.length) {
      actions.updateProfile({ onboarded: true });
      navigate("/hoy", true);
    }
  }, [fromGoogle, profile.account]);

  useEffect(() => {
    if (screen !== "code") return;
    setResendIn(30);
    const id = window.setInterval(() => setResendIn((n) => (n > 0 ? n - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [screen]);

  const toSlide = (n: number) => setSlide(Math.max(0, Math.min(2, n)));
  const go = (s: Screen) => {
    setMsg("");
    setScreen(s);
  };

  const doSend = async () => {
    if (!cloudEnabled) {
      setMsg("Las cuentas aún no están activas aquí. Sigue sin cuenta: todo queda guardado en este celular.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      await sendCode(digits);
      actions.updateProfile({ phone: digits });
      setCode("");
      go("code");
    } catch {
      setMsg("No pudimos mandar el SMS. Revisa el número e intenta otra vez.");
    } finally {
      setBusy(false);
    }
  };

  const doGoogle = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await signInWithGoogle();
      if (res?.ok) {
        actions.updateProfile({ account: "account" });
        const st = getState();
        if (mode === "entrar" && (st.items.length || st.events.length)) {
          actions.updateProfile({ onboarded: true });
          navigate("/hoy", true);
        } else {
          go("config");
        }
      }
    } catch {
      setMsg("No se pudo iniciar sesión con Google. Intenta otra vez.");
    } finally {
      setBusy(false);
    }
  };

  const onCode = async (v: string) => {
    const c = v.replace(/\D/g, "").slice(0, CODE_LEN);
    setCode(c);
    setMsg("");
    if (c.length === CODE_LEN) await doVerify(c);
  };

  const doVerify = async (c = code) => {
    setBusy(true);
    try {
      await verifyCode(digits, c);
      actions.updateProfile({ account: "account" });
      const st = getState();
      if (mode === "entrar" && (st.items.length || st.events.length)) {
        actions.updateProfile({ onboarded: true });
        navigate("/hoy", true);
      } else go("config");
    } catch {
      setMsg("Ese código no coincide. Revísalo o pide otro.");
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    actions.updateProfile({ name: name.trim(), people, hour, onboarded: true });
    if (getState().profile.flags.notif) {
      const p = await askPermission();
      if (p === "denied") actions.setFlag("notif", false);
    }
    push().catch(() => undefined);
    navigate("/hoy", true);
  };

  /* La gente alrededor de la mesa */
  const skins = ["#E8B48A", "#C68A5E", "#8E5A3A", "#F0C8A0"];
  const shirts = ["#F28C5B", "#2F6B3A", "#F2C14E", "#6FAE57", "#E2702E", "#5E685A", "#C2412F", "#E9B530"];
  const ppl = Array.from({ length: people }, (_, p) => {
    const ang = -Math.PI / 2 + (p / people) * Math.PI * 2;
    return { x: Math.round(195 + Math.cos(ang) * 130 - 20), y: Math.round(140 + Math.sin(ang) * 62 - 54), skin: skins[p % 4], shirt: shirts[p % 8], back: Math.sin(ang) < 0.1 };
  });
  const H = HOURS[hour];
  const Person = ({ f }: { f: (typeof ppl)[number] }) => (
    <div className="pop" style={{ position: "absolute", left: f.x, top: f.y, width: 40, height: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <span style={{ width: 22, height: 22, borderRadius: "50%", background: f.skin }} />
      <span style={{ width: 40, height: 34, borderRadius: "20px 20px 10px 10px", background: f.shirt }} />
    </div>
  );

  return (
    <div className="screen grain">
      {screen === "splash" && (
        <button onClick={() => go("onb")} aria-label="FRESCA. Toca para empezar" style={{ position: "absolute", inset: 0, display: "block", width: "100%", cursor: "default" }}>
          <div className="scene" style={{ height: "100%" }}>
            <div style={{ position: "absolute", left: 30, right: 30, top: 360, height: 120, borderRadius: "50%", background: C.plato }} />
            <svg aria-hidden="true" width="390" height="844" viewBox="0 0 390 844" style={{ position: "absolute", inset: 0 }}>
              <ellipse cx="195" cy="425" rx="87" ry="20" fill="none" stroke="#E4D8C3" strokeWidth="5" />
              <ellipse className="ringdraw" cx="195" cy="425" rx="87" ry="20" fill="none" stroke="#E9B530" strokeWidth="5" strokeLinecap="round" pathLength={100} />
            </svg>
            <div className="drop" style={{ position: "absolute", left: 95, top: 260 }}><Fruta kind="banano" stage={2} ring={false} size={200} decorative /></div>
            <span className="bric fadein" style={{ position: "absolute", left: 0, right: 0, top: 480, textAlign: "center", fontSize: 64, fontWeight: 800, letterSpacing: "-0.05em", animationDelay: "650ms" }}>FRESCA</span>
          </div>
        </button>
      )}

      {screen === "onb" && (
        <section
          aria-label="Bienvenida"
          className="fadein"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "calc(12px + env(safe-area-inset-top)) 20px calc(20px + env(safe-area-inset-bottom))",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          {/* Barra superior con botón Saltar */}
          <div style={{ display: "flex", justifyContent: "flex-end", height: 44, alignItems: "center" }}>
            <button className="press" onClick={() => { setMode("crear"); go("login"); }} style={{ height: 40, padding: "0 16px", borderRadius: 20, fontSize: 15, fontWeight: 600, color: C.media }}>Saltar</button>
          </div>

          {/* Área visual central con swipe interactivo */}
          <div
            onPointerDown={(e) => (x0.current = e.clientX)}
            onPointerUp={(e) => {
              if (x0.current == null) return;
              const dx = e.clientX - x0.current;
              x0.current = null;
              if (dx < -40) toSlide(slide + 1);
              else if (dx > 40) toSlide(slide - 1);
            }}
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              touchAction: "pan-y",
              width: "100%",
            }}
          >
            <div className="scene" style={{ width: "100%", maxWidth: 360, height: "100%", maxHeight: 340, position: "relative" }}>
              <div style={{ position: "absolute", left: "6%", right: "6%", bottom: "8%", height: "30%", borderRadius: "50%", background: C.plato, boxShadow: "inset 0 8px 20px rgba(120,84,40,.12)" }} />
              {slide === 0 && (
                <div className="sway" style={{ position: "absolute", inset: 0 }}>
                  <div className="drop" style={{ position: "absolute", left: "6%", bottom: "24%", animationDelay: "80ms" }}><Fruta kind="papaya" stage={2} ring={false} size={150} decorative /></div>
                  <div className="drop" style={{ position: "absolute", right: "6%", bottom: "26%", animationDelay: "160ms" }}><Fruta kind="tomate" stage={2} ring={false} size={115} decorative /></div>
                  <div className="drop" style={{ position: "absolute", right: "26%", bottom: "46%", animationDelay: "240ms" }}><Fruta kind="mango" stage={2} ring={false} size={105} decorative /></div>
                  <div className="drop" style={{ position: "absolute", left: "22%", bottom: "10%", animationDelay: "320ms" }}><Fruta kind="banano" stage={2} ring={false} size={180} decorative /></div>
                </div>
              )}
              {slide === 1 && (
                <div className="enter" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div className="hover" aria-hidden="true" style={{ width: 170, height: 180, marginBottom: -20, zIndex: 2 }}>
                    <img
                      src="/images/3d/escanear.png"
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 14px 28px rgba(47,107,58,0.25))" }}
                    />
                  </div>
                  <div style={{ transform: "scale(0.95)" }}><Fruta kind="papaya" stage={1} size={160} decorative /></div>
                </div>
              )}
              {slide === 2 && (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div className="pop" style={{ width: 160, height: 180, marginBottom: -25, zIndex: 2, animationDelay: "380ms" }}>
                    <img
                      src="/images/3d/smoothie.png"
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "contain", filter: "drop-shadow(0 14px 30px rgba(242,140,91,0.28))" }}
                    />
                  </div>
                  <div className="melt" style={{ transform: "scale(0.95)" }}><Fruta kind="papaya" stage={1} ring={false} size={150} decorative /></div>
                </div>
              )}
            </div>
          </div>

          {/* Bloque inferior: Texto, Puntos y Botones perfectamente ordenados */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: "none", width: "100%" }}>
            <h1 key={slide} className="bric enter" style={{ fontSize: "clamp(28px, 7.5vw, 38px)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.05, margin: 0, textAlign: "left" }} aria-live="polite">{SLIDES[slide]}</h1>

            <div role="group" aria-label="Pantallas de bienvenida" style={{ display: "flex", justifyContent: "center", gap: 6, margin: "2px 0 4px" }}>
              {[0, 1, 2].map((n) => (
                <button key={n} onClick={() => toSlide(n)} aria-label={`Pantalla ${n + 1} de 3`} aria-current={n === slide ? "step" : undefined} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="22" viewBox="0 0 16 22" aria-hidden="true"><path d="M8 1 C 13 5, 15 10, 15 14 A 7 7 0 0 1 1 14 C 1 10, 3 5, 8 1 Z" fill={n <= slide ? "#3B2E1E" : "transparent"} stroke="#3B2E1E" strokeWidth="1.6" style={{ transition: "fill 240ms ease" }} /></svg>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button className="press" onClick={() => (slide < 2 ? toSlide(slide + 1) : (setMode("crear"), go("login")))} style={primaryBtn()}>{slide < 2 ? "Siguiente" : "Empezar"}</button>
              <button className="press" onClick={() => { setMode("entrar"); go("login"); }} style={ghostBtn(46)}>Ya tengo cuenta</button>
            </div>
          </div>
        </section>
      )}

      {screen === "login" && (
        <section aria-label="Acceso" className="enter scroll">
          <div style={{ padding: "14px 12px 0" }}>
            <button className="press" onClick={() => go("onb")} aria-label="Volver" style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><IconBack /></button>
          </div>
          <div className="scene" style={{ height: 150 }}>
            <div style={{ position: "absolute", left: 90, right: 90, top: 110, height: 40, borderRadius: "50%", background: C.plato }} />
            <div style={{ position: "absolute", left: 70, top: 18 }}><Fruta kind="aguacate" stage={1} ring={false} size={120} decorative /></div>
            <div style={{ position: "absolute", left: 170, top: 40 }}><Fruta kind="fresa" stage={1} ring={false} size={110} decorative /></div>
          </div>
          <h1 className="bric" style={{ margin: "6px 20px 6px", fontSize: 40, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1 }}>{mode === "entrar" ? "Buenas otra vez" : "Guarda tu canasta"}</h1>
          <p style={{ margin: "0 20px", fontSize: 16, color: C.media }}>Te mandamos un código por SMS.</p>
          <div style={{ margin: "24px 20px 0", display: "flex", flexDirection: "column", gap: 8 }}>
            <label htmlFor="cel" style={{ fontSize: 15, fontWeight: 700 }}>Tu celular</label>
            <div className="tray" style={{ display: "flex", alignItems: "center", height: 60, borderRadius: 20, padding: "0 6px 0 0", boxShadow: `inset 0 0 0 2px ${digits.length >= 10 ? C.hoja : "transparent"}, 0 6px 14px -10px rgba(110,74,30,.35)` }}>
              <span style={{ height: 44, marginLeft: 8, padding: "0 12px", borderRadius: 14, background: C.bandeja, display: "flex", alignItems: "center", fontSize: 17, fontWeight: 700 }}>+57</span>
              <input id="cel" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="300 123 4567" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/[^\d ]/g, "")); setMsg(""); }} maxLength={12} style={{ flex: 1, minWidth: 0, height: 52, border: 0, outline: "none", background: "transparent", padding: "0 12px", fontSize: 20, fontWeight: 600, letterSpacing: "0.02em" }} />
            </div>
            <span style={{ fontSize: 13, color: C.suave }}>Solo para guardar tu canasta. Nada de publicidad.</span>
          </div>
          <div style={{ margin: "20px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
            <button className="press" onClick={doSend} disabled={digits.length < 10 || busy} style={{ height: 58, borderRadius: 29, background: digits.length >= 10 ? C.hoja : "#9DB3A0", color: "#FFFFFF", fontSize: 18, fontWeight: 700, transition: "background 200ms ease" }}>{busy ? "Enviando…" : "Enviarme el código"}</button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.suave }}><span style={{ flex: 1, height: 1, background: "#E2D8C6" }} />o<span style={{ flex: 1, height: 1, background: "#E2D8C6" }} /></div>
            <button className="press" onClick={doGoogle} style={{ height: 56, borderRadius: 28, border: "2px solid #D8CBB4", background: "#FFFFFF", fontSize: 17, fontWeight: 600 }}>Continuar con Google</button>
            {msg && <p role="status" className="fadein" style={{ padding: "12px 14px", borderRadius: 16, background: C.bandeja, fontSize: 15, fontWeight: 600 }}>{msg}</p>}
          </div>
          <div style={{ display: "flex", justifyContent: "center", padding: "24px 0 calc(22px + env(safe-area-inset-bottom))" }}>
            <button className="press" onClick={() => go("config")} style={{ height: 48, padding: "0 18px", borderRadius: 24, fontSize: 16, fontWeight: 600, color: C.hoja }}>Seguir sin cuenta</button>
          </div>
        </section>
      )}

      {screen === "code" && (
        <section aria-label="Código" className="enter" style={{ position: "absolute", inset: 0 }}>
          <div style={{ padding: "14px 12px 0" }}>
            <button className="press" onClick={() => go("login")} aria-label="Cambiar número" style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><IconBack /></button>
          </div>
          <h1 className="bric" style={{ margin: "20px 20px 6px", fontSize: 40, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1 }}>Escribe el código</h1>
          <p style={{ margin: "0 20px", fontSize: 16, color: C.media }}>Lo mandamos al +57 {phone}.</p>
          <label htmlFor="otp" className="sr-only">Código de {CODE_LEN} números</label>
          <div style={{ position: "relative", margin: "28px 20px 0", display: "grid", gridTemplateColumns: `repeat(${CODE_LEN}, minmax(0, 1fr))`, gap: 8 }}>
            {Array.from({ length: CODE_LEN }, (_, n) => (
              <span key={n} className="tray bric num" style={{ height: 64, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, boxShadow: `inset 0 0 0 2px ${n === code.length ? C.hoja : "transparent"}, 0 6px 14px -10px rgba(110,74,30,.35)` }}>{code[n] ?? ""}</span>
            ))}
            <input id="otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={CODE_LEN} value={code} autoFocus onChange={(e) => onCode(e.target.value)} style={{ position: "absolute", inset: 0, width: "100%", height: 64, opacity: 0, border: 0, fontSize: 16 }} />
          </div>
          <div style={{ margin: "16px 20px 0", padding: "12px 16px", borderRadius: 16, background: "#E8F0EA", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid #C4D9C8" }}>
            <span style={{ fontSize: 14, color: C.hoja, fontWeight: 700 }}>Código de acceso: 123456</span>
            <button className="press" onClick={() => onCode("123456")} style={{ background: C.hoja, color: "#FFFFFF", border: 0, padding: "6px 14px", borderRadius: 14, fontSize: 13, fontWeight: 700 }}>Autocompletar</button>
          </div>
          {msg && <p role="status" className="fadein" style={{ margin: "14px 20px 0", fontSize: 15, fontWeight: 600, color: C.peligro }}>{msg}</p>}
          <p className="num" style={{ margin: "16px 20px 0", fontSize: 15, color: C.suave }}>
            {resendIn > 0 ? `¿No llegó? Reenviar en 0:${String(resendIn).padStart(2, "0")}` : (
              <button className="press" onClick={doSend} style={{ fontSize: 15, fontWeight: 700, color: C.hoja, minHeight: 44 }}>Reenviar el código</button>
            )}
          </p>
          <div style={{ position: "absolute", left: 20, right: 20, bottom: "calc(26px + env(safe-area-inset-bottom))" }}>
            {code.length === CODE_LEN && (
              <button className="press pop" onClick={() => doVerify()} disabled={busy} style={primaryBtn()}>{busy ? "Revisando…" : mode === "entrar" ? "Entrar" : "Seguir"}</button>
            )}
          </div>
        </section>
      )}

      {screen === "config" && (
        <section aria-label="Configuración inicial" className="enter scroll">
          <div className="zoomable">
            <h1 className="bric" style={{ margin: "26px 20px 0", fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>¿Cuántos son en casa?</h1>
            <div className="scene" style={{ height: 210, marginTop: 4 }}>
              {ppl.filter((f) => f.back).map((f, i) => <Person key={`b${i}`} f={f} />)}
              <div style={{ position: "absolute", left: 105, top: 100, width: 180, height: 80, borderRadius: "50%", background: "#C79A62", boxShadow: "inset 0 -8px 0 #A67A44, 0 14px 20px -10px rgba(90,62,34,.5)" }} />
              <div style={{ position: "absolute", left: 160, top: 102, transform: "scale(.55)", transformOrigin: "0 0" }}><Fruta kind="papaya" stage={1} ring={false} size={120} decorative /></div>
              {ppl.filter((f) => !f.back).map((f, i) => <Person key={`f${i}`} f={f} />)}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
              <button className="press" onClick={() => setPeople(Math.max(1, people - 1))} aria-label="Uno menos" style={{ width: 60, height: 60, borderRadius: "50%", background: C.bandeja, display: "flex", alignItems: "center", justifyContent: "center" }}><IconMinus size={26} /></button>
              <span className="bric num" role="status" aria-label={people === 1 ? "1 persona" : `${people} personas`} style={{ minWidth: 70, textAlign: "center", fontSize: 60, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>{people}</span>
              <button className="press" onClick={() => setPeople(Math.min(8, people + 1))} aria-label="Uno más" style={{ width: 60, height: 60, borderRadius: "50%", background: C.hoja, color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}><IconPlus size={26} /></button>
            </div>

            <div style={{ margin: "26px 20px 0", display: "flex", flexDirection: "column", gap: 8 }}>
              <label htmlFor="nombre" style={{ fontSize: 15, fontWeight: 700 }}>¿Cómo te llamo?</label>
              <input id="nombre" type="text" autoComplete="given-name" placeholder="Tu nombre (opcional)" value={name} onChange={(e) => setName(e.target.value.slice(0, 24))} className="tray" style={{ height: 56, borderRadius: 20, border: 0, outline: "none", padding: "0 16px", fontSize: 18, fontWeight: 600 }} />
            </div>

            <h2 className="bric" style={{ margin: "30px 20px 12px", fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>¿A qué hora te aviso?</h2>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div aria-hidden="true" style={{ position: "relative", width: 220, height: 130, border: "10px solid #C79A62", borderRadius: 18, background: H.sky, overflow: "hidden", transition: "background 600ms cubic-bezier(.23,1,.32,1)" }}>
                <span style={{ position: "absolute", left: H.sx, top: H.sy, width: 36, height: 36, borderRadius: "50%", background: H.sc, boxShadow: `0 0 0 8px ${H.sg}`, transition: "left 600ms cubic-bezier(.23,1,.32,1), top 600ms cubic-bezier(.23,1,.32,1), background 600ms ease" }} />
                {hour === 3 && (
                  <>
                    <span className="fadein" style={{ position: "absolute", left: 40, top: 30, width: 4, height: 4, borderRadius: "50%", background: "#FFF6D8" }} />
                    <span className="fadein" style={{ position: "absolute", left: 90, top: 64, width: 3, height: 3, borderRadius: "50%", background: "#FFF6D8" }} />
                    <span className="fadein" style={{ position: "absolute", left: 130, top: 22, width: 3, height: 3, borderRadius: "50%", background: "#FFF6D8" }} />
                  </>
                )}
                <span style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 8, marginLeft: -4, background: "#C79A62" }} />
                <span style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 8, marginTop: -4, background: "#C79A62" }} />
              </div>
            </div>
            <div style={{ margin: "0 auto", width: 280, height: 14, borderRadius: 7, background: "#E2D3BC" }} />
            <div role="group" aria-label="Hora del aviso" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, margin: "16px 20px 0" }}>
              {HOUR_LABELS.map((label, i) => (
                <button key={label} className="press" onClick={() => setHour(i)} aria-pressed={i === hour} style={{ height: 52, borderRadius: 26, background: i === hour ? C.hoja : C.bandeja, color: i === hour ? "#FFFFFF" : C.tinta, fontSize: 16, fontWeight: 700, transition: "background 180ms ease, color 180ms ease" }}>{label}</button>
              ))}
            </div>
            <div style={{ padding: "24px 20px calc(26px + env(safe-area-inset-bottom))" }}>
              <button className="press" onClick={finish} style={primaryBtn()}>Listo</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
