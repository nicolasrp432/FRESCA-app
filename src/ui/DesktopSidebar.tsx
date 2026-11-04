import { C } from "./Common";
import { IconBasket, IconBell, IconScan, IconStar } from "./Icons";
import { useStore } from "../state/store";

interface DesktopSidebarProps {
  currentPath: string;
}

export function DesktopSidebar({ currentPath }: DesktopSidebarProps) {
  const profile = useStore((s) => s.profile);
  const items = useStore((s) => s.items);
  const openCount = items.filter((i) => i.status === "open").length;

  const clean = currentPath.split("?")[0] || "/hoy";

  const navItems = [
    {
      to: "/hoy",
      label: "Hoy · Plato del día",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17 A 5 5 0 0 1 17 17 Z" />
          <path d="M3 17 L 21 17 M12 5 L 12 8 M5.5 9.5 L 7 11 M18.5 9.5 L 17 11" />
        </svg>
      ),
    },
    {
      to: "/canasta",
      label: "Mi canasta",
      badge: openCount > 0 ? `${openCount}` : undefined,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10 L 20 10 L 18.4 18.4 A 2 2 0 0 1 16.4 20 L 7.6 20 A 2 2 0 0 1 5.6 18.4 Z" />
          <path d="M8 10 L 11 4 M16 10 L 13 4" />
        </svg>
      ),
    },
    {
      to: "/recetas",
      label: "Recetas de rescate",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12 L 20 12 A 8 8 0 0 1 4 12 Z" />
          <path d="M9 8.5 C 9 6.8, 10.5 6.6, 10.5 5 M14 8.5 C 14 6.8, 15.5 6.6, 15.5 5" />
        </svg>
      ),
    },
    {
      to: "/huerta",
      label: "Tu huerta e impacto",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21 L 12 12" />
          <path d="M12 12 C 12 8, 9 6, 5 6 C 5 10, 8 12, 12 12 Z" />
          <path d="M12 10 C 12 7, 15 5, 19 5 C 19 8, 16 10, 12 10 Z" />
        </svg>
      ),
    },
    {
      to: "/mercar",
      label: "Voy a mercar",
      icon: <IconBasket size={22} strokeWidth={2} />,
    },
    {
      to: "/avisos",
      label: "Avisos diarios",
      icon: <IconBell size={22} strokeWidth={2} />,
    },
    {
      to: "/perfil",
      label: "Perfil y ajustes",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M6 20 C 6 16, 10 14, 12 14 C 14 14, 18 16, 18 20" />
        </svg>
      ),
    },
    {
      to: "/resenas",
      label: "Reseñas y valoraciones",
      icon: <IconStar size={22} filled={clean === "/resenas"} color="#E9B530" />,
    },
  ];

  return (
    <aside className="desktop-sidebar" aria-label="Menú principal de escritorio">
      {/* Brand Header con logotipo 3D */}
      <a href="#/hoy" style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0 20px", textDecoration: "none" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: "linear-gradient(135deg, #FFE89A 0%, #F3B23C 100%)",
            boxShadow: "0 6px 14px rgba(243,178,60,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <img src="/images/3d/mango.png" alt="" style={{ width: 38, height: 38, objectFit: "contain" }} />
        </div>
        <div>
          <span className="bric" style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.04em", color: C.tinta, display: "block", lineHeight: 1.1 }}>
            FRESCA
          </span>
          <span style={{ fontSize: 12, color: C.suave, fontWeight: 600 }}>Feo por fuera, rico por dentro</span>
        </div>
      </a>

      {/* Cloudflare Edge Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 12,
          background: "rgba(47,107,58,0.08)",
          marginBottom: 16,
          fontSize: 12,
          color: C.hoja,
          fontWeight: 700,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2F6B3A", boxShadow: "0 0 0 3px rgba(47,107,58,0.25)" }} />
        Cloudflare Edge Sync activo
      </div>

      {/* Botón Destacado de Escanear */}
      <a
        href="#/escanear"
        className="press"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          height: 48,
          borderRadius: 24,
          background: "linear-gradient(135deg, #F28C5B 0%, #E26938 100%)",
          color: "#FFFFFF",
          fontSize: 15,
          fontWeight: 700,
          boxShadow: "0 8px 18px rgba(242,140,91,0.35)",
          marginBottom: 20,
          textDecoration: "none",
        }}
      >
        <IconScan size={20} strokeWidth={2.4} />
        Escanear alimento
      </a>

      {/* Navegación Principal */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = clean === item.to;
          return (
            <a
              key={item.to}
              href={`#${item.to}`}
              className="press"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 14,
                fontSize: 14,
                fontWeight: isActive ? 800 : 600,
                color: isActive ? C.hoja : C.media,
                background: isActive ? "#FFFFFF" : "transparent",
                boxShadow: isActive ? "0 4px 12px rgba(110,74,30,0.08)" : "none",
                transition: "all 150ms ease",
                textDecoration: "none",
              }}
            >
              <span style={{ color: isActive ? C.hoja : C.suave }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    background: C.papaya,
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "2px 7px",
                    borderRadius: 10,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* Perfil inferior en sidebar */}
      <div
        style={{
          borderTop: `1px solid ${C.bandeja}`,
          paddingTop: 16,
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt="Perfil"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              objectFit: "cover",
              boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
            }}
          />
        ) : (
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: C.plato,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 15,
              color: C.tinta,
            }}
          >
            {profile.name ? profile.name.charAt(0).toUpperCase() : "F"}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.tinta, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {profile.name || "Mi hogar"}
          </div>
          <div style={{ fontSize: 12, color: C.suave }}>
            {profile.people} {profile.people === 1 ? "persona" : "personas"}
          </div>
        </div>
      </div>
    </aside>
  );
}
