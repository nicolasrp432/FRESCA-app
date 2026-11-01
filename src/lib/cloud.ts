import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { actions, getState, onChange, replaceState, type AppState } from "../state/store";

/**
 * Cuentas y copia en la nube (opcional). Sin VITE_SUPABASE_URL la app funciona 100 % local.
 * Tabla: supabase/migrations/0001_fresca_state.sql
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const cloudEnabled = Boolean(url && key);
let sb: SupabaseClient | null = null;
const client = () => (sb ??= createClient(url!, key!, { auth: { persistSession: true, detectSessionInUrl: true } }));

export const toE164 = (phone: string) => "+57" + phone.replace(/\D/g, "").replace(/^57(?=\d{10}$)/, "");

export async function sendCode(phone: string) {
  if (!cloudEnabled) throw new Error("cloud_off");
  const { error } = await client().auth.signInWithOtp({ phone: toE164(phone) });
  if (error) throw error;
}

export async function verifyCode(phone: string, token: string) {
  if (!cloudEnabled) throw new Error("cloud_off");
  const { data, error } = await client().auth.verifyOtp({ phone: toE164(phone), token, type: "sms" });
  if (error) throw error;
  if (data.user) await afterLogin(data.user.id);
  return data.user;
}

export async function signInWithGoogle() {
  if (!cloudEnabled) throw new Error("cloud_off");
  const { error } = await client().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/#/entrar/google` } });
  if (error) throw error;
}

export async function signOutCloud() {
  if (cloudEnabled) await client().auth.signOut().catch(() => undefined);
}

export async function deleteCloudData() {
  if (!cloudEnabled) return;
  const uid = getState().profile.userId;
  if (uid) await client().from("fresca_state").delete().eq("user_id", uid);
  await client().auth.signOut().catch(() => undefined);
}

/** Al entrar: baja la copia de la nube si es más nueva que la local */
async function afterLogin(userId: string) {
  const { data } = await client().from("fresca_state").select("data, updated_at").eq("user_id", userId).maybeSingle();
  const remote = data?.data as AppState | undefined;
  const local = getState();
  if (remote && remote.updatedAt > local.updatedAt && (remote.items.length || remote.events.length)) {
    replaceState({ ...remote, profile: { ...remote.profile, account: "account", userId, onboarded: true } });
  } else {
    actions.updateProfile({ account: "account", userId });
    await push();
  }
}

let timer: number | undefined;
async function push() {
  const s = getState();
  if (!cloudEnabled || s.profile.account !== "account" || !s.profile.userId) return;
  await client().from("fresca_state").upsert({ user_id: s.profile.userId, data: s, updated_at: new Date(s.updatedAt).toISOString() });
}

/** Arranca la sincronización: sesión existente (o regreso de Google) y subida con espera */
export async function startCloud() {
  if (!cloudEnabled) return;
  const { data } = await client().auth.getSession();
  if (data.session?.user && getState().profile.userId !== data.session.user.id) await afterLogin(data.session.user.id);
  onChange(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => push().catch(() => undefined), 1500);
  });
}
