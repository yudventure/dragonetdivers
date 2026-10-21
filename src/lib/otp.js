// Kode OTP 6 angka untuk "Lupa password" di /admin (diambil dari Zanclus). Disimpan di memori server
// saja, sebagai hash berkunci: berlaku 10 menit, 5 kali coba, sekali pakai. Kode baru bisa diminta
// 1 menit setelah kode sebelumnya, paling banyak 5 kode per jam. Tanpa "server-only" supaya bisa
// diuji di tests/otp.test.js.
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export const OTP_MINUTES = 10;
const TRIES = 5;
const RESEND_AFTER = 60_000;
const PER_HOUR = 5;

export class OtpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const store = () => (globalThis.__dragonetOtps ??= new Map());
const key = () => (globalThis.__dragonetOtpKey ??= randomBytes(32));
const digest = (id, code) => createHmac("sha256", key()).update(`${id}|${code}`).digest();
const emailKey = (email) => String(email).trim().toLowerCase();

/** Buat kode baru untuk email ini; OtpError 429 bila diminta terlalu cepat atau terlalu sering. */
export function issueOtp(email, now = Date.now()) {
  const id = emailKey(email);
  const sent = (store().get(id)?.sent ?? []).filter((t) => now - t < 3600_000);
  if (sent.length && now - sent[sent.length - 1] < RESEND_AFTER) throw new OtpError("Kode baru bisa diminta 1 menit setelah kode sebelumnya.", 429);
  if (sent.length >= PER_HOUR) throw new OtpError("Sudah 5 kode dikirim dalam 1 jam terakhir. Coba lagi nanti.", 429);
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  store().set(id, { hash: digest(id, code), expires: now + OTP_MINUTES * 60_000, attempts: 0, sent: [...sent, now] });
  return code;
}

/** Batalkan kode yang gagal dikirim, supaya permintaan berikutnya tidak perlu menunggu 1 menit. */
export function dropOtp(email) {
  const id = emailKey(email);
  const entry = store().get(id);
  if (entry) store().set(id, { sent: entry.sent.slice(0, -1) });
}

/** true bila kode benar (kode langsung hangus); OtpError bila salah, kedaluwarsa, atau sudah 5 kali salah. */
export function checkOtp(email, code, now = Date.now()) {
  const id = emailKey(email);
  const entry = store().get(id);
  if (!entry?.hash || now > entry.expires) throw new OtpError("Kode sudah tidak berlaku. Minta kode baru.");
  entry.attempts++;
  const given = String(code ?? "").replace(/\s/g, "");
  if (/^\d{6}$/.test(given) && timingSafeEqual(digest(id, given), entry.hash)) {
    store().set(id, { sent: entry.sent });
    return true;
  }
  if (entry.attempts >= TRIES) {
    store().set(id, { sent: entry.sent });
    throw new OtpError("Kode salah 5 kali dan sudah dibatalkan. Minta kode baru.");
  }
  throw new OtpError(`Kode salah. Sisa ${TRIES - entry.attempts} kali percobaan.`);
}
