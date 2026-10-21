import { isOrderCode } from "@/lib/checkout";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { adminSetStatus, refreshOrder } from "@/server/checkout";
import { orderByCode } from "@/server/orders";

export const dynamic = "force-dynamic";

// Tindakan tim di /admin/pesanan: tandai transfer lunas, batalkan, atau cek status ke Midtrans/PayPal.
export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request);
  if (!input || !isOrderCode(input.code) || !["paid", "cancelled", "refresh"].includes(input.action)) {
    return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
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
