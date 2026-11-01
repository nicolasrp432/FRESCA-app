import { Fruta } from "../ui/Fruta";

/** Estado · cargando: tres frutas que ruedan por el mesón */
export function Cargando({ text = "Poniendo la mesa…" }: { text?: string }) {
  return (
    <div className="screen grain" aria-busy="true">
      <div className="scene" style={{ height: "100%" }}>
        <div style={{ position: "absolute", left: -40, right: -40, top: 410, height: 130, borderRadius: "50%", background: "#F1E5D1", boxShadow: "inset 0 8px 20px rgba(120,84,40,.12)" }} />
        <div className="roll" aria-hidden="true" style={{ position: "absolute", left: 0, top: 370 }}><div className="rock"><Fruta kind="tomate" stage={1} ring={false} size={120} decorative /></div></div>
        <div className="roll roll2" aria-hidden="true" style={{ position: "absolute", left: 0, top: 380, animationDelay: "1s" }}><div className="rock" style={{ animationDelay: "200ms" }}><Fruta kind="mango" stage={1} ring={false} size={110} decorative /></div></div>
        <div className="roll roll3" aria-hidden="true" style={{ position: "absolute", left: 0, top: 390, animationDelay: "2s" }}><div className="rock" style={{ animationDelay: "400ms" }}><Fruta kind="papaya" stage={1} ring={false} size={110} decorative /></div></div>
        <p className="bric" role="status" aria-live="polite" style={{ position: "absolute", left: 24, right: 24, top: 580, textAlign: "center", fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }}>{text}</p>
      </div>
    </div>
  );
}
