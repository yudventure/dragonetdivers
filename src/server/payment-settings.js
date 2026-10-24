import "server-only";
import { OWNER_BANK } from "@/content/bank-account";
import { DEFAULT_PAYMENTS, validatePayments, withOwnerAccount } from "@/lib/checkout";
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

const seed = (globalThis.__dragonetBankAccount ??= { run: null });

/**
 * Rekening dari pemilik (src/content/bank-account.js) dimasukkan sekali ke pengaturan pembayaran dan transfer
 * bank dinyalakan, tanpa menunggu tim mengisinya di /admin/pembayaran. Baris settings bank_account_<version>
 * menandainya, jadi rekening yang kemudian diubah atau dihapus tim tidak kembali. Sekali per proses; bila
 * gagal, dicoba lagi pada pemanggilan berikutnya. Tidak berjalan saat build.
 */
export function ensureBankAccount() {
  if (!isDatabaseConfigured() || process.env.NEXT_PHASE === "phase-production-build") return Promise.resolve(null);
  seed.run ??= (async () => {
    const name = `bank_account_${OWNER_BANK.version}`;
    const claim = await query("INSERT IGNORE INTO settings (name, value) VALUES (?, ?)", [name, JSON.stringify({ state: "adding" })]);
    if (claim.affectedRows === 0) return null; // sudah dimasukkan (atau sedang dimasukkan proses lain)
    try {
      const next = withOwnerAccount(await getPayments(), OWNER_BANK.account);
      if (next) await savePayments(next);
      await query("UPDATE settings SET value = ? WHERE name = ?", [JSON.stringify({ state: "done", at: new Date().toISOString(), changed: Boolean(next) }), name]);
      console.log(`[pembayaran] rekening pemilik ${OWNER_BANK.version}: ${next ? "ditambahkan, transfer bank menyala" : "sudah ada"}`);
      return next;
    } catch (error) {
      await query("DELETE FROM settings WHERE name = ?", [name]).catch(() => {});
      throw error;
    }
  })().catch((error) => {
    seed.run = null;
    console.error(`[pembayaran] rekening pemilik belum bisa dimasukkan: ${error.code ?? error.message}`);
    return null;
  });
  return seed.run;
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
