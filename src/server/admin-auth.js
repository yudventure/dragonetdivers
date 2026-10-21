import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { createSessionToken, passwordFingerprint, readSessionToken, sameText, SESSION_HOURS } from "@/lib/admin-session";
import { createThrottle } from "@/lib/login-throttle";

// Login operator dashboard (/admin), mengikuti cara Zanclus: akun operator dari variabel server
// ADMIN_EMAIL dan ADMIN_PASSWORD (diisi di hPanel, tidak pernah masuk repo), sesi di cookie httpOnly
// yang ditandatangani SESSION_SECRET. Tanpa ADMIN_EMAIL/ADMIN_PASSWORD, halaman login menampilkan
// petunjuk pengaturan dan tidak ada yang bisa masuk.

export const COOKIE = "dd_admin";
const MIN_PASSWORD = 10;

const state = (globalThis.__dragonetAdmin ??= { secret: null, throttle: createThrottle() });

/** Akun operator dan masalah pengaturannya (tanpa menampilkan nilai rahasia). */
export function adminConfig(env = process.env) {
  const email = env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const password = env.ADMIN_PASSWORD ?? "";
  const issues = [];
  if (!email || !email.includes("@")) issues.push({ name: "ADMIN_EMAIL", reason: "Isi email operator, mis. operator@dragonetdivers.com." });
  if (!password) issues.push({ name: "ADMIN_PASSWORD", reason: "Isi password operator." });
  else if (password.length < MIN_PASSWORD) issues.push({ name: "ADMIN_PASSWORD", reason: `Minimal ${MIN_PASSWORD} karakter.` });
  return { email, password, issues };
}

/** Peringatan yang tidak menghalangi login, untuk ditampilkan di dashboard. */
export function adminWarnings(env = process.env) {
  return env.SESSION_SECRET?.trim()
    ? []
    : ["SESSION_SECRET belum diisi, jadi operator harus masuk lagi setiap kali aplikasi dimulai ulang."];
}

function secret() {
  const fromEnv = process.env.SESSION_SECRET?.trim();
  if (fromEnv) return fromEnv;
  state.secret ??= randomBytes(48).toString("base64url");
  return state.secret;
}

function fingerprintFor(email) {
  const config = adminConfig();
  return config.issues.length === 0 && email === config.email ? passwordFingerprint(config.password) : null;
}

/** Operator yang sedang masuk ({ email }) atau null. */
export async function currentAdmin() {
  const token = (await cookies()).get(COOKIE)?.value;
  const email = token ? readSessionToken(token, { secret: secret(), fingerprintFor }) : null;
  return email ? { email } : null;
}

export const cookieOptions = (maxAge = SESSION_HOURS * 3600) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge,
});

/** Permintaan POST hanya diterima dari situs ini sendiri (melawan CSRF). */
export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

const clientKey = (request) => request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";

/** Periksa email dan password; mengembalikan { ok, status, error } dan menulis cookie bila berhasil. */
export async function login(request, { email, password }) {
  const config = adminConfig();
  if (config.issues.length) return { ok: false, status: 503, error: "Login operator belum diatur. Isi ADMIN_EMAIL dan ADMIN_PASSWORD di hPanel." };
  const key = clientKey(request);
  if (state.throttle.blocked(key)) return { ok: false, status: 429, error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." };
  const emailOk = sameText(String(email).trim().toLowerCase(), config.email);
  // Spasi yang ikut tertempel saat menyalin password dimaafkan, seperti di Zanclus.
  const passwordOk = sameText(String(password), config.password) || sameText(String(password).trim(), config.password);
  if (!emailOk || !passwordOk) {
    state.throttle.fail(key);
    return { ok: false, status: 401, error: "Email atau password tidak sesuai." };
  }
  state.throttle.clear(key);
  const token = createSessionToken({ email: config.email, fingerprint: passwordFingerprint(config.password), secret: secret() });
  (await cookies()).set(COOKIE, token, cookieOptions());
  return { ok: true };
}

export async function logout() {
  (await cookies()).set(COOKIE, "", cookieOptions(0));
}

/** Penjaga API admin: asal permintaan harus situs ini dan operator harus masuk. { admin } atau { error: Response }. */
export async function guardAdmin(request) {
  if (!sameOrigin(request)) return { error: Response.json({ error: "Asal permintaan tidak valid." }, { status: 403 }) };
  const admin = await currentAdmin();
  if (!admin) return { error: Response.json({ error: "Sesi berakhir. Muat ulang halaman lalu masuk lagi." }, { status: 401 }) };
  return { admin };
}

/** Badan JSON permintaan dengan batas ukuran; null bila bukan JSON atau terlalu besar. */
export async function readJson(request, limit = 16_000) {
  const text = await request.text().catch(() => "");
  if (!text || text.length > limit) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
