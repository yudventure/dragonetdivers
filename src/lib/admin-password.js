// Password operator: pencocokan dengan ADMIN_PASSWORD dari hPanel dan password pengganti dari
// "Lupa password" (disimpan sebagai hash scrypt di tabel settings). Fungsi murni tanpa database
// supaya bisa diuji di tests/admin-password.test.js.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { sameText } from "./admin-session.js";

export const MIN_PASSWORD = 10;
const MAX_PASSWORD = 200;
const SCRYPT = { N: 16384, r: 8, p: 1 };

/**
 * Bentuk ADMIN_PASSWORD yang diterima: apa adanya, tanpa spasi di awal atau akhir, dan tanpa tanda
 * kutip pembungkus. Spasi atau kutip yang ikut tersalin ke hPanel tidak membuat login gagal.
 */
export function envPasswordForms(raw) {
  const text = String(raw ?? "");
  const trimmed = text.trim();
  const unquoted = trimmed.replace(/^(["'])(.*)\1$/s, "$2");
  return [...new Set([text, trimmed, unquoted])].filter(Boolean);
}

/** Password yang diketik cocok dengan ADMIN_PASSWORD (spasi tempelan di ketikan dimaafkan). */
export function envPasswordMatches(raw, typed) {
  const given = [...new Set([String(typed), String(typed).trim()])];
  return envPasswordForms(raw).some((form) => given.some((value) => sameText(value, form)));
}

/** { salt, hash } scrypt untuk disimpan. */
export function hashPassword(password, salt = randomBytes(16).toString("base64url")) {
  return { salt, hash: scryptSync(String(password), salt, 64, SCRYPT).toString("base64url") };
}

/** Password cocok dengan { salt, hash } yang tersimpan. */
export function verifyPassword(record, password) {
  if (typeof record?.salt !== "string" || typeof record?.hash !== "string") return false;
  const expected = Buffer.from(record.hash, "base64url");
  const actual = scryptSync(String(password), record.salt, 64, SCRYPT);
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

/** Sama dengan verifyPassword, spasi tempelan di awal atau akhir ketikan dimaafkan. */
export const typedPasswordMatches = (record, typed) =>
  verifyPassword(record, typed) || (String(typed).trim() !== String(typed) && verifyPassword(record, String(typed).trim()));

/**
 * Catatan password pengganti untuk tabel settings. envMark = hash ADMIN_PASSWORD saat itu: password
 * pengganti berlaku sampai ADMIN_PASSWORD di hPanel diganti, lalu password hPanel berlaku lagi.
 */
export function replacementRecord({ email, password, envPassword, now = new Date() }) {
  return { email, ...hashPassword(password), envMark: hashPassword(envPassword), changedAt: now.toISOString() };
}

/** Password pengganti masih berlaku untuk akun dan ADMIN_PASSWORD sekarang. */
export const replacementActive = (record, { email, envPassword }) =>
  Boolean(record) && record.email === email && verifyPassword(record.envMark, envPassword);

/** Masalah pada password baru, atau "" bila boleh dipakai. */
export function passwordProblem(email, password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD) return `Password baru minimal ${MIN_PASSWORD} karakter.`;
  if (password.length > MAX_PASSWORD) return `Password baru maksimal ${MAX_PASSWORD} karakter.`;
  if (password.trim() !== password) return "Password baru tidak boleh diawali atau diakhiri spasi.";
  if (password.trim().toLowerCase() === String(email).trim().toLowerCase()) return "Password baru tidak boleh sama dengan email.";
  return "";
}

/** "ha••••@dragonetdiversrajaampat.com": menunjukkan ke mana kode dikirim tanpa menulis alamat lengkap. */
export function maskEmail(email) {
  const [name, domain] = String(email).split("@");
  if (!domain) return "••••";
  return `${name.slice(0, 2)}${"•".repeat(Math.max(3, name.length - 2))}@${domain}`;
}
