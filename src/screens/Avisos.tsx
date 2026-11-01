import { useEffect, useMemo, useState } from "react";
import { buildNotices } from "../lib/domain";
import { askPermission, notifSupported } from "../lib/notify";
import { ideaName } from "../lib/pick";
import { actions, getState, useStore } from "../state/store";
import { C, useNow } from "../ui/Common";
import { Fruta } from "../ui/Fruta";
import { IconBell } from "../ui/Icons";
import { PotSprout } from "../ui/Illustrations";

export default function Avisos() {
  const now = useNow();
  const items = useStore((s) => s.items);
  const events = useStore((s) => s.events);
  const name = useStore((s) => s.profile.name);
  const notifOn = useStore((s) => s.profile.flags.notif);
  const [seenBefore] = useState(() => getState().seenNoticesAt);
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">(notifSupported() ? Notification.permission : "unsupported");
  const notices = useMemo(() => buildNotices(items, events, ideaName, now), [items, events, now]);

  useEffect(() => {
    const t = window.setTimeout(() => setOpen(true), 30);
    actions.markNoticesSeen();
    return () => window.clearTimeout(t);
  }, []);

  const enable = async () => {
    const p = await askPermission();
    setPerm(p);
    if (p === "granted") actions.setFlag("notif", true);
  };

  return (
    <div className="screen grain">
      <div aria-hidden="true" style={{ padding: "22px 20px 0" }}>
        <span style={{ display: "block", fontSize: 17, fontWeight: 600 }}>{name ? `Buenas, ${name}` : "Buenas"}</span>
        <span className="bric" style={{ display: "block", marginTop: 30, fontSize: 50, fontWeight: 800, letterSpacing: "-0.035em" }}>Úsalo hoy</span>
        <div style={{ marginTop: 20, height: 180, borderRadius: "50%", background: C.plato }} />
      </div>
      <div style={{ position: "absolute", left: 20, right: 20, top: 470, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <button className="press tray" onClick={() => setOpen(true)} style={{ height: 56, padding: "0 22px", borderRadius: 28, display: "flex", alignItems: "center", gap: 8, fontSize: 17, fontWeight: 600 }}><IconBell />Ver avisos</button>
        <a href="#/hoy" style={{ height: 44, display: "flex", alignItems: "center", fontSize: 15, fontWeight: 600, color: C.hoja }}>Ir a Hoy</a>
      </div>

      <div className="scrim" aria-hidden="true" onClick={() => setOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(31,42,30,.4)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 300ms ease" }} />

      <section className="blind slats" role="dialog" aria-label="Avisos" aria-hidden={!open} style={{ position: "absolute", left: 0, right: 0, top: 0, maxHeight: "92%", overflowY: "auto", padding: "calc(18px + env(safe-area-inset-top)) 16px 10px", borderRadius: "0 0 32px 32px", boxShadow: "0 20px 40px -16px rgba(60,40,20,.5)", transform: `translateY(${open ? "0%" : "-104%"})` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 12px" }}>
          <h1 className="bric" style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em" }}>Avisos</h1>
          <a href="#/perfil" className="press" style={{ height: 44, padding: "0 12px", borderRadius: 22, display: "flex", alignItems: "center", fontSize: 14, fontWeight: 600, color: C.hoja }}>Ajustar</a>
        </div>
        {notifOn && perm === "default" && (
          <div className="item" style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 10px", padding: "10px 12px", borderRadius: 20, background: C.hojaClaro }}>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: C.hoja }}>Que te lleguen al celular</span>
            <button className="press" onClick={enable} style={{ height: 40, padding: "0 14px", borderRadius: 20, background: C.hoja, color: "#FFFFFF", fontSize: 14, fontWeight: 700 }}>Activar</button>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notices.length === 0 && <p className="tray item" style={{ padding: "16px 14px", borderRadius: 22, fontSize: 15, fontWeight: 600 }}>Nada por ahora. Te aviso cuando algo esté por pasarse.</p>}
          {notices.map((n, i) => (
            <a key={n.id} href={n.href} className="press tray item" style={{ display: "flex", alignItems: "center", gap: 8, padding: n.plant ? "6px 14px 6px 8px" : "4px 14px 4px 2px", borderRadius: 22, animationDelay: `${160 + i * 60}ms` }}>
              {n.plant ? <PotSprout size={52} /> : n.kind != null && <Fruta kind={n.kind} stage={n.stage ?? 2} size={64} decorative />}
              <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 1 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{n.title}</span>
                <span style={{ fontSize: 13, color: C.suave }}>{n.sub}</span>
              </div>
              {n.at > seenBefore && <span aria-label="Nuevo" role="img" style={{ width: 10, height: 10, borderRadius: "50%", background: C.papaya, flex: "none" }} />}
            </a>
          ))}
        </div>
        <button className="press" onClick={() => setOpen(false)} aria-label="Cerrar avisos" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, width: "100%", padding: "14px 0 4px" }}>
          <span style={{ width: 52, height: 6, borderRadius: 3, background: "#C9BCA6" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.suave }}>Subir persiana</span>
        </button>
      </section>
    </div>
  );
}
