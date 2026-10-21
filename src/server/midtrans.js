import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cleanKey, keyEnding, keyIssues, productionOn } from "@/lib/midtrans-key";

// Midtrans Snap dan Core API (diambil dari Zanclus). Key dari hPanel: MIDTRANS_SERVER_KEY, dan
// MIDTRANS_PRODUCTION=true untuk pembayaran sungguhan (selain itu sandbox). MIDTRANS_SNAP_URL /
// MIDTRANS_API_URL hanya untuk uji lokal dengan server tiruan. Midtrans menagih dalam Rupiah.

const key = () => cleanKey(process.env.MIDTRANS_SERVER_KEY);
export const midtransConfigured = () => key().length > 0;
export const midtransProduction = () => productionOn(process.env.MIDTRANS_PRODUCTION);
export const midtransIssues = () => keyIssues(process.env.MIDTRANS_SERVER_KEY, process.env.MIDTRANS_PRODUCTION);
export const midtransKeyEnding = () => keyEnding(process.env.MIDTRANS_SERVER_KEY);

function base(kind) {
  const custom = kind === "snap" ? process.env.MIDTRANS_SNAP_URL : process.env.MIDTRANS_API_URL;
  if (custom) return custom.replace(/\/+$/, "");
  const host = kind === "snap" ? "app" : "api";
  return midtransProduction() ? `https://${host}.midtrans.com` : `https://${host}.sandbox.midtrans.com`;
}

const headers = () => ({
  Accept: "application/json",
  "Content-Type": "application/json",
  Authorization: `Basic ${Buffer.from(`${key()}:`).toString("base64")}`,
});

const state = (globalThis.__dragonetMidtrans ??= { lastError: null });
/** Jawaban terakhir yang ditolak Midtrans, ditampilkan di /admin/pembayaran untuk mencari penyebabnya. */
export const lastMidtransError = () => state.lastError;
const remember = (stage, status, message) => {
  state.lastError = { at: new Date().toISOString(), stage, status, message: String(message ?? "").slice(0, 300) };
};
const midtransMessage = (data) => [data?.error_messages, data?.status_message].flat().filter(Boolean).join("; ");

/**
 * Buat transaksi Snap; mengembalikan { token, redirect_url }. Notifikasi pembayaran transaksi ini
 * dikirim ke notifyUrl (X-Override-Notification), jadi URL di dashboard Midtrans tidak wajib diisi.
 */
export async function createTransaction(body, { notifyUrl } = {}) {
  let response;
  try {
    response = await fetch(`${base("snap")}/snap/v1/transactions`, {
      method: "POST",
      headers: { ...headers(), ...(notifyUrl ? { "X-Override-Notification": notifyUrl } : {}) },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    remember("snap", 0, `Tidak bisa terhubung ke Midtrans: ${error.message}`);
    throw error;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.redirect_url) {
    remember("snap", response.status, midtransMessage(data));
    throw new Error(`MIDTRANS_SNAP_${response.status} ${midtransMessage(data)}`);
  }
  state.lastError = null;
  return data;
}

/** Status transaksi sekarang, atau null bila Midtrans belum punya transaksinya (tamu belum memilih cara bayar). */
export async function transactionStatus(orderId) {
  const response = await fetch(`${base("api")}/v2/${encodeURIComponent(orderId)}/status`, { headers: headers(), signal: AbortSignal.timeout(15000) });
  const data = await response.json().catch(() => ({}));
  if (response.status === 404 || data.status_code === "404") return null;
  if (!response.ok) throw new Error(`MIDTRANS_STATUS_${response.status}`);
  return data;
}

/** Tanyakan pesanan yang tidak ada: "not found" berarti server key diterima, 401 berarti ditolak. */
export async function testMidtrans() {
  if (!midtransConfigured()) return { ok: false, reason: "missing" };
  let response;
  try {
    response = await fetch(`${base("api")}/v2/dragonet-test-${Date.now()}/status`, { headers: headers(), signal: AbortSignal.timeout(15000) });
  } catch (error) {
    return { ok: false, reason: "network", message: error.message };
  }
  const data = await response.json().catch(() => ({}));
  const code = String(data.status_code ?? response.status);
  if (code === "404") {
    state.lastError = null;
    return { ok: true };
  }
  remember("test", Number(code) || response.status, midtransMessage(data));
  return { ok: false, reason: code === "401" ? "key" : "other", status: Number(code) || response.status, message: midtransMessage(data) };
}

/** Notifikasi ditandatangani SHA512(order_id + status_code + gross_amount + server key). */
export function validSignature(notification) {
  const { order_id, status_code, gross_amount, signature_key } = notification ?? {};
  if (![order_id, status_code, gross_amount, signature_key].every(Boolean) || !midtransConfigured()) return false;
  const expected = createHash("sha512").update(`${order_id}${status_code}${gross_amount}${key()}`).digest();
  const given = Buffer.from(String(signature_key), "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
