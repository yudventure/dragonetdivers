// Token sesi operator: payload (email + kedaluwarsa) yang ditandatangani HMAC-SHA256. Sidik jari
// password ikut ditandatangani, jadi mengganti ADMIN_PASSWORD langsung mengakhiri semua sesi lama.
// Fungsi murni (tanpa cookie atau env) supaya bisa diuji di tests/admin-session.test.js.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_HOURS = 12;

const sha256 = (value) => createHash("sha256").update(String(value)).digest();

/** Bandingkan dua teks tanpa membocorkan panjang atau isi lewat waktu proses. */
export const sameText = (a, b) => timingSafeEqual(sha256(a), sha256(b));

/** Sidik jari password untuk tanda tangan sesi (bukan untuk disimpan sebagai hash password). */
export const passwordFingerprint = (password) => sha256(`dragonet-session|${password}`).toString("base64url");

const signature = (secret, fingerprint, payload) => createHmac("sha256", secret).update(`${fingerprint}|${payload}`).digest("base64url");

export function createSessionToken({ email, fingerprint, secret, now = Date.now(), hours = SESSION_HOURS }) {
  const payload = Buffer.from(JSON.stringify({ e: String(email).trim().toLowerCase(), x: now + hours * 3600_000 })).toString("base64url");
  return `${payload}.${signature(secret, fingerprint, payload)}`;
}

/** Email operator dari token yang sah dan belum kedaluwarsa, atau null. */
export function readSessionToken(token, { secret, fingerprintFor, now = Date.now() }) {
  if (typeof token !== "string" || token.length > 2000) return null;
  const [payload, sig, extra] = token.split(".");
  if (!payload || !sig || extra !== undefined) return null;
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof data?.e !== "string" || typeof data?.x !== "number" || data.x <= now) return null;
  const fingerprint = fingerprintFor(data.e);
  if (!fingerprint || !sameText(sig, signature(secret, fingerprint, payload))) return null;
  return data.e;
}
