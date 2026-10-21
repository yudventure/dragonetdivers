// Membaca pengaturan Midtrans dari hPanel (diambil dari Zanclus). Spasi dan tanda kutip di sekitar
// nilai diabaikan. Kesalahan isian lain dijelaskan di /admin/pembayaran dengan kata-kata biasa,
// karena Midtrans hanya menjawab 401.
import { envText } from "./env.js";

// "-" berarti belum diisi (file impor .env, src/lib/env.js).
const unquote = (value) =>
  envText(
    String(value ?? "")
      .trim()
      .replace(/^(["'])(.*)\1$/, "$2"),
  );

export const cleanKey = unquote;

/** MIDTRANS_PRODUCTION=true untuk pembayaran sungguhan; selain itu sandbox. */
export const productionOn = (value) => unquote(value).toLowerCase() === "true";

// Server key resmi: Mid-server- (production), SB-Mid-server- (sandbox), VT-server- (akun lama).
const SERVER_KEY = /(?:SB-)?(?:Mid|VT)-server-[A-Za-z0-9_-]+/i;
const shown = (text) => (text.length > 40 ? `${text.slice(0, 40)}…` : text);

export function keyIssues(rawKey, rawProduction) {
  const value = cleanKey(rawKey);
  const flag = unquote(rawProduction);
  const production = productionOn(rawProduction);
  const issues = [];
  if (flag && !production && flag.toLowerCase() !== "false") {
    issues.push(`MIDTRANS_PRODUCTION berisi "${shown(flag)}". Isi dengan true saja untuk pembayaran sungguhan, lalu deploy ulang.`);
  }
  if (!value) return issues;
  if (/^(SB-)?Mid-client-/i.test(value)) {
    issues.push("Yang diisi di MIDTRANS_SERVER_KEY adalah Client Key. Isi dengan Server Key dari dashboard Midtrans (Settings → Access Keys).");
    return issues;
  }
  const match = value.match(SERVER_KEY);
  if (!match) {
    issues.push(
      "Isi MIDTRANS_SERVER_KEY bukan Server Key Midtrans. Server Key berawalan Mid-server- untuk pembayaran sungguhan atau SB-Mid-server- untuk uji coba.",
    );
    return issues;
  }
  const extra = `${value.slice(0, match.index)} ${value.slice(match.index + match[0].length)}`.trim();
  if (extra) issues.push(`MIDTRANS_SERVER_KEY punya teks tambahan "${shown(extra)}" yang bukan bagian dari key. Isi dengan Server Key saja, lalu deploy ulang.`);
  if (!production && /^Mid-server-/i.test(match[0])) {
    issues.push("Server key ini untuk pembayaran sungguhan, tetapi MIDTRANS_PRODUCTION belum true. Tambahkan MIDTRANS_PRODUCTION=true di hPanel, atau pakai key sandbox (SB-Mid-server-).");
  } else if (production && /^SB-/i.test(match[0])) {
    issues.push("Server key sandbox (awalan SB-) dipakai dengan MIDTRANS_PRODUCTION=true. Hapus MIDTRANS_PRODUCTION untuk uji coba, atau pakai server key production.");
  }
  return issues;
}

/** Empat karakter terakhir key, supaya pemilik bisa memastikan perubahan di hPanel sudah terbaca. */
export const keyEnding = (rawKey) => {
  const value = cleanKey(rawKey);
  return value.length > 12 ? value.slice(-4) : "";
};
