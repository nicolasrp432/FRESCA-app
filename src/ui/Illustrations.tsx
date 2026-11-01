import type { CSSProperties } from "react";

export type Dish = "glass" | "loaf" | "pop" | "jar" | "pan" | "bowl";

const DISH_IMAGES: Record<Dish, string> = {
  glass: "/images/3d/smoothie.png",
  loaf: "/images/3d/receta-pan.png",
  pop: "/images/3d/receta-paleta.png",
  jar: "/images/3d/receta-mermelada.png",
  pan: "/images/3d/receta-hogao.png",
  bowl: "/images/3d/receta-guacamole.png",
};

export function getRecipeImage(dish?: Dish, recipeId?: string): string {
  if (recipeId === "guacamole") return "/images/3d/receta-guacamole.png";
  if (recipeId === "avena-banano") return "/images/3d/receta-avena.png";
  if (recipeId === "hogao") return "/images/3d/receta-hogao.png";
  if (recipeId === "mermelada-fresa") return "/images/3d/receta-mermelada.png";
  if (recipeId === "paletas-papaya") return "/images/3d/receta-paleta.png";
  if (recipeId === "pan-banano") return "/images/3d/receta-pan.png";
  if (recipeId === "batido-banano" || recipeId === "jugo-papaya-fresa" || recipeId === "limonada-casera") return "/images/3d/smoothie.png";
  if (dish && DISH_IMAGES[dish]) return DISH_IMAGES[dish];
  return "/images/3d/receta.png";
}

/** Plato de receta en 3D (vitrina / detalle de receta). */
export function DishArt({
  dish,
  recipeId,
  color: _color,
  size = 96,
  style,
}: {
  dish?: Dish;
  recipeId?: string;
  color?: string;
  topping?: string;
  size?: number;
  style?: CSSProperties;
}) {
  const imgSrc = getRecipeImage(dish, recipeId);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flex: "none",
        ...style,
      }}
      aria-hidden="true"
    >
      <img
        src={imgSrc}
        alt=""
        loading="lazy"
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 6px 14px rgba(70,45,20,0.18))",
        }}
      />
    </div>
  );
}

/** Vaso de batido tropical grande en 3D (portada, Hoy, celebración). */
export function Smoothie({
  width = 104,
  height = 128,
  style,
  className,
}: {
  width?: number;
  height?: number;
  color?: string;
  foam?: string;
  straw?: string;
  shine?: boolean;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flex: "none",
        ...style,
      }}
      aria-hidden="true"
    >
      <img
        src="/images/3d/smoothie.png"
        alt=""
        loading="lazy"
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 8px 20px rgba(70,45,20,0.22))",
        }}
      />
    </div>
  );
}

/** Matera pequeña en 3D con brote (encabezado, perfil, avisos). */
export function PotSprout({ size = 38 }: { size?: number; shadow?: boolean }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flex: "none",
      }}
      aria-hidden="true"
    >
      <img
        src="/images/3d/huerta.png"
        alt=""
        loading="lazy"
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 4px 10px rgba(50,30,10,0.16))",
        }}
      />
    </div>
  );
}

/** Matera grande 3D de la huerta, 5 niveles de crecimiento. */
export function PotLevels({
  level,
  label,
  width = 230,
  height = 240,
  style,
}: {
  level: number;
  label: string;
  width?: number;
  height?: number;
  style?: CSSProperties;
}) {
  // Escalado y brillo según el nivel de evolución (0 a 4)
  const scale = 0.75 + level * 0.08;
  const brightness = 0.95 + level * 0.04;

  return (
    <div
      role="img"
      aria-label={label}
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        ...style,
      }}
    >
      <img
        src="/images/3d/huerta.png"
        alt={label}
        loading="eager"
        draggable={false}
        style={{
          width: "92%",
          height: "92%",
          objectFit: "contain",
          transform: `scale(${scale})`,
          transition: "transform 500ms cubic-bezier(.34,1.56,.64,1)",
          filter: `drop-shadow(0 14px 28px rgba(70,45,20,0.24)) brightness(${brightness})`,
        }}
      />
    </div>
  );
}

/** Compostera ecológica en 3D. */
export function Compost({ size = 52 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        flex: "none",
      }}
      aria-hidden="true"
    >
      <img
        src="/images/3d/compost.png"
        alt=""
        loading="lazy"
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 6px 14px rgba(70,45,20,0.2))",
        }}
      />
    </div>
  );
}

/** Icono de conservación 3D. */
export function SaveArt({
  icon,
  size = 56,
}: {
  icon: "congelar" | "mermelada" | "nevera" | "salsa";
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
      aria-hidden="true"
    >
      {icon === "congelar" || icon === "nevera" ? (
        <Fridge />
      ) : (
        <img
          src="/images/3d/smoothie.png"
          alt=""
          loading="lazy"
          style={{ width: "90%", height: "90%", objectFit: "contain" }}
        />
      )}
    </div>
  );
}

export function Mold({ size = 48 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-hidden="true"
    >
      <img
        src="/images/3d/compost.png"
        alt=""
        loading="lazy"
        style={{ width: "95%", height: "95%", objectFit: "contain" }}
      />
    </div>
  );
}

export function Liquid({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M24 8 C 30 18, 35 24, 35 30 A 11 11 0 0 1 13 30 C 13 24, 18 18, 24 8 Z"
        fill="#B9A27A"
      />
      <path
        d="M18 30 A 6 6 0 0 0 23 36"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.5"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Sour({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="#1F2A1E"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 10 C 18 18, 12 24, 12 30 C 12 34, 16 35, 19 33" />
      <path d="M26 22 C 30 20, 34 22, 36 20 M26 28 C 30 26, 34 28, 37 26 M26 34 C 30 32, 34 34, 36 32" />
    </svg>
  );
}

/** Frutero / Canasta 3D con frutas. */
export function FruitBowl() {
  return (
    <div
      style={{
        width: 72,
        height: 60,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-hidden="true"
    >
      <img
        src="/images/3d/canasta.png"
        alt=""
        loading="lazy"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 4px 10px rgba(70,45,20,0.18))",
        }}
      />
    </div>
  );
}

export function Fridge() {
  return (
    <svg width="72" height="60" viewBox="0 0 90 70" aria-hidden="true">
      <ellipse cx="45" cy="64" rx="26" ry="4" fill="#5A3E22" opacity="0.18" />
      <rect x="24" y="4" width="42" height="58" rx="8" fill="#EAF2F4" stroke="#B9CDD3" strokeWidth="2" />
      <path d="M24 26 L 66 26" stroke="#B9CDD3" strokeWidth="2" />
      <path d="M30 12 L 30 20 M30 32 L 30 44" stroke="#2F6B3A" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function MilkMug({ size = 72 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-hidden="true"
    >
      <img
        src="/images/3d/smoothie.png"
        alt=""
        loading="lazy"
        style={{ width: "90%", height: "90%", objectFit: "contain" }}
      />
    </div>
  );
}

export function PantryJar({
  color = "#C79A62",
  size = 58,
  faded,
}: {
  color?: string;
  size?: number;
  faded?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      aria-hidden="true"
      style={{ opacity: faded ? 0.75 : 1 }}
    >
      <ellipse cx="40" cy="72" rx="20" ry="4" fill="#5A3E22" opacity="0.18" />
      <rect x="26" y="12" width="28" height="10" rx="3" fill="#2F6B3A" />
      <rect x="20" y="20" width="40" height="50" rx="11" fill="#FFFFFF" fillOpacity="0.75" stroke="#D8CBB4" strokeWidth="2" />
      <rect x="23" y="34" width="34" height="33" rx="9" fill={color} />
    </svg>
  );
}

export function Cinnamon({ size = 58 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      aria-hidden="true"
      style={{ opacity: 0.75 }}
    >
      <rect x="12" y="30" width="56" height="10" rx="5" fill="#9A5A2E" transform="rotate(-14 40 35)" />
      <rect x="14" y="44" width="54" height="10" rx="5" fill="#8A4E26" transform="rotate(-14 40 49)" />
    </svg>
  );
}

export function FruitPile() {
  return (
    <div
      style={{
        width: 64,
        height: 56,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-hidden="true"
    >
      <img
        src="/images/3d/mango.png"
        alt=""
        loading="lazy"
        style={{
          width: "90%",
          height: "90%",
          objectFit: "contain",
          filter: "drop-shadow(0 4px 8px rgba(70,45,20,0.18))",
        }}
      />
    </div>
  );
}

export function Coins() {
  return (
    <div
      style={{
        width: 64,
        height: 56,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-hidden="true"
    >
      <img
        src="/images/3d/monedas.png"
        alt=""
        loading="lazy"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 4px 10px rgba(185,149,46,0.25))",
        }}
      />
    </div>
  );
}

export function Cloud() {
  return (
    <div
      style={{
        width: 64,
        height: 56,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-hidden="true"
    >
      <img
        src="/images/3d/huerta.png"
        alt=""
        loading="lazy"
        style={{
          width: "80%",
          height: "80%",
          objectFit: "contain",
          filter: "drop-shadow(0 4px 8px rgba(47,107,58,0.2))",
        }}
      />
    </div>
  );
}
