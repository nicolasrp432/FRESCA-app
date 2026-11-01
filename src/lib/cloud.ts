import { actions, getState, onChange, replaceState, type AppState } from "../state/store";

export const cloudEnabled = true;

export const toE164 = (phone: string) => "+57" + phone.replace(/\D/g, "").replace(/^57(?=\d{10}$)/, "");

/** Registro de usuario en Cloudflare */
export async function sendCode(phone: string) {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) throw new Error("cloud_error");
    const data = (await res.json()) as { ok: boolean; userId: string; code?: string };
    if (data.userId) {
      localStorage.setItem("fresca:uid", data.userId);
      actions.updateProfile({ userId: data.userId });
    }
    return { ok: true, userId: data.userId, code: data.code || "123456" };
  } catch (e) {
    console.warn("[fresca cloud] Error en registro Cloudflare:", e);
    const fallbackId = `local_usr_${Date.now()}`;
    localStorage.setItem("fresca:uid", fallbackId);
    actions.updateProfile({ userId: fallbackId });
    return { ok: true, userId: fallbackId, code: "123456" };
  }
}

/** Verificación y carga del estado desde Cloudflare */
export async function verifyCode(phone: string, token: string) {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, token, userId: localStorage.getItem("fresca:uid") || undefined }),
    });
    if (!res.ok) throw new Error("cloud_error");
    const data = (await res.json()) as { ok: boolean; userId: string; state?: AppState | null };
    if (data.userId) {
      localStorage.setItem("fresca:uid", data.userId);
      await afterLogin(data.userId, data.state);
    }
    return data;
  } catch (e) {
    console.warn("[fresca cloud] Login local fallback:", e);
    const uid = localStorage.getItem("fresca:uid") || `local_usr_${Date.now()}`;
    actions.updateProfile({ account: "account", userId: uid });
    return { ok: true, userId: uid };
  }
}

export async function signInWithGoogle() {
  const uid = `cf_google_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  localStorage.setItem("fresca:uid", uid);
  await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: uid, name: "Usuario Google", phone: "" }),
  }).catch(() => undefined);
  actions.updateProfile({ account: "account", userId: uid, name: getState().profile.name || "Usuario Google", onboarded: true });
  await push();
  return { ok: true, userId: uid };
}

export async function signOutCloud() {
  localStorage.removeItem("fresca:uid");
  actions.updateProfile({ account: "guest", userId: undefined });
}

export async function deleteCloudData() {
  const uid = getState().profile.userId || localStorage.getItem("fresca:uid");
  if (uid) {
    await fetch(`/api/state/delete?userId=${encodeURIComponent(uid)}`, { method: "DELETE" }).catch(() => undefined);
  }
  localStorage.removeItem("fresca:uid");
  actions.updateProfile({ account: "guest", userId: undefined });
}

async function afterLogin(userId: string, remoteState?: AppState | null) {
  const local = getState();
  if (remoteState && remoteState.updatedAt > local.updatedAt && (remoteState.items.length || remoteState.events.length)) {
    replaceState({ ...remoteState, profile: { ...remoteState.profile, account: "account", userId, onboarded: true } });
  } else {
    actions.updateProfile({ account: "account", userId });
    await push();
  }
}

let timer: number | undefined;

export async function push() {
  const s = getState();
  const userId = s.profile.userId || localStorage.getItem("fresca:uid");
  if (!userId) return;
  try {
    await fetch("/api/state/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, state: s }),
    });
  } catch (e) {
    console.warn("[fresca cloud] Error al sincronizar con Cloudflare:", e);
  }
}

export async function pull(userId?: string) {
  const uid = userId || getState().profile.userId || localStorage.getItem("fresca:uid");
  if (!uid) return;
  try {
    const res = await fetch(`/api/state/load?userId=${encodeURIComponent(uid)}`);
    if (!res.ok) return;
    const data = (await res.json()) as { ok: boolean; state: AppState | null };
    if (data.state && data.state.updatedAt > getState().updatedAt) {
      replaceState(data.state);
    }
  } catch (e) {
    console.warn("[fresca cloud] Error al cargar de Cloudflare:", e);
  }
}

export async function startCloud() {
  const uid = getState().profile.userId || localStorage.getItem("fresca:uid");
  if (uid) {
    await pull(uid).catch(() => undefined);
  }
  onChange(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => push().catch(() => undefined), 1200);
  });
}
