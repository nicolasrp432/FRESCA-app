import type { Kind, Stage } from "../data/foods";
import { FOODS, STAGE_COLORS, STAGE_WORDS } from "../data/foods";

const FILLS = [25, 50, 75, 100];

export interface FrutaProps {
  kind: Kind;
  stage?: Stage;
  ring?: boolean;
  size?: number;
  lifted?: boolean;
  mold?: boolean;
  label?: string;
  decorative?: boolean;
  className?: string;
}

export function Fruta({
  kind,
  stage = 2,
  ring = true,
  size = 160,
  lifted = false,
  mold,
  label,
  decorative,
  className = "",
}: FrutaProps) {
  const st = Math.max(0, Math.min(3, Math.round(stage))) as Stage;
  const aria = label ?? `${FOODS[kind]?.name ?? "Fruta"}, ${STAGE_WORDS[st].toLowerCase()}`;
  const isMoldy = mold ?? st === 3;

  // Filtros sutiles para representar la etapa de madurez en 3D
  const stageFilters = [
    "hue-rotate(-8deg) saturate(0.95)",
    "none",
    "saturate(1.1) brightness(0.97) contrast(1.05)",
    "brightness(0.85) contrast(1.1) sepia(0.2)",
  ][st];

  const fruitSrc = `/images/3d/${kind}.png`;

  return (
    <div
      className={`fruta-3d-wrap ${className}`}
      style={{
        width: size,
        height: size,
        position: "relative",
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
      }}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": aria })}
    >
      {/* Sombra de contacto 3D */}
      <div
        style={{
          position: "absolute",
          bottom: size * 0.08,
          left: "50%",
          transform: `translateX(-50%) scale(${lifted ? 0.75 : 1})`,
          width: size * 0.65,
          height: size * 0.12,
          borderRadius: "50%",
          background: "radial-gradient(ellipse at center, rgba(70,45,20,0.28) 0%, rgba(70,45,20,0.08) 50%, transparent 70%)",
          transition: "transform 280ms cubic-bezier(.23,1,.32,1)",
          pointerEvents: "none",
        }}
      />

      {/* Anillo de progreso de madurez */}
      {ring && (
        <svg
          viewBox="0 0 120 120"
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
        >
          <ellipse cx="60" cy="99" rx="52" ry="12" fill="none" stroke="#E4D8C3" strokeWidth="3.5" />
          <ellipse
            cx="60"
            cy="99"
            rx="52"
            ry="12"
            fill="none"
            stroke={STAGE_COLORS[st]}
            strokeWidth="3.5"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${FILLS[st]} 100`}
            style={{ transition: "stroke-dasharray 600ms cubic-bezier(.23,1,.32,1), stroke 600ms ease" }}
          />
        </svg>
      )}

      {/* Imagen 3D renderizada con elevación interactiva */}
      <div
        style={{
          width: "82%",
          height: "82%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateY(${lifted ? -12 : 0}px)`,
          transition: "transform 320ms cubic-bezier(.34,1.56,.64,1)",
        }}
      >
        <img
          src={fruitSrc}
          alt=""
          loading="eager"
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: `drop-shadow(0 8px 18px rgba(50,30,10,0.14)) ${stageFilters}`,
            transition: "filter 300ms ease",
          }}
        />

        {/* Insignia 3D si tiene moho o daño crítico */}
        {isMoldy && !decorative && (
          <div
            title="Revisar: daño detectado"
            style={{
              position: "absolute",
              top: "10%",
              right: "10%",
              background: "#A8331F",
              color: "#FFFFFF",
              fontSize: Math.max(10, size * 0.12),
              fontWeight: 800,
              padding: "2px 6px",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(168,51,31,0.4)",
              letterSpacing: "-0.02em",
            }}
          >
            !
          </div>
        )}
      </div>
    </div>
  );
}
