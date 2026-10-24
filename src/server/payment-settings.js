import "server-only";
import { DEFAULT_PAYMENTS, validatePayments } from "@/lib/checkout";
import { isDatabaseConfigured } from "./db-config.js";
import { query } from "./db";
import { midtransConfigured, midtransIssues, midtransProduction } from "./midtrans";
import { paypalConfigured, paypalLive } from "./paypal";

// Pengaturan pembayaran dari /admin/pembayaran (tabel settings, baris "payments"): cara bayar yang
// dinyalakan tim, rekening transfer, dan batas waktu bayar. Key Midtrans dan PayPal tetap di hPanel.

export async function getPayments() {
  if (!isDatabaseConfigured()) return structuredClone(DEFAULT_PAYMENTS);
  const [row] = await query("SELECT value FROM settings WHERE name = 'payments'");
  if (!row) return structuredClone(DEFAULT_PAYMENTS);
  try {
    return validatePayments(JSON.parse(row.value));
  } catch {
    return structuredClone(DEFAULT_PAYMENTS);
  }
}

export async function savePayments(value) {
  await query("INSERT INTO settings (name, value) VALUES ('payments', ?) ON DUPLICATE KEY UPDATE value = VALUES(value)", [JSON.stringify(value)]);
}

/**
 * Kesiapan tiap cara bayar: dinyalakan di admin, key ada di hPanel (Midtrans tanpa salah isi),
 * kurs tersedia untuk PayPal, dan ada rekening untuk transfer. Tunai cukup dinyalakan.
 */
export function methodStatus(settings, rate) {
  const midtransKeys = midtransConfigured() && midtransIssues().length === 0;
  return {
    midtrans: { on: settings.midtrans, keys: midtransKeys, ready: settings.midtrans && midtransKeys, sandbox: !midtransProduction() },
    paypal: { on: settings.paypal, keys: paypalConfigured(), rate: Boolean(rate), ready: settings.paypal && paypalConfigured() && Boolean(rate), sandbox: !paypalLive() },
    transfer: { on: settings.transfer, accounts: settings.accounts.length, ready: settings.transfer && settings.accounts.length > 0 },
    cash: { on: settings.cash, ready: settings.cash },
  };
}

/** Cara bayar yang ditawarkan di checkout, urut seperti di formulir. */
export const readyMethods = (status) => ["midtrans", "paypal", "transfer", "cash"].filter((m) => status[m].ready);
