import { validatePayments } from "@/lib/checkout";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { testMidtrans } from "@/server/midtrans";
import { savePayments } from "@/server/payment-settings";
import { testPaypal } from "@/server/paypal";

export const dynamic = "force-dynamic";

// /admin/pembayaran: simpan pengaturan ({ settings }) atau uji koneksi ({ test: "midtrans" | "paypal" }).
export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request);
  if (!input) return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
  if (input.test === "midtrans") return Response.json(await testMidtrans());
  if (input.test === "paypal") return Response.json(await testPaypal());
  try {
    await savePayments(validatePayments(input.settings));
    return Response.json({ ok: true });
  } catch (e) {
    if (e.code) console.error(`[admin/pembayaran] ${e.code}`);
    return Response.json({ error: e.code ? "Database belum bisa diakses. Coba lagi sebentar." : e.message }, { status: e.code ? 503 : 400 });
  }
}
