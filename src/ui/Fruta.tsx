import { useId } from "react";
import type { Kind, Stage } from "../data/foods";
import { FOODS, STAGE_COLORS, STAGE_WORDS } from "../data/foods";

/**
 * Modelo de "arcilla de mercado": cada alimento en 4 estados de madurez.
 * Anillo de madurez = color + llenado + palabra (¼, ½, ¾, lleno).
 */
const PAL: Record<Kind, [string, string, string][]> = {
  banano: [["#E4EC9A", "#B8C64A", "#7D8C2A"], ["#FFE89A", "#F3C94A", "#C9962A"], ["#FBD77E", "#E7B13C", "#B07A22"], ["#C99A5E", "#8E6232", "#5A3A1C"]],
  papaya: [["#A9CF7A", "#6E9E45", "#46702A"], ["#FFC27A", "#EE9A48", "#B9662A"], ["#FFB58A", "#F2844F", "#BE5530"], ["#E89C74", "#C9693F", "#8A4022"]],
  fresa: [["#FF8E7A", "#E2483C", "#A82A2A"], ["#F0645E", "#C8323A", "#8E1F2A"], ["#C8505A", "#9E2A33", "#6A1A22"], ["#A0686A", "#7A3E40", "#4E2628"]],
  mango: [["#B9D57E", "#7EAA48", "#527A2A"], ["#FFD27A", "#F3B23C", "#C47F22"], ["#FFC46A", "#EA982E", "#B5651C"], ["#D8A060", "#A86C30", "#6E4218"]],
  tomate: [["#FF8A6E", "#E24A36", "#A82C22"], ["#F26A5A", "#D2382E", "#962220"], ["#D86A5A", "#B83A30", "#7E2420"], ["#A86A5C", "#8A3E32", "#5A2620"]],
  aguacate: [["#A5C870", "#6F9A3B", "#46682A"], ["#6E8E4A", "#46632E", "#2C4220"], ["#5A5244", "#3C352C", "#221E18"], ["#5E5040", "#3A3026", "#1E1812"]],
};
const FILLS = [25, 50, 75, 100];

export interface FrutaProps {
  kind: Kind;
  stage?: Stage;
  ring?: boolean;
  size?: number;
  lifted?: boolean;
  /** Muestra moho aunque no esté en el último estado (daño detectado) */
  mold?: boolean;
  label?: string;
  decorative?: boolean;
}

export function Fruta({ kind, stage = 2, ring = true, size = 160, lifted = false, mold, label, decorative }: FrutaProps) {
  const gid = "fr" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const st = Math.max(0, Math.min(3, Math.round(stage))) as Stage;
  const c = (PAL[kind] ?? PAL.banano)[st];
  const d = (k: Kind) => (kind === k ? "inline" : "none");
  const spotA = st >= 2 ? 1 : st === 1 ? 0.3 : 0;
  const spotB = st >= 3 ? 1 : st === 2 ? 0.75 : 0;
  const patch = [0, 0.75, 0.3, 0][st];
  const blush = [0.3, 0.55, 0.45, 0.2][st];
  const seedOp = st >= 2 ? 0.65 : 1;
  const moldOp = mold ?? st === 3 ? 1 : 0;
  const wrinkle = [0, 0.25, 0.6, 0.85][st];
  const split = st === 3 ? 0.9 : 0;
  const leaf = st >= 3 ? "#7E8A4E" : st === 2 ? "#5E8A3E" : "#4E8A3A";
  const speck = st >= 2 ? "#7A7060" : "#A8C878";
  const aria = label ?? `${FOODS[kind]?.name ?? "Fruta"}, ${STAGE_WORDS[st].toLowerCase()}`;

  return (
    <div style={{ width: size, height: size, position: "relative", flex: "none" }}>
      <svg
        viewBox="0 0 120 120"
        width="100%"
        height="100%"
        {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": aria })}
        style={{ display: "block", overflow: "visible" }}
      >
        <defs>
          <radialGradient id={gid} cx="34%" cy="28%" r="80%">
            <stop offset="0" stopColor={c[0]} />
            <stop offset="0.55" stopColor={c[1]} />
            <stop offset="1" stopColor={c[2]} />
          </radialGradient>
        </defs>
        <g style={{ transform: `scale(${lifted ? 0.78 : 1})`, transformOrigin: "60px 97px", transition: "transform 280ms cubic-bezier(.23,1,.32,1)" }}>
          <ellipse cx="60" cy="97" rx="44" ry="7" fill="#5A3E22" opacity="0.15" />
          <ellipse cx="60" cy="97" rx="28" ry="3.6" fill="#5A3E22" opacity="0.26" />
        </g>
        {ring && (
          <g>
            <ellipse cx="60" cy="99" rx="52" ry="12" fill="none" stroke="#E4D8C3" strokeWidth="3.5" />
            <ellipse
              cx="60" cy="99" rx="52" ry="12" fill="none" stroke={STAGE_COLORS[st]} strokeWidth="3.5" strokeLinecap="round"
              pathLength={100} strokeDasharray={`${FILLS[st]} 100`}
              style={{ transition: "stroke-dasharray 600ms cubic-bezier(.23,1,.32,1), stroke 600ms ease" }}
            />
          </g>
        )}
        <g style={{ transform: `translateY(${lifted ? -12 : 0}px)`, transition: "transform 320ms cubic-bezier(.34,1.56,.64,1)" }}>
          <g display={d("banano")}>
            <g transform="translate(0 6)">
              <path d="M14 66 C 22 92, 80 100, 106 60 C 108 56, 104 52, 100 56 C 84 76, 44 80, 22 60 C 18 56, 12 60, 14 66 Z" fill={`url(#${gid})`} />
              <path d="M20 67 C 40 84, 78 86, 101 62" fill="none" stroke={c[2]} strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
              <path d="M28 64 C 46 74, 70 76, 92 63" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.22" />
              <path d="M99 57 L 107 47 L 112 50 L 105 60 Z" fill="#6B5A2E" />
              <ellipse cx="15" cy="64" rx="3" ry="2.6" fill="#3E2E18" />
              <g fill="#4A2E16" opacity={spotA}><ellipse cx="36" cy="76" rx="2.8" ry="2" /><ellipse cx="52" cy="83" rx="3.2" ry="2.2" /><ellipse cx="68" cy="83" rx="2.6" ry="1.9" /><ellipse cx="84" cy="76" rx="3" ry="2.1" /></g>
              <g fill="#4A2E16" opacity={spotB}><ellipse cx="44" cy="79" rx="2" ry="1.6" /><ellipse cx="60" cy="85" rx="2.2" ry="1.6" /><ellipse cx="76" cy="80" rx="2.4" ry="1.8" /><ellipse cx="91" cy="70" rx="2" ry="1.5" /><ellipse cx="28" cy="70" rx="2" ry="1.6" /><ellipse cx="58" cy="78" rx="1.6" ry="1.3" /></g>
            </g>
          </g>
          <g display={d("papaya")}>
            <g transform="translate(0 -2)">
              <path d="M14 70 C 14 52, 38 44, 64 46 C 92 48, 108 58, 108 74 C 108 90, 88 98, 62 98 C 34 98, 14 88, 14 70 Z" fill={`url(#${gid})`} />
              <ellipse cx="40" cy="62" rx="18" ry="8" fill="#6E9E45" opacity={patch} />
              <ellipse cx="82" cy="58" rx="12" ry="5.5" fill="#6E9E45" opacity={patch} />
              <path d="M30 58 C 46 50, 76 50, 96 60" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.22" />
              <ellipse cx="12" cy="69" rx="4.5" ry="3.5" fill="#5E7A2E" />
              <g fill="#7A3A1A" opacity={spotA}><circle cx="54" cy="84" r="4" /><circle cx="80" cy="87" r="3" /><circle cx="92" cy="72" r="3.4" /></g>
              <g fill="#7A3A1A" opacity={spotB}><circle cx="36" cy="82" r="3" /><circle cx="66" cy="74" r="2.4" /><circle cx="46" cy="70" r="2" /></g>
            </g>
          </g>
          <g display={d("fresa")}>
            <g transform="translate(0 -2)">
              <path d="M60 98 C 40 90, 28 70, 31 54 C 34 42, 47 38, 60 42 C 73 38, 86 42, 89 54 C 92 70, 80 90, 60 98 Z" fill={`url(#${gid})`} />
              <path d="M40 52 C 46 46, 54 46, 58 48" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
              <g fill="#F4D36C" opacity={seedOp}>
                {[[46, 56], [60, 53], [74, 56], [40, 68], [53, 66], [67, 66], [80, 68], [48, 79], [60, 78], [72, 79], [56, 88], [64, 88]].map(([x, y]) => (
                  <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="1.3" ry="1.9" />
                ))}
              </g>
              <g opacity={moldOp}><circle cx="72" cy="70" r="9" fill="#EEEADF" /><circle cx="80" cy="62" r="6" fill="#E6E2D6" /><circle cx="66" cy="80" r="5.5" fill="#F2EFE6" /><circle cx="70" cy="68" r="1.4" fill="#A9A495" /><circle cx="76" cy="73" r="1.2" fill="#A9A495" /><circle cx="81" cy="61" r="1" fill="#A9A495" /><circle cx="65" cy="79" r="1.1" fill="#A9A495" /></g>
              <rect x="58.5" y="24" width="3" height="12" rx="1.5" fill="#4E7A2E" />
              <path d="M60 44 L 46 37 L 55 40 L 50 29 L 60 37 L 70 29 L 65 40 L 74 37 Z" fill={leaf} stroke="#3E6E2C" strokeWidth="1" strokeLinejoin="round" />
            </g>
          </g>
          <g display={d("mango")}>
            <g transform="translate(0 -1)">
              <path d="M22 70 C 20 48, 44 36, 70 40 C 94 44, 106 62, 100 80 C 94 96, 70 100, 50 96 C 32 92, 23 84, 22 70 Z" fill={`url(#${gid})`} />
              <ellipse cx="78" cy="56" rx="19" ry="12" fill="#E0603A" opacity={blush} />
              <path d="M34 58 C 46 46, 66 44, 82 48" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.22" />
              <path d="M24 64 C 20 60, 20 56, 23 53" fill="none" stroke="#5E4A22" strokeWidth="3" strokeLinecap="round" />
              <g fill="#4A2E16" opacity={spotA}><circle cx="44" cy="80" r="3" /><circle cx="62" cy="86" r="2.5" /><circle cx="82" cy="82" r="3" /></g>
              <g fill="#4A2E16" opacity={spotB}><circle cx="36" cy="66" r="2" /><circle cx="56" cy="70" r="2.5" /><circle cx="90" cy="68" r="2" /></g>
            </g>
          </g>
          <g display={d("tomate")}>
            <g transform="translate(0 -2)">
              <path d="M24 72 C 24 52, 42 42, 60 42 C 78 42, 96 52, 96 72 C 96 90, 80 98, 60 98 C 40 98, 24 90, 24 72 Z" fill={`url(#${gid})`} />
              <path d="M40 60 C 44 66, 44 76, 40 84 M80 60 C 76 66, 76 76, 80 84 M60 52 C 57 62, 63 72, 58 86" fill="none" stroke={c[2]} strokeWidth="1.6" strokeLinecap="round" opacity={wrinkle} />
              <path d="M36 58 C 42 50, 52 47, 58 48" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" opacity="0.3" />
              <path d="M66 80 C 70 76, 76 78, 78 84" fill="none" stroke="#4A1E16" strokeWidth="2.4" strokeLinecap="round" opacity={split} />
              <rect x="58.5" y="34" width="3" height="10" rx="1.5" fill="#4E7A2E" />
              <path d="M60 47 L 49 41 L 56 45 L 52 36 L 60 43 L 68 36 L 64 45 L 71 41 Z" fill={leaf} stroke="#3E6E2C" strokeWidth="1" strokeLinejoin="round" />
            </g>
          </g>
          <g display={d("aguacate")}>
            <g transform="translate(0 -2)">
              <path d="M60 26 C 72 26, 77 40, 80 54 C 90 68, 92 82, 84 92 C 76 100, 44 100, 36 92 C 28 82, 30 68, 40 54 C 43 40, 48 26, 60 26 Z" fill={`url(#${gid})`} />
              <g fill={speck} opacity="0.55">
                {[[52, 48], [64, 44], [58, 58], [70, 62], [46, 68], [56, 74], [68, 80], [78, 72], [44, 84], [60, 88], [74, 90], [50, 60]].map(([x, y]) => (
                  <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" />
                ))}
              </g>
              <path d="M50 40 C 46 52, 40 62, 38 74" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" opacity="0.2" />
              <ellipse cx="68" cy="76" rx="9" ry="6.5" fill="#15110C" opacity={moldOp} />
              <rect x="58" y="20" width="4" height="8" rx="2" fill="#5A4A2A" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
