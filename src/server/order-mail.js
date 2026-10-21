import "server-only";
import { after } from "next/server";
import { orderMail } from "@/lib/order-mail";
import { serviceBySlug } from "@/lib/services";
import { contact, site, whatsappNumber } from "@/lib/site";
import { query } from "./db";
import { mailConfigured, mailFailure, mailIssues, sendMail } from "./mailer";
import { orderByCode } from "./orders";
import { getPayments } from "./payment-settings";

// Email pesanan ke tamu (template di src/lib/order-mail.js), dicatat di tabel order_emails:
//   order     saat pesanan dibuat (menunggu pembayaran)
//   reminder  pembayaran belum masuk saat separuh waktu bayar lewat (src/server/reminders.js)
//   paid      saat pembayaran diterima (Midtrans, PayPal, atau transfer ditandai lunas di admin)
// Setiap jenis terkirim sekali per pesanan; tim bisa mengirim ulang dari /admin/pesanan.

/** Ambil hak kirim satu email. force = kirim ulang dari admin. true bila boleh mengirim. */
async function claim(code, kind, force) {
  if (force) {
    await query(
      "INSERT INTO order_emails (order_code, kind, status) VALUES (?, ?, 'sending') ON DUPLICATE KEY UPDATE status = 'sending', error = NULL",
      [code, kind],
    );
    return true;
  }
  if (kind === "reminder") {
    const scheduled = await query("UPDATE order_emails SET status = 'sending' WHERE order_code = ? AND kind = 'reminder' AND status = 'scheduled'", [code]);
    if (scheduled.affectedRows > 0) return true;
  }
  const inserted = await query("INSERT IGNORE INTO order_emails (order_code, kind, status) VALUES (?, ?, 'sending')", [code, kind]);
  return inserted.affectedRows > 0;
}

const finish = (code, kind, result) =>
  query("UPDATE order_emails SET status = ?, error = ?, sent_at = ? WHERE order_code = ? AND kind = ?", [
    result.ok ? "sent" : "failed",
    result.ok ? null : String(result.error).slice(0, 300),
    result.ok ? new Date() : null,
    code,
    kind,
  ]);

/** Isi email untuk pesanan ini (juga dipakai pratinjau di admin, dengan rekening contoh bila perlu). */
export async function buildOrderMail(order, kind, { accounts } = {}) {
  accounts ??= order.method === "transfer" ? (await getPayments()).accounts : [];
  return orderMail(kind, {
    order,
    base: site.url,
    accounts,
    serviceTitle: serviceBySlug(order.service, order.lang)?.title ?? "",
    contact: { email: contact.email, address: contact.address },
    whatsapp: whatsappNumber(),
  });
}

/**
 * Kirim satu email pesanan ke tamu. { ok, error?, skipped? }; tidak pernah melempar, karena email
 * tidak boleh menggagalkan checkout atau notifikasi pembayaran.
 */
export async function sendOrderMail(code, kind, { force = false } = {}) {
  try {
    if (!mailConfigured()) return { ok: false, skipped: true, error: `SMTP belum diatur (${mailIssues().join(", ")}).` };
    const order = await orderByCode(code);
    if (!order?.email) return { ok: false, skipped: true, error: "Pesanan tidak ditemukan." };
    if (!(await claim(code, kind, force))) return { ok: false, skipped: true };
    let result;
    try {
      await sendMail({ to: order.email, ...(await buildOrderMail(order, kind)) });
      result = { ok: true };
    } catch (error) {
      console.error(`[email] ${kind} untuk ${code} gagal: ${error?.code || error?.message}`);
      result = { ok: false, error: mailFailure(error) };
    }
    await finish(code, kind, result);
    return result;
  } catch (error) {
    console.error(`[email] ${kind} untuk ${code}: ${error?.code || error?.message}`);
    return { ok: false, error: "Email belum bisa diproses. Coba lagi sebentar lagi." };
  }
}

/** Jadwalkan pengingat bayar di tengah waktu bayar pesanan. */
export async function scheduleReminder(order, now = new Date()) {
  if (!order.dueAt) return;
  const due = new Date(order.dueAt).getTime();
  const at = new Date(now.getTime() + (due - now.getTime()) / 2);
  await query("INSERT IGNORE INTO order_emails (order_code, kind, status, send_after) VALUES (?, 'reminder', 'scheduled', ?)", [order.code, at]);
}

/** Jalankan setelah jawaban terkirim, supaya tamu dan Midtrans tidak menunggu server email. */
export function later(task) {
  const run = () => Promise.resolve().then(task).catch((error) => console.error(`[email] ${error?.message}`));
  try {
    after(run);
  } catch {
    run(); // di luar permintaan (pengingat berkala)
  }
}

/** Status email per pesanan untuk /admin/pesanan: { [code]: { order: {status, at, error}, ... } }. */
export async function mailLog(codes) {
  if (!codes.length) return {};
  const rows = await query(
    `SELECT order_code, kind, status, error, sent_at, send_after FROM order_emails WHERE order_code IN (${codes.map(() => "?").join(",")})`,
    codes,
  );
  const log = {};
  for (const row of rows) {
    log[row.order_code] ??= {};
    log[row.order_code][row.kind] = {
      status: row.status,
      error: row.error,
      at: row.sent_at ? new Date(row.sent_at).toISOString() : null,
      after: row.send_after ? new Date(row.send_after).toISOString() : null,
    };
  }
  return log;
}
