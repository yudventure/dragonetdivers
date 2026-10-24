import { ORDER_MAIL_KINDS, sampleOrder } from "@/lib/order-mail";
import { otpMail } from "@/lib/otp-mail";
import { currentAdmin } from "@/server/admin-auth";
import { buildOrderMail } from "@/server/order-mail";
import { getPayments } from "@/server/payment-settings";

export const dynamic = "force-dynamic";

// Pratinjau email di /admin/pembayaran: /api/admin/mail-preview?kind=order&lang=id&method=transfer
// (kind: order | reminder | paid | otp). Memakai pesanan contoh, tidak mengirim apa pun.
const SAMPLE_ACCOUNT = { bank: "Contoh Bank", number: "0000000000", holder: "Dragonet Divers" };

export async function GET(request) {
  if (!(await currentAdmin())) return new Response("Masuk dulu di /admin.", { status: 401 });
  const params = new URL(request.url).searchParams;
  const kind = params.get("kind");
  const lang = params.get("lang") === "en" ? "en" : "id";
  const method = ["midtrans", "paypal", "transfer", "cash"].includes(params.get("method")) ? params.get("method") : "midtrans";
  let mail;
  if (kind === "otp") {
    mail = otpMail({ code: "482913", account: "operator@dragonetdivers.com", minutes: 10 });
  } else if (ORDER_MAIL_KINDS.includes(kind)) {
    // Rekening dari /admin/pembayaran; tanpa rekening tersimpan (atau database) dipakai rekening contoh.
    const saved = method === "transfer" ? await getPayments().then((p) => p.accounts).catch(() => []) : [];
    const accounts = method === "transfer" && !saved.length ? [SAMPLE_ACCOUNT] : saved;
    mail = await buildOrderMail(sampleOrder({ kind, lang, method }), kind, { accounts });
  } else {
    return new Response("Jenis email tidak dikenal.", { status: 400 });
  }
  return new Response(mail.html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
