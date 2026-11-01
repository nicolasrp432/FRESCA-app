import { useMemo, useState } from "react";
import { cloudEnabled, deleteCloudData, signOutCloud } from "../lib/cloud";
import { downloadJson } from "../lib/device";
import { computeStats, fmtKg, HOUR_LABELS } from "../lib/domain";
import { askPermission, dailyMessage, notifSupported } from "../lib/notify";
import { navigate } from "../lib/router";
import { actions, getState, useStore, type Flags } from "../state/store";
import { BackButton, C, Sheet, SheetHeader, Toast } from "../ui/Common";
import { IconChevron, IconDownload, IconMinus, IconPlus } from "../ui/Icons";
import { PotSprout } from "../ui/Illustrations";

const TOGGLES: [keyof Flags, string, string][] = [
  ["notif", "Avisos", "Cuando algo esté por pasarse"],
  ["uno", "Un solo aviso al día", "Todo junto, a tu hora"],
  ["rm", "Menos movimiento", "Solo fundidos suaves"],
  ["big", "Letra más grande", "Para leer sin gafas"],
];
const row = { display: "flex", alignItems: "center", gap: 10, width: "100%", minHeight: 64, padding: "0 14px 0 16px", textAlign: "left" as const };

export default function Perfil() {
  const profile = useStore((s) => s.profile);
  const events = useStore((s) => s.events);
  const stats = useMemo(() => computeStats(events), [events]);
  const [sheet, setSheet] = useState<"about" | "delete" | null>(null);
  const [toast, setToast] = useState("");
  const [editing, setEditing] = useState(false);

  const flip = async (k: keyof Flags) => {
    const on = !profile.flags[k];
    if (k === "notif" && on && notifSupported()) {
      const p = await askPermission();
      if (p === "denied") {
        setToast("El celular tiene los avisos bloqueados para FRESCA. Actívalos en los ajustes del navegador.");
        return;
      }
    }
    actions.setFlag(k, on);
  };

  const test = async () => {
    const msg = dailyMessage() ?? { title: "FRESCA", body: "Así te llegan los avisos." };
    const reg = await navigator.serviceWorker?.getRegistration().catch(() => undefined);
    if (reg) reg.showNotification(msg.title, { body: msg.body, icon: "/icon.svg", data: { url: "#/hoy" } });
    else if (notifSupported() && Notification.permission === "granted") new Notification(msg.title, { body: msg.body, icon: "/icon.svg" });
    else setToast("Primero activa los avisos.");
  };

  const logout = async () => {
    await signOutCloud();
    actions.signOut();
    navigate("/inicio", true);
  };
  const wipe = async () => {
    await deleteCloudData().catch(() => undefined);
    actions.wipe();
    navigate("/inicio", true);
  };

  return (
    <div className="screen" style={{ background: "#FBF7EF" }}>
      {toast && <Toast text={toast} onDone={() => setToast("")} />}
      <div className="scroll" style={{ paddingBottom: 32 }}>
        <div className="zoomable">
          <div style={{ padding: "14px 12px 0" }}><BackButton to="/hoy" label="Volver a Hoy" /></div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "4px 20px 0" }}>
            <PotSprout size={76} shadow />
            <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
              {editing ? (
                <>
                  <label htmlFor="nombre" className="sr-only">Tu nombre</label>
                  <input id="nombre" autoFocus defaultValue={profile.name} maxLength={24} onBlur={(e) => { actions.updateProfile({ name: e.target.value.trim() }); setEditing(false); }} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} className="bric" style={{ fontSize: 28, fontWeight: 800, border: 0, borderBottom: `2px solid ${C.hoja}`, background: "transparent", outline: "none", width: "100%" }} />
                </>
              ) : (
                <button onClick={() => setEditing(true)} aria-label="Cambiar tu nombre" style={{ textAlign: "left" }}>
                  <h1 className="bric" style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>{profile.name || "Ponte un nombre"}</h1>
                </button>
              )}
              <span style={{ fontSize: 15, color: C.suave }}>Nivel {stats.levelName} · {fmtKg(stats.rescuedKg)} kg rescatados</span>
            </div>
          </div>

          <p style={{ margin: "24px 24px 6px", fontSize: 14, fontWeight: 700, color: C.suave }}>Tu casa</p>
          <div style={{ margin: "0 20px", borderRadius: 22, background: "#FFFFFF", border: "1px solid #EEE6D8" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 64, padding: "0 10px 0 16px", borderBottom: "1px solid #EEE6D8" }}>
              <span style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>Personas en casa</span>
              <button className="press" onClick={() => actions.updateProfile({ people: Math.max(1, profile.people - 1) })} aria-label="Uno menos" style={{ width: 44, height: 44, borderRadius: "50%", background: C.bandeja, display: "flex", alignItems: "center", justifyContent: "center" }}><IconMinus size={18} /></button>
              <span className="bric num" role="status" style={{ minWidth: 24, textAlign: "center", fontSize: 22, fontWeight: 800 }}>{profile.people}</span>
              <button className="press" onClick={() => actions.updateProfile({ people: Math.min(8, profile.people + 1) })} aria-label="Uno más" style={{ width: 44, height: 44, borderRadius: "50%", background: C.bandeja, display: "flex", alignItems: "center", justifyContent: "center" }}><IconPlus size={18} /></button>
            </div>
            <button className="press" onClick={() => actions.updateProfile({ hour: (profile.hour + 1) % HOUR_LABELS.length })} style={row}>
              <span style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>Hora del aviso</span>
              <span className="num" style={{ fontSize: 16, color: C.media }}>{HOUR_LABELS[profile.hour]}</span>
              <IconChevron style={{ color: C.suave }} />
            </button>
          </div>

          <p style={{ margin: "22px 24px 6px", fontSize: 14, fontWeight: 700, color: C.suave }}>Avisos y vista</p>
          <div style={{ margin: "0 20px", borderRadius: 22, background: "#FFFFFF", border: "1px solid #EEE6D8" }}>
            {TOGGLES.map(([k, name, hint], i) => {
              const on = profile.flags[k];
              return (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 64, padding: "0 16px", borderBottom: i < TOGGLES.length - 1 ? "1px solid #EEE6D8" : "0", cursor: "pointer" }}>
                  <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}><span style={{ fontSize: 16, fontWeight: 600 }}>{name}</span><span style={{ fontSize: 13, color: C.suave }}>{hint}</span></span>
                  <span className="sw">
                    <input type="checkbox" role="switch" checked={on} onChange={() => flip(k)} aria-label={name} />
                    <span className="sw-track" style={{ width: 52, height: 32, borderRadius: 16, background: on ? C.hoja : "#CFC6B6", display: "flex", alignItems: "center", padding: 3, transition: "background 180ms ease" }}>
                      <span className="knob" style={{ width: 26, height: 26, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 2px 4px rgba(0,0,0,.2)", transform: `translateX(${on ? 20 : 0}px)` }} />
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {profile.flags.notif && notifSupported() && (
            <button className="press" onClick={test} style={{ margin: "8px 24px 0", minHeight: 44, fontSize: 14, fontWeight: 700, color: C.hoja }}>Probar el aviso</button>
          )}

          <p style={{ margin: "22px 24px 6px", fontSize: 14, fontWeight: 700, color: C.suave }}>Tus datos</p>
          <div style={{ margin: "0 20px", borderRadius: 22, background: "#FFFFFF", border: "1px solid #EEE6D8" }}>
            <button className="press" onClick={() => downloadJson(`fresca-${new Date().toISOString().slice(0, 10)}.json`, getState())} style={{ ...row, borderBottom: "1px solid #EEE6D8" }}>
              <span style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>Descargar mis datos</span>
              <IconDownload style={{ color: C.suave }} />
            </button>
            <button className="press" onClick={() => setSheet("about")} style={row}>
              <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}><span style={{ fontSize: 16, fontWeight: 600 }}>Acerca de FRESCA</span><span style={{ fontSize: 13, color: C.suave }}>Fuentes, nutrición orientativa y privacidad</span></span>
              <IconChevron style={{ color: C.suave }} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4, margin: "30px 20px 0" }}>
            {profile.account === "account" && <button className="press" onClick={logout} style={{ height: 52, borderRadius: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 600, color: C.media, background: C.bandeja }}>Cerrar sesión</button>}
            <button className="press" onClick={() => setSheet("delete")} style={{ height: 52, borderRadius: 26, fontSize: 15, fontWeight: 600, color: C.peligro }}>{profile.account === "account" ? "Borrar mi cuenta" : "Borrar mis datos"}</button>
          </div>
        </div>
      </div>

      {sheet === "about" && (
        <Sheet label="Acerca de FRESCA" onClose={() => setSheet(null)}>
          <SheetHeader title="Acerca de FRESCA" onClose={() => setSheet(null)} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8, fontSize: 15, lineHeight: 1.45, color: C.media }}>
            <p><b style={{ color: C.tinta }}>Madurez.</b> FRESCA estima cómo va cada alimento según los días que lleva en casa. Si no se ve así, corrígelo en su ficha: aprende de lo que le dices.</p>
            <p><b style={{ color: C.tinta }}>Fotos.</b> La foto se manda una sola vez para reconocer los alimentos y no se guarda. El reconocimiento lo hace un modelo de IA (Claude, de Anthropic) y puede equivocarse: ante la duda, revisa.</p>
            <p><b style={{ color: C.tinta }}>Nutrición.</b> Las cifras son orientativas, por porción típica. No reemplazan a un profesional.</p>
            <p><b style={{ color: C.tinta }}>Tus datos.</b> {cloudEnabled ? "Si tienes cuenta, tu canasta se guarda también en la nube para no perderla." : "Todo se guarda en este celular."} Puedes descargarlos o borrarlos cuando quieras.</p>
            <p><b style={{ color: C.tinta }}>Precios y CO₂.</b> Son aproximados, con precios de plaza en Colombia y ≈ 0,8 kg de CO₂ por kg de fruta que no se bota.</p>
          </div>
        </Sheet>
      )}
      {sheet === "delete" && (
        <Sheet label="Borrar todo" onClose={() => setSheet(null)}>
          <SheetHeader title="¿Borrar todo?" onClose={() => setSheet(null)} />
          <p style={{ margin: "4px 0 16px", fontSize: 15, color: C.media }}>Se borran tu canasta, tu huerta y tus ajustes{profile.account === "account" ? ", aquí y en la nube" : ""}. No se puede deshacer.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="press" onClick={wipe} style={{ height: 56, borderRadius: 28, background: "#C2412F", color: "#FFFFFF", fontSize: 17, fontWeight: 700 }}>Sí, borrar todo</button>
            <button className="press" onClick={() => setSheet(null)} style={{ height: 52, borderRadius: 26, fontSize: 16, fontWeight: 600, color: C.media }}>Mejor no</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
