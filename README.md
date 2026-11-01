# FRESCA

*Feo por fuera, rico por dentro.* Una app (PWA, para celular) que ayuda a no botar fruta y verdura: le tomas una foto a lo que tienes, te dice qué tan maduro está y qué hacer con ello hoy, paso a paso.

Implementa el diseño "FRESCA · Prototipo completo" (sistema visual *arcilla de mercado*) con funcionalidad real.

## Qué hace cada pantalla

| Pantalla | Funcionalidad |
|---|---|
| **Entrada** | Splash, bienvenida con deslizamiento, acceso por SMS o Google (Supabase, opcional), "Seguir sin cuenta", personas en casa, nombre y hora del aviso. |
| **Hoy** | Plato con los 4 alimentos más urgentes según su madurez estimada, idea del día, pregunta "¿Cómo está tu…?" que corrige la estimación, kg rescatados en la semana, avisos sin leer. |
| **Escanear** | Cámara trasera real (`getUserMedia`), linterna, foto desde galería, chequeo de luz. Claude reconoce banano, papaya, fresa, mango, tomate y aguacate, su madurez y el daño visible. |
| **Resultado / Daño / No reconocida** | Confirmación cuando hay duda (¿papaya o mango?), escalera del rescate, "A la compostera" (queda registrado), agregar a la canasta, consejos de luz o distancia. |
| **Ficha** | Madurez ajustable (se guarda), ideas según el punto, señales de descarte, cómo guardarlo, nutrición orientativa, recetas. |
| **Mi canasta** | Canasto ilustrado ordenado por urgencia y lista con "Lo usé" / "Lo boté" + motivo. |
| **Voy a mercar** | Lo que ya tienes, consejos de compra calculados con lo que se te ha botado, agregar el mercado a mano o escaneando. |
| **Recetas** | Filtros por alimento y tipo, vitrina validada, "Créala con lo mío" (Claude crea una receta con lo que está por pasarse, marcada "aún sin validar"). |
| **Receta** | Ingredientes contra canasta y despensa, modo cocina con temporizador real y pantalla encendida (Wake Lock), "¿Lo hiciste?" descuenta de la canasta y celebra. |
| **Tu huerta** | Niveles Semilla → Cosecha por kg rescatados, pesos ahorrados, CO₂ evitado, gráfica semanal, fruta estrella y la que más se escapa. |
| **Avisos** | Generados de la canasta y del historial; notificación diaria del celular a la hora elegida. |
| **Perfil** | Personas, hora, avisos, un solo aviso al día, menos movimiento, letra más grande, descargar o borrar datos, cerrar sesión. |
| **Sin conexión / Cargando** | Service worker: la app y la canasta funcionan sin internet. |

## Arquitectura

- `src/`: React 19 + TypeScript + Vite. Sin librería de UI: el diseño se portó tal cual (tokens y hoja de movimiento en `src/styles.css`, el modelo `Fruta` en `src/ui/Fruta.tsx`).
- `src/state/store.ts`: estado local-first en `localStorage` (canasta, historial, ajustes). `src/lib/domain.ts`: lógica pura (madurez por días, estadísticas, niveles, avisos), con tests.
- `server/`: API mínima con Hono, `/api/analyze` (visión) y `/api/idea` (receta), con el SDK oficial de Anthropic y salidas estructuradas (Zod). La clave nunca llega al navegador. En producción también sirve `dist/`.
- `public/sw.js`: caché de la app, aviso diario con Periodic Background Sync donde existe; tocar la notificación abre la idea.
- `supabase/migrations/`: tabla opcional para cuentas y copia en la nube (RLS: cada persona solo ve lo suyo).

## Correr

```bash
npm install
```

```bash
cp .env.example .env
```

Pon `ANTHROPIC_API_KEY` en `.env` para el reconocimiento y las ideas. Luego:

```bash
npm run dev
```

Web en `:5173`, API en `:8787`. Producción: `npm run build` y después `npm start` (un solo proceso en `PORT`).

Sin `ANTHROPIC_API_KEY` la app funciona completa salvo el reconocimiento por foto y las ideas nuevas: muestra "no está activo aquí" y ofrece elegir a mano. Sin `VITE_SUPABASE_*` todo se guarda en el celular y "Seguir sin cuenta" es el camino.

Tests: `npm test`. Tipos: `npm run typecheck`.

## Límites conocidos

- La madurez se **estima** por días según cada alimento (`src/data/foods.ts`); la foto y la persona la corrigen.
- Las notificaciones con la app cerrada dependen del navegador (Periodic Background Sync en Chrome/Android con la app instalada). Con la app abierta se revisa cada minuto.
- El código SMS de Supabase es de 6 números (el diseño mostraba 4).
- Precios en COP, CO₂ y nutrición son orientativos.
