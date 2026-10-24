// Galat di peramban admin (app/admin/error.jsx): dirapikan, dicatat di server (settings baris
// client_errors, 20 terakhir, tampil di /admin/developer), dan dipakai untuk memutuskan muat ulang
// otomatis. Laporan pemilik Oktober 2026: setelah Simpan di galeri muncul "This page couldn't load",
// padahal Reload berhasil; jadi halaman dimuat ulang sendiri sekali, dan pesannya dicatat untuk dilacak.
// Fungsi murni, diuji di tests/client-errors.test.js.

export const MAX_ERRORS = 20;
/** Jeda minimal antar-muat ulang otomatis, supaya galat yang menetap tidak memuat ulang terus-menerus. */
export const RELOAD_GAP_MS = 60_000;

const text = (value, max) =>
  String(value ?? "")
    .replace(/[\u0000-\u001f]+/g, " ")
    .trim()
    .slice(0, max);

/** Isian laporan dari peramban → catatan yang disimpan, atau null bila kosong. */
export function cleanClientError(input, now = new Date()) {
  if (!input || typeof input !== "object") return null;
  const message = text(input.message, 300);
  if (!message) return null;
  const stack = String(input.stack ?? "")
    .split("\n")
    .slice(0, 4)
    .map((line) => text(line, 160))
    .filter(Boolean)
    .join(" | ");
  const url = text(input.url, 200);
  return {
    at: now.toISOString(),
    message,
    digest: text(input.digest, 40),
    url: url.startsWith("/admin") ? url : "",
    stack: stack.slice(0, 600),
    agent: text(input.agent, 160),
  };
}

/** Catatan terbaru di depan, paling banyak MAX_ERRORS. */
export const pushError = (list, entry) => [entry, ...(Array.isArray(list) ? list : [])].slice(0, MAX_ERRORS);

/**
 * Muat ulang otomatis? Hanya bila waktu muat ulang terakhir bisa dibaca (sessionStorage) dan sudah lewat
 * RELOAD_GAP_MS. last = null berarti penyimpanan peramban tidak tersedia, jadi tidak dimuat ulang.
 */
export const shouldAutoReload = (last, now = Date.now()) => last !== null && now - last > RELOAD_GAP_MS;
