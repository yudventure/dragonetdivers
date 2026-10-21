import { readJson } from "@/server/admin-auth";
import { midtransNotification } from "@/server/checkout";

export const dynamic = "force-dynamic";

// Notifikasi pembayaran Midtrans (dikirim ke sini per transaksi lewat X-Override-Notification; boleh
// juga diisi sebagai Payment Notification URL di dashboard Midtrans). Ditandatangani Midtrans.
export async function POST(request) {
  const notification = await readJson(request, 20_000);
  if (!notification) return Response.json({ error: "Invalid notification." }, { status: 400 });
  try {
    const result = await midtransNotification(notification);
    if (result === "forbidden") return Response.json({ error: "Invalid signature." }, { status: 403 });
    return Response.json(result === "ignored" ? { ok: true, ignored: true } : { ok: true });
  } catch (error) {
    console.error(`[midtrans] notifikasi gagal: ${error.message}`);
    const mismatch = error.message === "MIDTRANS_AMOUNT_MISMATCH";
    return Response.json({ error: mismatch ? "Amount mismatch." : "Try again later." }, { status: mismatch ? 400 : 503 });
  }
}
