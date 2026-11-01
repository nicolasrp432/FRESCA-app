import { useEffect, useState } from "react";
import { useOnline } from "../lib/device";
import { back } from "../lib/router";
import { byUrgency, currentStage, openItems } from "../lib/domain";
import { useStore } from "../state/store";
import { C, ghostBtn, primaryBtn } from "../ui/Common";
import { Fruta } from "../ui/Fruta";

/** Estado · sin conexión. La canasta y las recetas guardadas funcionan igual. */
export default function Offline() {
  const online = useOnline();
  const [tried, setTried] = useState(false);
  const items = useStore((s) => s.items);
  const top = byUrgency(openItems(items)).slice(0, 2);
  const shown = top.length ? top : null;

  useEffect(() => {
    if (online && tried) back("/hoy");
  }, [online, tried]);

  const retry = () => {
    setTried(false);
    window.setTimeout(() => {
      if (navigator.onLine) back("/hoy");
      else setTried(true);
    }, 300);
  };

  return (
    <div className="screen grain">
      <div className="scene" style={{ height: "100%" }}>
        <div style={{ position: "absolute", left: 30, right: 30, top: 380, height: 120, borderRadius: "50%", background: C.plato, boxShadow: "inset 0 8px 20px rgba(120,84,40,.12)" }} />
        <svg className="drift" aria-hidden="true" width="170" height="110" viewBox="0 0 170 110" style={{ position: "absolute", left: 110, top: 150 }}>
          <path d="M40 90 A 26 26 0 0 1 44 40 A 36 36 0 0 1 112 32 A 28 28 0 0 1 132 90 Z" fill="#E6E2D8" />
          <path d="M50 60 A 14 14 0 0 1 64 48" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
          <path d="M30 20 L 140 100" stroke="#5E685A" strokeWidth="7" strokeLinecap="round" />
          <path d="M30 20 L 140 100" stroke="#FBF7EF" strokeWidth="3" strokeLinecap="round" transform="translate(-4 4)" />
        </svg>
        <div style={{ position: "absolute", left: 60, top: 330 }}>
          {shown ? <Fruta kind={shown[0].kind} stage={currentStage(shown[0])} size={150} /> : <Fruta kind="banano" stage={2} size={150} decorative />}
        </div>
        <div style={{ position: "absolute", left: 196, top: 336 }}>
          {shown?.[1] ? <Fruta kind={shown[1].kind} stage={currentStage(shown[1])} size={140} /> : <Fruta kind="papaya" stage={1} size={140} decorative />}
        </div>
        <div style={{ position: "absolute", left: 24, right: 24, top: 530, textAlign: "center" }}>
          <h1 className="bric" style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.02 }}>Sin internet, pero tu canasta sigue aquí.</h1>
          {tried && <p role="status" className="fadein" style={{ marginTop: 10, fontSize: 15, color: C.media }}>Todavía nada. Lo de hoy funciona igual.</p>}
        </div>
      </div>
      <div style={{ position: "absolute", left: 20, right: 20, bottom: "calc(28px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 6 }}>
        <a href="#/canasta" className="press" style={primaryBtn()}>Ver mi canasta</a>
        <button className="press" onClick={retry} style={ghostBtn()}>Reintentar</button>
      </div>
    </div>
  );
}
