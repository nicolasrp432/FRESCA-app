import { lazy, Suspense, useEffect } from "react";
import { match, navigate, usePath } from "./lib/router";
import { useStore } from "./state/store";
import { Cargando } from "./screens/Cargando";
import Offline from "./screens/Offline";

const Inicio = lazy(() => import("./screens/Inicio"));
const Hoy = lazy(() => import("./screens/Hoy"));
const Escanear = lazy(() => import("./screens/Escanear"));
const Ficha = lazy(() => import("./screens/Ficha"));
const Canasta = lazy(() => import("./screens/Canasta"));
const Mercar = lazy(() => import("./screens/Mercar"));
const Huerta = lazy(() => import("./screens/Huerta"));
const Recetas = lazy(() => import("./screens/Recetas"));
const Receta = lazy(() => import("./screens/Receta"));
const Avisos = lazy(() => import("./screens/Avisos"));
const Perfil = lazy(() => import("./screens/Perfil"));

const PUBLIC = ["/inicio", "/entrar/google"];

function Route({ path }: { path: string }) {
  const clean = path.split("?")[0];
  let m: Record<string, string> | null;
  if (clean === "/inicio" || clean === "/entrar/google") return <Inicio />;
  if (clean === "/hoy") return <Hoy />;
  if (clean === "/escanear") return <Escanear key={path} />;
  if ((m = match("/ficha/:kind", clean))) return <Ficha key={m.kind} kind={m.kind} />;
  if (clean === "/canasta") return <Canasta />;
  if (clean === "/mercar") return <Mercar />;
  if (clean === "/huerta") return <Huerta />;
  if (clean === "/recetas") return <Recetas />;
  if ((m = match("/receta/:id", clean))) return <Receta key={m.id} id={m.id} />;
  if (clean === "/avisos") return <Avisos />;
  if (clean === "/perfil") return <Perfil />;
  if (clean === "/offline") return <Offline />;
  return <Hoy />;
}

/* Precarga las pantallas en segundo plano: el service worker las guarda y la app abre sin internet */
const SCREENS = [
  () => import("./screens/Inicio"), () => import("./screens/Hoy"), () => import("./screens/Escanear"), () => import("./screens/Ficha"),
  () => import("./screens/Canasta"), () => import("./screens/Mercar"), () => import("./screens/Huerta"), () => import("./screens/Recetas"),
  () => import("./screens/Receta"), () => import("./screens/Avisos"), () => import("./screens/Perfil"),
];
function warm() {
  const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
  idle(() => SCREENS.forEach((load) => load().catch(() => undefined)));
}

export function App() {
  const path = usePath();
  const onboarded = useStore((s) => s.profile.onboarded);
  const flags = useStore((s) => s.profile.flags);
  useEffect(warm, []);

  useEffect(() => {
    const clean = path.split("?")[0];
    if (clean === "/" || clean === "") navigate(onboarded ? "/hoy" : "/inicio", true);
    else if (!onboarded && !PUBLIC.includes(clean)) navigate("/inicio", true);
  }, [path, onboarded]);

  return (
    <div className={`phone${flags.rm ? " rm" : ""}${flags.big ? " big" : ""}`}>
      <Suspense fallback={<Cargando />}>
        <Route path={path} />
      </Suspense>
    </div>
  );
}
