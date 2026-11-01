import { useEffect, useState } from "react";

export function useOnline() {
  const [on, setOn] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => {
    const up = () => setOn(true);
    const down = () => setOn(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return on;
}

/** Mantiene la pantalla encendida en modo cocina (si el navegador lo permite) */
export function useWakeLock(active: boolean) {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const req = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
        if (cancelled) lock.release();
        else {
          setHeld(true);
          lock.addEventListener("release", () => setHeld(false));
        }
      } catch {
        setHeld(false);
      }
    };
    req();
    const onVis = () => document.visibilityState === "visible" && req();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => undefined);
    };
  }, [active]);
  return held;
}

export function vibrate(ms: number | number[]) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* sin vibración */
  }
}

export function useAiAvailable() {
  const [ai, setAi] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/health")
      .then((r) => r.json())
      .then((j: { ai?: boolean }) => alive && setAi(Boolean(j.ai)))
      .catch(() => alive && setAi(false));
    return () => {
      alive = false;
    };
  }, []);
  return ai;
}

export function downloadJson(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
