import { isOrderCode } from "@/lib/checkout";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { adminSetStatus, refreshOrder } from "@/server/checkout";
import { sendOrderMail } from "@/server/order-mail";
import { orderByCode } from "@/server/orders";

export const dynamic = "force-dynamic";

// Email yang boleh dikirim ulang tim, menurut status pesanan.
const MAIL_FOR = { pending: ["order", "reminder"], paid: ["paid"] };

// Tindakan tim di /admin/pesanan: tandai transfer atau tunai lunas, batalkan, cek status ke Midtrans/PayPal, atau
// kirim ulang email ke tamu ({ action: "mail", kind }).
export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request);
  if (!input || !isOrderCode(input.code) || !["paid", "cancelled", "refresh", "mail"].includes(input.action)) {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
  }
  if (input.action === "mail") {
    const order = await orderByCode(input.code).catch(() => null);
    if (!order) return Response.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    // Pesanan tunai tidak punya batas waktu bayar, jadi tidak dikirimi pengingat.
    if (!MAIL_FOR[order.status]?.includes(input.kind) || (order.method === "cash" && input.kind === "reminder")) {
      return Response.json({ error: "Email ini tidak cocok dengan status pesanan." }, { status: 400 });
    }
    const result = await sendOrderMail(order.code, input.kind, { force: true });
    return result.ok ? Response.json({ ok: true }) : Response.json({ error: result.error || "Email belum terkirim." }, { status: 502 });
  }
  try {
    const order = input.action === "refresh" ? await refreshOrder(await orderByCode(input.code)) : await adminSetStatus(input.code, input.action);
    if (!order) return Response.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    return Response.json({ ok: true, status: order.status });
  } catch (e) {
    if (e.code) console.error(`[admin/pesanan] ${e.code}`);
    return Response.json({ error: e.code ? "Database belum bisa diakses. Coba lagi sebentar." : e.message }, { status: e.code ? 503 : 400 });
  }
}
