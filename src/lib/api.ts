import type { Kind, Stage } from "../data/foods";

export interface DetectedItem {
  kind: Kind;
  count: number;
  stage: Stage;
  confidence: number;
  alternative: Kind | null;
  damage: "ninguno" | "moho" | "liquido" | "podrido";
  note: string;
}
export interface Analysis {
  items: DetectedItem[];
  others: string[];
  quality: "buena" | "oscura" | "borrosa" | "lejos" | "sin_alimentos";
}

export type ApiError = "offline" | "ai_off" | "busy" | "rate" | "upstream" | "bad_image" | "no_idea";

export class FrescaError extends Error {
  constructor(public code: ApiError) {
    super(code);
  }
}

async function post<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) throw new FrescaError("offline");
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new FrescaError("offline");
  }
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as { error?: ApiError };
    throw new FrescaError(j.error ?? "upstream");
  }
  return (await res.json()) as T;
}

export interface ColorMeta {
  r: number;
  g: number;
  b: number;
  h: number;
  s: number;
  v: number;
  aspectRatio?: number;
  isRound?: boolean;
  greenRatio?: number;
  dominant?: Kind;
  count?: number;
}

export const analyze = (image: string, meta?: ColorMeta, signal?: AbortSignal) =>
  post<Analysis>("/api/analyze", { image, mediaType: "image/jpeg", meta }, signal);

export interface IdeaResponse {
  name: string;
  minutes: number;
  difficulty: number;
  serves: string;
  tags: ("dulce" | "salado" | "rapido")[];
  dish: "glass" | "loaf" | "pop" | "jar" | "pan" | "bowl";
  color: string;
  ingredients: { kind: Kind | null; pantry: string | null; qty: number; label: string }[];
  steps: { action: "cortar" | "licuar" | "hervir" | "congelar" | "mezclar" | "hornear" | "guardar" | "servir"; verb: string; detail: string; note: string; timer: number | null }[];
}
export const idea = (body: { have: { kind: Kind; stage: Stage; qty: number }[]; pantry: string[]; avoid: string[] }, signal?: AbortSignal) =>
  post<IdeaResponse>("/api/idea", body, signal);

export function extractColorMeta(canvas: HTMLCanvasElement): ColorMeta {
  const cw = canvas.width;
  const ch = canvas.height;
  // Región de enfoque: el visor central donde la persona enfoca el alimento
  const rx = Math.round(cw * 0.18);
  const ry = Math.round(ch * 0.20);
  const rw = Math.round(cw * 0.64);
  const rh = Math.round(ch * 0.55);

  const thumb = document.createElement("canvas");
  thumb.width = 64;
  thumb.height = 64;
  const ctx = thumb.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { r: 128, g: 128, b: 128, h: 65, s: 50, v: 50, isRound: true, aspectRatio: 1.0, dominant: "limon", count: 1 };

  ctx.drawImage(canvas, rx, ry, rw, rh, 0, 0, 64, 64);
  const imgData = ctx.getImageData(0, 0, 64, 64).data;

  // Analizar píxeles vivos del alimento, descartando mesas y fondos neutros
  let sumR = 0, sumG = 0, sumB = 0, vibrantCount = 0;
  let minX = 64, maxX = 0, minY = 64, maxY = 0;
  let greenPixels = 0;
  let yellowPixels = 0;
  let orangePixels = 0;
  let redPixels = 0;
  let darkGreenPixels = 0;

  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const idx = (y * 64 + x) * 4;
      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const d = max - min;
      const s = max === 0 ? 0 : (d / max) * 100;
      const v = (max / 255) * 100;

      // Filtrar superficies opacas o desaturadas (madera neutra, baldosas, platos)
      if (s >= 18 && v >= 16 && max > 35) {
        let h = 0;
        if (d !== 0) {
          if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
          else if (max === g) h = ((b - r) / d + 2) * 60;
          else h = ((r - g) / d + 4) * 60;
        }

        sumR += r;
        sumG += g;
        sumB += b;
        vibrantCount++;

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);

        if (h >= 62 && h <= 125) greenPixels++;
        else if (h >= 45 && h < 62) yellowPixels++;
        else if (h >= 22 && h < 45) orangePixels++;
        else if (h < 22 || h > 340) redPixels++;
        else if (h > 125 && h <= 170) darkGreenPixels++;
      }
    }
  }

  if (vibrantCount < 40) {
    for (let i = 0; i < imgData.length; i += 4) {
      sumR += imgData[i];
      sumG += imgData[i + 1];
      sumB += imgData[i + 2];
      vibrantCount++;
    }
    minX = 10; maxX = 54; minY = 10; maxY = 54;
  }

  const avgR = Math.round(sumR / (vibrantCount || 1));
  const avgG = Math.round(sumG / (vibrantCount || 1));
  const avgB = Math.round(sumB / (vibrantCount || 1));

  const max = Math.max(avgR, avgG, avgB);
  const min = Math.min(avgR, avgG, avgB);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : Math.round((d / max) * 100);
  const v = Math.round((max / 255) * 100);
  if (d !== 0) {
    if (max === avgR) h = ((avgG - avgB) / d + (avgG < avgB ? 6 : 0)) * 60;
    else if (max === avgG) h = ((avgB - avgR) / d + 2) * 60;
    else h = ((avgR - avgG) / d + 4) * 60;
  }
  const avgH = Math.round(h);

  const blobW = Math.max(1, maxX - minX);
  const blobH = Math.max(1, maxY - minY);
  const aspectRatio = Number((Math.max(blobW, blobH) / Math.min(blobW, blobH)).toFixed(2));
  const isRound = aspectRatio <= 1.48;
  const greenRatio = Number((greenPixels / (vibrantCount || 1)).toFixed(2));

  // Clasificación precisa
  let dominant: Kind = "limon";
  let count = 1;

  if (greenRatio > 0.15 || (avgH >= 50 && avgH <= 115)) {
    // Cítrico / Limón (verde Tahití o amarillo limón)
    dominant = "limon";
    count = yellowPixels + greenPixels > 600 ? 2 : 1;
  } else if ((yellowPixels > orangePixels && yellowPixels > redPixels) || (avgH >= 40 && avgH < 50)) {
    // Si es redondo es limón amarillo / criollo; si es alargado es banano
    if (isRound && aspectRatio < 1.45) {
      dominant = "limon";
      count = yellowPixels > 500 ? 2 : 1;
    } else {
      dominant = "banano";
      count = 2;
    }
  } else if (redPixels > yellowPixels && redPixels > orangePixels) {
    dominant = s > 65 && v < 65 ? "fresa" : "tomate";
    count = dominant === "fresa" ? 4 : 2;
  } else if (darkGreenPixels > 100 || (avgH >= 115 && avgH <= 170)) {
    dominant = "aguacate";
    count = 1;
  } else if (orangePixels > yellowPixels) {
    dominant = v > 68 ? "mango" : "papaya";
    count = 1;
  }

  return {
    r: avgR,
    g: avgG,
    b: avgB,
    h: avgH,
    s,
    v,
    aspectRatio,
    isRound,
    greenRatio,
    dominant,
    count,
  };
}

/** Redimensiona a máx. 1280 px y JPEG 0,82 extrayendo metadatos de color */
export async function toJpegWithMeta(
  src: CanvasImageSource & { width?: number; height?: number },
  w: number,
  h: number,
  max = 1280
): Promise<{ image: string; meta: ColorMeta }> {
  const scale = Math.min(1, max / Math.max(w, h));
  const cw = Math.round(w * scale);
  const ch = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new FrescaError("bad_image");
  ctx.drawImage(src, 0, 0, cw, ch);
  const meta = extractColorMeta(canvas);
  const image = canvas.toDataURL("image/jpeg", 0.82).split(",")[1];
  return { image, meta };
}

export async function toJpegBase64(src: CanvasImageSource & { width?: number; height?: number }, w: number, h: number, max = 1280): Promise<string> {
  const res = await toJpegWithMeta(src, w, h, max);
  return res.image;
}

export async function fileToJpegWithMeta(file: File): Promise<{ image: string; meta: ColorMeta }> {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (bmp) return toJpegWithMeta(bmp, bmp.width, bmp.height);
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return toJpegWithMeta(img, img.naturalWidth, img.naturalHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function fileToJpegBase64(file: File): Promise<string> {
  const res = await fileToJpegWithMeta(file);
  return res.image;
}

/** Brillo medio de la imagen (0-255), para aconsejar más luz antes de gastar una consulta */
export function brightness(video: HTMLVideoElement): number {
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 128;
  ctx.drawImage(video, 0, 0, 32, 32);
  const d = ctx.getImageData(0, 0, 32, 32).data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  return sum / (d.length / 4);
}

/* ── Reseñas de la comunidad y del usuario ─────────────────── */

export interface Review {
  id: string;
  userId?: string;
  userName: string;
  rating: number; // 1 a 5
  comment: string;
  tags?: string[];
  createdAt: number;
}

export interface ReviewStats {
  total: number;
  average: number;
  distribution: Record<number, number>;
}

export interface ReviewsResponse {
  ok: boolean;
  reviews: Review[];
  stats: ReviewStats;
}

export async function fetchReviews(): Promise<ReviewsResponse> {
  const res = await fetch("/api/reviews");
  if (!res.ok) {
    throw new Error("No se pudieron cargar las reseñas");
  }
  return res.json();
}

export async function submitReview(review: {
  rating: number;
  comment?: string;
  tags?: string[];
  userName?: string;
  userId?: string;
}): Promise<{ ok: boolean; review: Review; stats: ReviewStats }> {
  const res = await fetch("/api/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(review),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message || "Error al enviar la reseña");
  }
  return res.json();
}

