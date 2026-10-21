import { maskEmail } from "@/lib/admin-password";
import { validatePayments } from "@/lib/checkout";
import { sampleOrder } from "@/lib/order-mail";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { mailConfigured, mailFailure, mailIssues, otpRecipient, sendMail } from "@/server/mailer";
import { testMidtrans } from "@/server/midtrans";
import { buildOrderMail } from "@/server/order-mail";
import { savePayments } from "@/server/payment-settings";
import { testPaypal } from "@/server/paypal";

export const dynamic = "force-dynamic";

/** Kirim contoh email "pesanan diterima" ke kotak masuk operator untuk menguji SMTP. */
async function testMail(admin) {
  if (!mailConfigured()) return { ok: false, message: `Isi ${mailIssues().join(", ")} di hPanel, lalu deploy ulang.` };
  const to = otpRecipient(admin.email);
  try {
    const mail = await buildOrderMail(sampleOrder({ kind: "order", lang: "id" }), "order", { accounts: [] });
    await sendMail({ to, ...mail, subject: `[Uji] ${mail.subject}` });
    return { ok: true, message: `Email contoh terkirim ke ${maskEmail(to)}. Periksa juga folder spam.` };
  } catch (error) {
    console.error(`[admin/pembayaran] email uji gagal: ${error?.code || error?.message}`);
    return { ok: false, message: mailFailure(error) };
  }
}

// /admin/pembayaran: simpan pengaturan ({ settings }), uji koneksi ({ test: "midtrans" | "paypal" }),
// atau kirim email uji ({ test: "mail" }).
export async function POST(request) {
  const { admin, error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request);
  if (!input) return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
  if (input.test === "midtrans") return Response.json(await testMidtrans());
  if (input.test === "paypal") return Response.json(await testPaypal());
  if (input.test === "mail") return Response.json(await testMail(admin));
  try {
    await savePayments(validatePayments(input.settings));
    return Response.json({ ok: true });
  } catch (e) {
    if (e.code) console.error(`[admin/pembayaran] ${e.code}`);
    return Response.json({ error: e.code ? "Database belum bisa diakses. Coba lagi sebentar." : e.message }, { status: e.code ? 503 : 400 });
  }
}
