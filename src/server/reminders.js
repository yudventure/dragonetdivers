import "server-only";
import { refreshOrder } from "./checkout";
import { isDatabaseConfigured } from "./db-config.js";
import { query } from "./db";
import { mailConfigured } from "./mailer";
import { sendOrderMail } from "./order-mail";
import { orderByCode } from "./orders";

// Pengingat "pembayaran belum masuk": setiap 10 menit, pesanan yang masih menunggu bayar dan sudah
// melewati separuh waktu bayarnya dicek dulu ke Midtrans/PayPal, lalu tamunya dikirimi email
// pengingat (sekali per pesanan). Dimulai dari instrumentation.js saat server Next.js berjalan.

const EVERY = 10 * 60_000;
const state = (globalThis.__dragonetReminders ??= { timer: null, running: false });

export async function sendDueReminders() {
  if (state.running || !isDatabaseConfigured() || !mailConfigured()) return;
  state.running = true;
  try {
    // Pengingat untuk pesanan yang sudah tidak menunggu bayar tidak dikirim.
    await query(
      `UPDATE order_emails e JOIN orders o ON o.code = e.order_code SET e.status = 'skipped'
       WHERE e.kind = 'reminder' AND e.status = 'scheduled' AND (o.status <> 'pending' OR (o.due_at IS NOT NULL AND o.due_at <= UTC_TIMESTAMP()))`,
    );
    const due = await query(
      `SELECT e.order_code FROM order_emails e JOIN orders o ON o.code = e.order_code
       WHERE e.kind = 'reminder' AND e.status = 'scheduled' AND e.send_after <= UTC_TIMESTAMP() AND o.status = 'pending'
       ORDER BY e.send_after LIMIT 20`,
    );
    for (const { order_code: code } of due) {
      const order = await refreshOrder(await orderByCode(code));
      if (order?.status === "pending") await sendOrderMail(code, "reminder");
      else await query("UPDATE order_emails SET status = 'skipped' WHERE order_code = ? AND kind = 'reminder' AND status = 'scheduled'", [code]);
    }
  } catch (error) {
    console.error(`[pengingat] ${error?.code || error?.message}`);
  } finally {
    state.running = false;
  }
}

/** Mulai pengecekan berkala (sekali per proses). */
export function startReminders() {
  if (state.timer) return;
  state.timer = setInterval(sendDueReminders, EVERY);
  state.timer.unref?.();
  setTimeout(sendDueReminders, 60_000).unref?.();
}
