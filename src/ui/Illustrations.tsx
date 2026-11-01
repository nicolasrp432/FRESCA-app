import type { CSSProperties } from "react";

export type Dish = "glass" | "loaf" | "pop" | "jar" | "pan" | "bowl";

/** Plato de receta (vitrina). Se sale del borde de la bandeja. */
export function DishArt({ dish, color, topping = "#FFFFFF", size = 96, style }: { dish: Dish; color: string; topping?: string; size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" style={style}>
      <ellipse cx="60" cy="110" rx="38" ry="6" fill="#5A3E22" opacity="0.18" />
      {dish === "glass" && (
        <g><path d="M34 14 L 86 14 L 79 104 C 78 109, 42 109, 41 104 Z" fill="#FFFFFF" fillOpacity="0.6" stroke="#D8CBB4" strokeWidth="2" /><path d="M37 34 L 83 34 L 79 101 C 78 105, 42 105, 41 101 Z" fill={color} /><ellipse cx="60" cy="34" rx="23" ry="5" fill="#FFFFFF" fillOpacity="0.5" /><rect x="64" y="0" width="6" height="58" rx="3" fill="#2F6B3A" transform="rotate(12 67 30)" /></g>
      )}
      {dish === "loaf" && (
        <g><path d="M14 62 C 14 46, 30 38, 60 38 C 90 38, 106 46, 106 62 L 102 98 C 101 103, 19 103, 18 98 Z" fill="#B8743A" /><path d="M14 62 C 14 46, 30 38, 60 38 C 90 38, 106 46, 106 62 C 90 56, 30 56, 14 62 Z" fill="#8E5426" /><ellipse cx="46" cy="48" rx="8" ry="4" fill="#F6DE9A" /><ellipse cx="70" cy="46" rx="8" ry="4" fill="#F6DE9A" /></g>
      )}
      {dish === "pop" && (
        <g><rect x="54" y="74" width="12" height="34" rx="5" fill="#E8C690" /><path d="M32 30 C 32 16, 44 8, 60 8 C 76 8, 88 16, 88 30 L 88 78 C 88 84, 32 84, 32 78 Z" fill={color} /><g fill="#3B2E1E"><ellipse cx="50" cy="38" rx="2.4" ry="3" /><ellipse cx="64" cy="48" rx="2.4" ry="3" /><ellipse cx="52" cy="60" rx="2.4" ry="3" /></g></g>
      )}
      {dish === "jar" && (
        <g><rect x="36" y="14" width="48" height="14" rx="4" fill="#2F6B3A" /><rect x="28" y="26" width="64" height="80" rx="16" fill="#FFFFFF" fillOpacity="0.7" stroke="#D8CBB4" strokeWidth="2" /><rect x="32" y="42" width="56" height="60" rx="13" fill={color} /><rect x="42" y="58" width="36" height="20" rx="5" fill="#FBF7EF" /></g>
      )}
      {dish === "pan" && (
        <g><rect x="88" y="62" width="30" height="10" rx="5" fill="#5E6A5A" transform="rotate(-10 100 66)" /><ellipse cx="54" cy="72" rx="44" ry="26" fill="#3E4A3C" /><ellipse cx="54" cy="68" rx="38" ry="20" fill={color} /><g fill="#F2E2C2"><circle cx="40" cy="64" r="3" /><circle cx="58" cy="72" r="3" /><circle cx="68" cy="62" r="3" /><circle cx="48" cy="74" r="2.5" /></g><g fill="#4E8A3A"><circle cx="52" cy="62" r="2" /><circle cx="72" cy="72" r="2" /></g></g>
      )}
      {dish === "bowl" && (
        <g><path d="M14 58 L 106 58 C 106 88, 86 104, 60 104 C 34 104, 14 88, 14 58 Z" fill="#FFFDF6" stroke="#D8CBB4" strokeWidth="2" /><ellipse cx="60" cy="58" rx="46" ry="11" fill={color} /><circle cx="46" cy="54" r="5" fill={topping} /><circle cx="66" cy="52" r="5" fill={topping} /><circle cx="78" cy="57" r="4" fill={topping} /></g>
      )}
    </svg>
  );
}

/** Vaso de batido grande (portada, Hoy, celebración) */
export function Smoothie({ width = 104, height = 128, color = "#F4D27E", foam = "#FCEBB6", straw = "#F28C5B", shine = true, style, className }: { width?: number; height?: number; color?: string; foam?: string; straw?: string; shine?: boolean; style?: CSSProperties; className?: string }) {
  return (
    <svg width={width} height={height} viewBox="0 0 120 150" aria-hidden="true" style={style} className={className}>
      <ellipse cx="60" cy="140" rx="34" ry="6" fill="#5A3E22" opacity="0.18" />
      <path d="M30 28 L 90 28 L 82 132 C 81 138, 39 138, 38 132 Z" fill="#FFFFFF" fillOpacity="0.6" stroke="#D8CBB4" strokeWidth="2" />
      <path d="M34 50 L 86 50 L 81.5 128 C 80.5 133, 39.5 133, 38.5 128 Z" fill={color} />
      <path d="M70 50 L 86 50 L 81.5 128 C 81 131, 75 132, 70 132 Z" fill="#000" opacity="0.06" />
      <rect x="66" y="6" width="7" height="70" rx="3.5" fill={straw} transform="rotate(12 69 40)" />
      <ellipse cx="60" cy="50" rx="26" ry="6" fill={foam} />
      <circle cx="36" cy="30" r="10" fill="#FFF1C4" stroke="#E9C46A" strokeWidth="2" />
      {shine && <path d="M40 38 L 44 120" stroke="#FFFFFF" strokeOpacity="0.8" strokeWidth="3" strokeLinecap="round" />}
    </svg>
  );
}

/** Matera pequeña con brote (encabezado, perfil, avisos) */
export function PotSprout({ size = 34, shadow = false }: { size?: number; shadow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      <path d="M40 42 C 40 34, 40 28, 40 22" stroke="#4E8A3A" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M40 32 C 30 32, 24 26, 24 18 C 34 18, 40 24, 40 32 Z" fill="#6FAE57" />
      <path d="M40 26 C 48 26, 56 20, 56 12 C 46 12, 40 18, 40 26 Z" fill="#5E9E4A" />
      <path d="M18 44 L 62 44 L 57 72 C 56 76, 24 76, 23 72 Z" fill="#D9784A" />
      <rect x="14" y="38" width="52" height="9" rx="4.5" fill="#E8895A" />
      <path d="M24 50 L 27 70" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="3" strokeLinecap="round" />
      {shadow && <ellipse cx="40" cy="77" rx="22" ry="3" fill="#5A3E22" opacity="0.18" />}
    </svg>
  );
}

/** Matera grande de la huerta, 5 niveles */
export function PotLevels({ level, label, width = 230, height = 240, style }: { level: number; label: string; width?: number; height?: number; style?: CSSProperties }) {
  const show = (i: number) => (level === i ? "inline" : "none");
  return (
    <svg role="img" aria-label={label} width={width} height={height} viewBox="0 0 120 125" style={style}>
      <ellipse cx="60" cy="118" rx="34" ry="5" fill="#5A3E22" opacity="0.2" />
      <g display={show(0)}><ellipse cx="60" cy="72" rx="9" ry="5" fill="#8E6232" /><ellipse cx="58" cy="70" rx="3" ry="2" fill="#C99A5E" /></g>
      <g display={show(1)} className="plant"><path d="M60 74 L 60 54" stroke="#4E8A3A" strokeWidth="3.5" strokeLinecap="round" /><path d="M60 62 C 48 62, 40 55, 40 44 C 52 44, 60 51, 60 62 Z" fill="#6FAE57" /><path d="M60 56 C 70 56, 80 49, 80 38 C 68 38, 60 45, 60 56 Z" fill="#5E9E4A" /></g>
      <g display={show(2)} className="plant"><path d="M60 74 L 60 30" stroke="#4E8A3A" strokeWidth="4" strokeLinecap="round" /><path d="M60 64 C 44 64, 34 56, 34 42 C 50 42, 60 50, 60 64 Z" fill="#6FAE57" /><path d="M60 54 C 74 54, 86 46, 86 32 C 70 32, 60 40, 60 54 Z" fill="#5E9E4A" /><path d="M60 40 C 50 40, 42 34, 42 24 C 52 24, 60 30, 60 40 Z" fill="#8CC46E" /><path d="M60 32 C 66 28, 70 20, 68 12 C 60 16, 58 24, 60 32 Z" fill="#6FAE57" /></g>
      <g display={show(3)} className="plant"><path d="M60 74 L 60 26 M60 50 L 44 34 M60 46 L 78 30" stroke="#4E8A3A" strokeWidth="4" strokeLinecap="round" /><ellipse cx="42" cy="44" rx="18" ry="13" fill="#6FAE57" /><ellipse cx="78" cy="40" rx="18" ry="13" fill="#5E9E4A" /><ellipse cx="60" cy="26" rx="18" ry="14" fill="#8CC46E" /><circle cx="70" cy="22" r="5" fill="#F2C14E" /><circle cx="70" cy="22" r="2" fill="#E2702E" /></g>
      <g display={show(4)} className="plant"><path d="M60 74 L 60 26 M60 50 L 44 34 M60 46 L 78 30" stroke="#4E8A3A" strokeWidth="4" strokeLinecap="round" /><ellipse cx="42" cy="44" rx="19" ry="14" fill="#6FAE57" /><ellipse cx="78" cy="40" rx="19" ry="14" fill="#5E9E4A" /><ellipse cx="60" cy="24" rx="19" ry="15" fill="#8CC46E" /><circle cx="46" cy="46" r="6" fill="#E2483C" /><circle cx="76" cy="44" r="6" fill="#E2483C" /><circle cx="62" cy="30" r="6" fill="#F28C5B" /><circle cx="44" cy="44" r="1.6" fill="#FFFFFF" opacity="0.5" /></g>
      <path d="M28 76 L 92 76 L 85 114 C 84 119, 36 119, 35 114 Z" fill="#D9784A" />
      <path d="M78 80 L 92 76 L 85 114 C 84.5 117, 80 118, 76 118 Z" fill="#B85E36" opacity="0.6" />
      <rect x="22" y="68" width="76" height="12" rx="6" fill="#E8895A" />
      <ellipse cx="60" cy="72" rx="32" ry="3.5" fill="#6B4A2E" />
      <path d="M36 84 L 40 110" stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function Compost({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true">
      <path d="M40 30 C 40 24, 40 20, 40 16" stroke="#4E8A3A" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M40 24 C 32 24, 28 20, 28 14 C 36 14, 40 18, 40 24 Z" fill="#6FAE57" />
      <path d="M40 20 C 46 20, 52 16, 52 10 C 44 10, 40 14, 40 20 Z" fill="#5E9E4A" />
      <path d="M16 34 L 64 34 L 60 70 C 59 74, 21 74, 20 70 Z" fill="#7C8A52" />
      <rect x="12" y="28" width="56" height="9" rx="4" fill="#8E9C60" />
      <path d="M28 46 L 52 46 M28 56 L 52 56" stroke="#5E6A3A" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function SaveArt({ icon, size = 56 }: { icon: "congelar" | "mermelada" | "nevera" | "salsa"; size?: number }) {
  if (icon === "mermelada" || icon === "salsa") {
    const c = icon === "salsa" ? "#D2382E" : "#E2702E";
    return (
      <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true"><rect x="22" y="10" width="36" height="11" rx="3" fill="#2F6B3A" /><rect x="16" y="20" width="48" height="52" rx="12" fill="#FFFFFF" fillOpacity="0.7" stroke="#D8CBB4" strokeWidth="2" /><rect x="19" y="32" width="42" height="37" rx="10" fill={c} /><rect x="26" y="42" width="28" height="14" rx="4" fill="#FBF7EF" /></svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true"><rect x="12" y="14" width="56" height="56" rx="9" fill="#EAF2F4" stroke="#B9CDD3" strokeWidth="2" /><path d="M12 24 L 68 24" stroke="#2F6B3A" strokeWidth="3" /><circle cx="30" cy="42" r="8" fill="#FBE7A8" stroke="#E9C46A" strokeWidth="1.5" /><circle cx="48" cy="40" r="8" fill="#FBE7A8" stroke="#E9C46A" strokeWidth="1.5" /><circle cx="38" cy="56" r="8" fill="#FBE7A8" stroke="#E9C46A" strokeWidth="1.5" /></svg>
  );
}

export function Mold({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true"><circle cx="20" cy="26" r="11" fill="#ECE8DC" /><circle cx="30" cy="20" r="8" fill="#E2DED2" /><circle cx="29" cy="31" r="6" fill="#F2EFE6" /><circle cx="19" cy="24" r="1.5" fill="#A9A495" /><circle cx="28" cy="19" r="1.3" fill="#A9A495" /><circle cx="25" cy="30" r="1.2" fill="#A9A495" /></svg>
  );
}
export function Liquid({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true"><path d="M24 8 C 30 18, 35 24, 35 30 A 11 11 0 0 1 13 30 C 13 24, 18 18, 24 8 Z" fill="#B9A27A" /><path d="M18 30 A 6 6 0 0 0 23 36" fill="none" stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="2.5" strokeLinecap="round" /></svg>
  );
}
export function Sour({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="#1F2A1E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 10 C 18 18, 12 24, 12 30 C 12 34, 16 35, 19 33" /><path d="M26 22 C 30 20, 34 22, 36 20 M26 28 C 30 26, 34 28, 37 26 M26 34 C 30 32, 34 34, 36 32" /></svg>
  );
}

/** Frutero con fruta (cómo guardarlo) */
export function FruitBowl() {
  return (
    <svg width="72" height="60" viewBox="0 0 90 70" aria-hidden="true"><ellipse cx="45" cy="62" rx="36" ry="5" fill="#5A3E22" opacity="0.18" /><path d="M10 32 L 80 32 C 78 50, 64 60, 45 60 C 26 60, 12 50, 10 32 Z" fill="#C79A62" /><path d="M18 40 L 72 40 M22 48 L 68 48" stroke="#A67A44" strokeWidth="2" /><path d="M20 30 C 26 18, 52 14, 66 26 C 60 22, 40 20, 26 32 Z" fill="#E7B13C" /><circle cx="58" cy="27" r="7" fill="#E2483C" /></svg>
  );
}

export function Fridge() {
  return (
    <svg width="72" height="60" viewBox="0 0 90 70" aria-hidden="true"><ellipse cx="45" cy="64" rx="26" ry="4" fill="#5A3E22" opacity="0.18" /><rect x="24" y="4" width="42" height="58" rx="8" fill="#EAF2F4" stroke="#B9CDD3" strokeWidth="2" /><path d="M24 26 L 66 26" stroke="#B9CDD3" strokeWidth="2" /><path d="M30 12 L 30 20 M30 32 L 30 44" stroke="#2F6B3A" strokeWidth="3" strokeLinecap="round" /></svg>
  );
}

export function MilkMug({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true"><ellipse cx="38" cy="70" rx="22" ry="4" fill="#5A3E22" opacity="0.2" /><path d="M56 34 C 66 34, 66 52, 56 52" fill="none" stroke="#E9E0CF" strokeWidth="5" /><rect x="16" y="22" width="42" height="46" rx="9" fill="#FFFDF6" stroke="#D8CBB4" strokeWidth="2" /><ellipse cx="37" cy="26" rx="18" ry="4" fill="#FFFFFF" stroke="#E9E0CF" strokeWidth="1.5" /></svg>
  );
}

/** Ingrediente de despensa genérico: un frasquito con su inicial de color */
export function PantryJar({ color = "#C79A62", size = 58, faded }: { color?: string; size?: number; faded?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true" style={{ opacity: faded ? 0.75 : 1 }}>
      <ellipse cx="40" cy="72" rx="20" ry="4" fill="#5A3E22" opacity="0.18" />
      <rect x="26" y="12" width="28" height="10" rx="3" fill="#2F6B3A" />
      <rect x="20" y="20" width="40" height="50" rx="11" fill="#FFFFFF" fillOpacity="0.75" stroke="#D8CBB4" strokeWidth="2" />
      <rect x="23" y="34" width="34" height="33" rx="9" fill={color} />
    </svg>
  );
}

export function Cinnamon({ size = 58 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden="true" style={{ opacity: 0.75 }}><rect x="12" y="30" width="56" height="10" rx="5" fill="#9A5A2E" transform="rotate(-14 40 35)" /><rect x="14" y="44" width="54" height="10" rx="5" fill="#8A4E26" transform="rotate(-14 40 49)" /></svg>
  );
}

export function FruitPile() {
  return (
    <svg width="64" height="56" viewBox="0 0 80 70" aria-hidden="true"><ellipse cx="40" cy="64" rx="32" ry="4" fill="#5A3E22" opacity="0.18" /><circle cx="24" cy="52" r="12" fill="#E2483C" /><circle cx="50" cy="52" r="13" fill="#F28C5B" /><circle cx="37" cy="32" r="13" fill="#F2C14E" /><circle cx="62" cy="38" r="9" fill="#6FAE57" /><circle cx="33" cy="27" r="3" fill="#FFFFFF" opacity="0.4" /></svg>
  );
}
export function Coins() {
  return (
    <svg width="64" height="56" viewBox="0 0 80 70" aria-hidden="true"><ellipse cx="40" cy="64" rx="30" ry="4" fill="#5A3E22" opacity="0.18" /><ellipse cx="40" cy="56" rx="22" ry="7" fill="#B9952E" /><ellipse cx="40" cy="52" rx="22" ry="7" fill="#E9B530" /><ellipse cx="40" cy="46" rx="22" ry="7" fill="#B9952E" /><ellipse cx="40" cy="42" rx="22" ry="7" fill="#F2C14E" /><ellipse cx="40" cy="42" rx="12" ry="3.5" fill="none" stroke="#B9952E" strokeWidth="2" /></svg>
  );
}
export function Cloud() {
  return (
    <svg width="64" height="56" viewBox="0 0 80 70" aria-hidden="true"><path d="M20 46 A 12 12 0 0 1 24 23 A 16 16 0 0 1 54 20 A 12 12 0 0 1 60 46 Z" fill="#E6E2D8" /><circle cx="66" cy="22" r="4" fill="#E6E2D8" opacity="0.6" /><circle cx="72" cy="12" r="2.6" fill="#E6E2D8" opacity="0.4" /><path d="M26 54 L 54 54" stroke="#C9C2B4" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 6" /></svg>
  );
}
