import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { envPasswordForms, envPasswordMatches, MIN_PASSWORD, replacementActive, replacementRecord, typedPasswordMatches } from "@/lib/admin-password";
import { createSessionToken, passwordFingerprint, readSessionToken, sameText, SESSION_HOURS } from "@/lib/admin-session";
import { envText } from "@/lib/env";
import { createThrottle } from "@/lib/login-throttle";
import { isDatabaseConfigured } from "./db-config.js";
import { query } from "./db";

// Login operator dashboard (/admin), mengikuti cara Zanclus: akun operator dari variabel server
// ADMIN_EMAIL dan ADMIN_PASSWORD (diisi di hPanel, tidak pernah masuk repo), sesi di cookie httpOnly
// yang ditandatangani SESSION_SECRET. Tanpa ADMIN_EMAIL/ADMIN_PASSWORD, halaman login menampilkan
// petunjuk pengaturan dan tidak ada yang bisa masuk. "Lupa password" mengirim kode OTP ke email
// operator; password baru disimpan sebagai hash di tabel settings (baris "admin_password") dan
// berlaku sampai ADMIN_PASSWORD di hPanel diganti.

export const COOKIE = "dd_admin";
const SAVED = "admin_password";

const state = (globalThis.__dragonetAdmin ??= { secret: null, throttle: createThrottle() });
state.marks ??= new Map();

/** Akun operator dan masalah pengaturannya (tanpa menampilkan nilai rahasia). */
export function adminConfig(env = process.env) {
  const email = envText(env.ADMIN_EMAIL).toLowerCase();
  const password = envText(env.ADMIN_PASSWORD) ? env.ADMIN_PASSWORD : "";
  const issues = [];
  if (!email || !email.includes("@")) issues.push({ name: "ADMIN_EMAIL", reason: "Isi email operator, mis. operator@dragonetdivers.com." });
  if (!password) issues.push({ name: "ADMIN_PASSWORD", reason: "Isi password operator." });
  else if (envPasswordForms(password).at(-1).length < MIN_PASSWORD) issues.push({ name: "ADMIN_PASSWORD", reason: `Minimal ${MIN_PASSWORD} karakter.` });
  return { email, password, issues };
}

/** Peringatan yang tidak menghalangi login, untuk ditampilkan di dashboard. */
export function adminWarnings(env = process.env) {
  return envText(env.SESSION_SECRET)
    ? []
    : ["SESSION_SECRET belum diisi, jadi operator harus masuk lagi setiap kali aplikasi dimulai ulang."];
}

function secret() {
  const fromEnv = envText(process.env.SESSION_SECRET);
  if (fromEnv) return fromEnv;
  state.secret ??= randomBytes(48).toString("base64url");
  return state.secret;
}

/**
 * Password pengganti dari "Lupa password" yang masih berlaku, atau null. Bila database tidak terbaca,
 * password hPanel tetap bisa dipakai (seperti Zanclus), jadi operator tidak terkunci.
 */
async function savedPassword(config) {
  if (!isDatabaseConfigured()) return null;
  let record;
  try {
    const [row] = await query("SELECT value FROM settings WHERE name = ?", [SAVED]);
    record = row ? JSON.parse(row.value) : null;
  } catch (error) {
    console.error(`[admin] password tersimpan tidak terbaca: ${error.code ?? error.message}`);
    return null;
  }
  if (!record) return null;
  // Hasil cek envMark (scrypt) diingat per proses supaya tidak dihitung di setiap permintaan.
  const mark = `${record.hash}|${passwordFingerprint(config.password)}`;
  if (!state.marks.has(mark)) state.marks.set(mark, replacementActive(record, { email: config.email, envPassword: config.password }));
  return state.marks.get(mark) ? record : null;
}

/** Sidik jari untuk tanda tangan sesi: berubah saat password berganti, jadi sesi lama berakhir. */
const sessionFingerprint = (config, saved) => passwordFingerprint(saved ? `saved|${saved.hash}` : config.password);

/** Operator yang sedang masuk ({ email }) atau null. */
export async function currentAdmin() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const config = adminConfig();
  if (config.issues.length) return null;
  const fingerprint = sessionFingerprint(config, await savedPassword(config));
  const email = readSessionToken(token, { secret: secret(), fingerprintFor: (e) => (e === config.email ? fingerprint : null) });
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
  // Spasi yang ikut tertempel saat menyalin password dimaafkan, seperti di Zanclus. Password hPanel
  // juga diterima tanpa spasi atau tanda kutip yang ikut tersalin ke kolom Value.
  const saved = await savedPassword(config);
  const passwordOk = saved ? typedPasswordMatches(saved, password) : envPasswordMatches(config.password, password);
  if (!emailOk || !passwordOk) {
    state.throttle.fail(key);
    return { ok: false, status: 401, error: "Email atau password tidak sesuai." };
  }
  state.throttle.clear(key);
  await startSession(config, saved);
  return { ok: true };
}

async function startSession(config, saved) {
  const token = createSessionToken({ email: config.email, fingerprint: sessionFingerprint(config, saved), secret: secret() });
  (await cookies()).set(COOKIE, token, cookieOptions());
}

/** Email ini email operator (ADMIN_EMAIL)? Untuk "Lupa password". */
export function isAdminEmail(email) {
  const config = adminConfig();
  return config.issues.length === 0 && sameText(String(email ?? "").trim().toLowerCase(), config.email);
}

/** Simpan password baru dari "Lupa password", akhiri sesi lain, dan masukkan browser ini. */
export async function replacePassword(request, password) {
  const config = adminConfig();
  const record = replacementRecord({ email: config.email, password, envPassword: config.password });
  await query("INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)", [SAVED, JSON.stringify(record)]);
  state.marks.clear();
  state.throttle.clear(clientKey(request));
  await startSession(config, record);
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
