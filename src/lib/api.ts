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

export const analyze = (image: string, signal?: AbortSignal) => post<Analysis>("/api/analyze", { image, mediaType: "image/jpeg" }, signal);

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

/** Redimensiona a máx. 1280 px y JPEG 0,82: rápido de subir, suficiente para ver pintas y moho */
export async function toJpegBase64(src: CanvasImageSource & { width?: number; height?: number }, w: number, h: number, max = 1280): Promise<string> {
  const scale = Math.min(1, max / Math.max(w, h));
  const cw = Math.round(w * scale);
  const ch = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new FrescaError("bad_image");
  ctx.drawImage(src, 0, 0, cw, ch);
  return canvas.toDataURL("image/jpeg", 0.82).split(",")[1];
}

export async function fileToJpegBase64(file: File): Promise<string> {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (bmp) return toJpegBase64(bmp, bmp.width, bmp.height);
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return toJpegBase64(img, img.naturalWidth, img.naturalHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
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
