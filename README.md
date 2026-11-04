# FRESCA

*Feo por fuera, rico por dentro.* Una app (PWA, para celular) que ayuda a no botar fruta y verdura: le tomas una foto a lo que tienes, te dice qué tan maduro está y qué hacer con ello hoy, paso a paso.

Implementa el diseño "FRESCA · Prototipo completo" (sistema visual *arcilla de mercado*) con funcionalidad real.

## Qué hace cada pantalla

| Pantalla | Funcionalidad |
|---|---|
| **Entrada** | Splash, bienvenida con deslizamiento, acceso por SMS o Google (Supabase, opcional), "Seguir sin cuenta", personas en casa, nombre y hora del aviso. |
| **Hoy** | Plato con los 4 alimentos más urgentes según su madurez estimada, idea del día, pregunta "¿Cómo está tu…?" que corrige la estimación, kg rescatados en la semana, avisos sin leer. |
| **Escanear** | Cámara trasera real (`getUserMedia`), linterna, foto desde galería, chequeo de luz. La IA (Google Gemini 2.5 Flash u OpenRouter) reconoce banano, papaya, fresa, mango, tomate y aguacate, su madurez y el daño visible. |
| **Resultado / Daño / No reconocida** | Confirmación cuando hay duda (¿papaya o mango?), escalera del rescate, "A la compostera" (queda registrado), agregar a la canasta, consejos de luz o distancia. |
| **Ficha** | Madurez ajustable (se guarda), ideas según el punto, señales de descarte, cómo guardarlo, nutrición orientativa, recetas. |
| **Mi canasta** | Canasto ilustrado ordenado por urgencia y lista con "Lo usé" / "Lo boté" + motivo. |
| **Voy a mercar** | Lo que ya tienes, consejos de compra calculados con lo que se te ha botado, agregar el mercado a mano o escaneando. |
| **Recetas** | Filtros por alimento y tipo, vitrina validada, "Créala con lo mío" (la IA crea una receta con lo que está por pasarse, marcada "aún sin validar"). |
| **Receta** | Ingredientes contra canasta y despensa, modo cocina con temporizador real y pantalla encendida (Wake Lock), "¿Lo hiciste?" descuenta de la canasta y celebra. |
| **Tu huerta** | Niveles Semilla → Cosecha por kg rescatados, pesos ahorrados, CO₂ evitado, gráfica semanal, fruta estrella y la que más se escapa. |
| **Avisos** | Generados de la canasta y del historial; notificación diaria del celular a la hora elegida. |
| **Perfil** | Personas, hora, avisos, un solo aviso al día, menos movimiento, letra más grande, descargar o borrar datos, cerrar sesión y acceso a reseñas. |
| **Reseñas y valoraciones** | Calificación interactiva con estrellas (1 a 5), etiquetas de lo que más gustó, comentarios de texto, promedio de satisfacción comunitario y persistencia en la base de datos. |
| **Sin conexión / Cargando** | Service worker: la app y la canasta funcionan sin internet. |

## Arquitectura

- `src/`: React 19 + TypeScript + Vite. Sin librería de UI: el diseño se portó tal cual (tokens y hoja de movimiento en `src/styles.css`, el modelo `Fruta` en `src/ui/Fruta.tsx`).
- `src/state/store.ts`: estado local-first en `localStorage` (canasta, historial, ajustes). `src/lib/domain.ts`: lógica pura (madurez por días, estadísticas, niveles, avisos), con tests.
- `server/`: API con Hono, `/api/analyze` (visión), `/api/idea` (receta) y `/api/reviews` (reseñas y valoraciones con estrellas), usando modelos gratuitos de IA (Google AI Studio Gemini o OpenRouter) y almacenamiento en Cloudflare KV / Supabase. En producción también sirve `dist/`.
- `public/sw.js`: caché de la app, aviso diario con Periodic Background Sync donde existe; tocar la notificación abre la idea.
- `supabase/migrations/`: esquema SQL para estado en la nube (`0001_fresca_state.sql`) y tabla de reseñas con políticas RLS e índices (`0002_reviews.sql`).

## Correr

```bash
npm install
```

```bash
cp .env.example .env
```

Pon `GEMINI_API_KEY` (gratuita en [Google AI Studio](https://aistudio.google.com/app/apikey)) o `OPENROUTER_API_KEY` en `.env` para el reconocimiento y las ideas. Luego:

```bash
npm run dev
```

Web en `:5173`, API en `:8787`. Producción en Node: `npm run build` y después `npm start` (un solo proceso en `PORT`).

### Despliegue en Cloudflare (Workers con Static Assets)

El proyecto está configurado para desplegarse como un **Cloudflare Worker full-stack con Static Assets** (`wrangler.json`): sirve la PWA compilada (`dist/`) desde el CDN global y enruta `/api/*` directamente a la API Hono:

1. **Variables de entorno en Cloudflare**:
   En el panel de Cloudflare (o con `npx wrangler secret put`):
   - `GEMINI_API_KEY`: Tu clave gratuita de Google AI Studio (o `OPENROUTER_API_KEY`).
   - `FRESCA_MODEL`: (Opcional, por defecto `gemini-2.5-flash`).
2. **Deploy manual o CI**:
   ```bash
   npm run build
   npx wrangler deploy
   ```
   En Cloudflare Dashboard (conectado a Git):
   - **Build command**: `npm run build`
   - **Deploy command**: `npx wrangler deploy`

Sin `GEMINI_API_KEY` ni `OPENROUTER_API_KEY` la app funciona completa salvo el reconocimiento por foto y las ideas nuevas: muestra "no está activo aquí" y ofrece elegir a mano.

### Persistencia y Sincronización en Cloudflare
El registro de usuarios y el estado completo (canasta, huerta, recetas, avisos y ajustes) se sincronizan directamente con Cloudflare mediante `/api/auth/*` y `/api/state/*` con soporte de Cloudflare KV (`FRESCA_KV`) y respaldo local en navegador.

### Soporte Multi-dispositivo (Móvil y Escritorio)
FRESCA es totalmente responsiva: en dispositivos móviles se comporta como una PWA nativa con barra inferior y gestos táctiles; en computadores y tablets de escritorio (>= 860px) se expande como un dashboard completo con navegación lateral (sidebar), vitrina de recetas en cuadrícula amplia y visualización de huerta expandida.

Tests: `npm test`. Tipos: `npm run typecheck`.

## Límites conocidos

- La madurez se **estima** por días según cada alimento (`src/data/foods.ts`); la foto y la persona la corrigen.
- Las notificaciones con la app cerrada dependen del navegador (Periodic Background Sync en Chrome/Android con la app instalada). Con la app abierta se revisa cada minuto.
- El código SMS de Supabase es de 6 números (el diseño mostraba 4).
- Precios en COP, CO₂ y nutrición son orientativos.
