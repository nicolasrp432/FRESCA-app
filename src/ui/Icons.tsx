import type { CSSProperties, ReactNode } from "react";

type P = { size?: number; style?: CSSProperties; strokeWidth?: number };
const base = (size: number, sw: number, children: ReactNode, style?: CSSProperties, fill = "none") => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>
    {children}
  </svg>
);

export const IconBack = ({ size = 24, strokeWidth = 2.2, style }: P) => base(size, strokeWidth, <path d="M15 5 L 8 12 L 15 19" />, style);
export const IconChevron = ({ size = 20, strokeWidth = 2, style }: P) => base(size, strokeWidth, <path d="M9 5 L 16 12 L 9 19" />, style);
export const IconClose = ({ size = 22, strokeWidth = 2.2, style }: P) => base(size, strokeWidth, <path d="M6 6 L 18 18 M18 6 L 6 18" />, style);
export const IconCheck = ({ size = 18, strokeWidth = 2.4, style }: P) => base(size, strokeWidth, <path d="M5 12.5 L 9.5 17 L 19 7" />, style);
export const IconClock = ({ size = 16, strokeWidth = 2, style }: P) => base(size, strokeWidth, <><circle cx="12" cy="12" r="8" /><path d="M12 8 L 12 12 L 15 14" /></>, style);
export const IconBell = ({ size = 22, strokeWidth = 2, style }: P) => base(size, strokeWidth, <><path d="M6 16 L 6 11 A 6 6 0 0 1 18 11 L 18 16 L 20 18 L 4 18 Z" /><path d="M10 21 L 14 21" /></>, style);
export const IconBasket = ({ size = 22, strokeWidth = 2, style }: P) => base(size, strokeWidth, <><path d="M4 10 L 20 10 L 18.4 18.4 A 2 2 0 0 1 16.4 20 L 7.6 20 A 2 2 0 0 1 5.6 18.4 Z" /><path d="M8 10 L 11 4 M16 10 L 13 4" /></>, style);
export const IconScan = ({ size = 30, strokeWidth = 2.2, style }: P) => base(size, strokeWidth, <><path d="M4 8 L 4 6 A 2 2 0 0 1 6 4 L 8 4 M16 4 L 18 4 A 2 2 0 0 1 20 6 L 20 8 M20 16 L 20 18 A 2 2 0 0 1 18 20 L 16 20 M8 20 L 6 20 A 2 2 0 0 1 4 18 L 4 16" /><circle cx="12" cy="12" r="3.6" /></>, style);
export const IconGallery = ({ size = 24, strokeWidth = 2, style }: P) => base(size, strokeWidth, <><rect x="3" y="5" width="18" height="14" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16 L 16 11 L 8 19" /></>, style);
export const IconTorch = ({ size = 24, strokeWidth = 2, style }: P) => base(size, strokeWidth, <><path d="M8 3 L 16 3 L 16 7 L 14 11 L 14 21 L 10 21 L 10 11 L 8 7 Z" /><path d="M12 14 L 12 16" /></>, style);
export const IconMinus = ({ size = 22, strokeWidth = 2.6, style }: P) => base(size, strokeWidth, <path d="M6 12 L 18 12" />, style);
export const IconPlus = ({ size = 22, strokeWidth = 2.6, style }: P) => base(size, strokeWidth, <path d="M12 6 L 12 18 M6 12 L 18 12" />, style);
export const IconPhone = ({ size = 16, strokeWidth = 2, style }: P) => base(size, strokeWidth, <><rect x="8" y="3" width="8" height="18" rx="2" /><path d="M4 9 L 4 15 M20 9 L 20 15" /></>, style);
export const IconAlert = ({ size = 14, strokeWidth = 2.6, style }: P) => base(size, strokeWidth, <path d="M12 7 L 12 13 M12 17 L 12 17.2" />, style);
export const IconDownload = ({ size = 20, strokeWidth = 2, style }: P) => base(size, strokeWidth, <path d="M12 4 L 12 15 M7 10 L 12 15 L 17 10 M5 20 L 19 20" />, style);
export const IconRetry = ({ size = 22, strokeWidth = 2.2, style }: P) => base(size, strokeWidth, <><path d="M4 12 A 8 8 0 1 0 7 5.8" /><path d="M4 4 L 4 9 L 9 9" /></>, style);
export const IconSun = ({ size = 22, strokeWidth = 2.2, style }: P) => base(size, strokeWidth, <><circle cx="12" cy="12" r="4" /><path d="M12 2 L 12 4 M12 20 L 12 22 M2 12 L 4 12 M20 12 L 22 12 M5 5 L 6.5 6.5 M17.5 17.5 L 19 19 M5 19 L 6.5 17.5 M17.5 6.5 L 19 5" /></>, style);
export const IconHand = ({ size = 24, strokeWidth = 2, style }: P) => base(size, strokeWidth, <path d="M8 13 L 8 5.5 A 1.5 1.5 0 0 1 11 5.5 L 11 11 M11 10 L 11 4 A 1.5 1.5 0 0 1 14 4 L 14 11 M14 10 L 14 5.5 A 1.5 1.5 0 0 1 17 5.5 L 17 14 C 17 18, 14.5 21, 11 21 C 8 21, 6.5 19, 5 16.5 L 3.6 14 A 1.5 1.5 0 0 1 6 12.4 L 8 15" />, style);
export const IconTrend = ({ size = 16, strokeWidth = 2.6, style }: P) => base(size, strokeWidth, <path d="M6 9 L 12 15 L 18 9" />, style);

/* Kit de acción · trazo 2 px */
export type Action = "cortar" | "licuar" | "hervir" | "congelar" | "mezclar" | "hornear" | "guardar" | "compostar" | "servir";
export function ActionIcon({ action, size = 28 }: { action: Action; size?: number }) {
  const paths: Record<Action, ReactNode> = {
    cortar: <><path d="M3 15 C 8 15, 14 13, 18 9 L 18 16 L 3 16 Z" /><path d="M18 12.5 L 22 12.5" /></>,
    licuar: <><path d="M7 3 L 17 3 L 15 14 L 9 14 Z" /><path d="M6 14 L 18 14 L 17 20 L 7 20 Z M10 9 L 14 9" /></>,
    hervir: <><path d="M4 11 L 20 11 L 19 19 A 2 2 0 0 1 17 20.5 L 7 20.5 A 2 2 0 0 1 5 19 Z" /><path d="M2 11 L 4 11 M20 11 L 22 11 M9 7.5 C 9 6, 10.5 6, 10.5 4 M14 7.5 C 14 6, 15.5 6, 15.5 4" /></>,
    congelar: <path d="M12 3 L 12 21 M4.2 7.5 L 19.8 16.5 M19.8 7.5 L 4.2 16.5 M9.5 4.5 L 12 7 L 14.5 4.5 M9.5 19.5 L 12 17 L 14.5 19.5" />,
    mezclar: <><path d="M4 12 L 20 12 A 8 8 0 0 1 4 12 Z" /><path d="M13 12 L 19 3" /></>,
    hornear: <><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M3 9 L 21 9" /><rect x="7" y="12" width="10" height="5" rx="1" /></>,
    guardar: <><path d="M8 3 L 16 3 L 16 6 L 8 6 Z" /><path d="M7 6 L 17 6 A 2 2 0 0 1 19 8 L 19 19 A 2 2 0 0 1 17 21 L 7 21 A 2 2 0 0 1 5 19 L 5 8 A 2 2 0 0 1 7 6 Z M9 12.5 L 15 12.5" /></>,
    compostar: <><path d="M5 11 L 19 11 L 17.5 20 L 6.5 20 Z" /><path d="M12 11 L 12 7 M12 8 C 12 6, 10 4.5, 8 4.5 C 8 6.5, 10 8, 12 8 Z M12 7 C 12 5, 14 3.5, 16 3.5 C 16 5.5, 14 7, 12 7 Z" /></>,
    servir: <path d="M7 4 L 17 4 L 15.5 20 L 8.5 20 Z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#1F2A1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[action]}
    </svg>
  );
}

/** Puntos de dificultad (1 a 3) */
export function Difficulty({ level, dot = 6 }: { level: 1 | 2 | 3; dot?: number }) {
  const label = ["Dificultad baja", "Dificultad media", "Dificultad alta"][level - 1];
  return (
    <span role="img" aria-label={label} style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3].map((n) => (
        <span key={n} style={{ width: dot, height: dot, borderRadius: "50%", background: n <= level ? "#2F6B3A" : "#D9D2C4" }} />
      ))}
    </span>
  );
}
