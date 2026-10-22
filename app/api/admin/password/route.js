import { maskEmail, passwordProblem } from "@/lib/admin-password";
import { checkOtp, dropOtp, issueOtp, OTP_MINUTES, OtpError } from "@/lib/otp";
import { createThrottle } from "@/lib/login-throttle";
import { adminConfig, isAdminEmail, readJson, replacePassword, sameOrigin } from "@/server/admin-auth";
import { isDatabaseConfigured } from "@/server/db-config";
import { mailConfigured, mailFailure, mailIssues, otpRecipient, sendMail } from "@/server/mailer";
import { otpMail } from "@/lib/otp-mail";
import { getSiteSettings } from "@/server/site-settings";

export const dynamic = "force-dynamic";

// "Lupa password" di halaman masuk /admin (src/admin/AdminLogin.jsx), mengikuti Zanclus:
//   { action: "send", email }                    → kode 6 angka ke email operator
//   { action: "reset", email, code, password }   → password baru disimpan, browser ini langsung masuk
// Jawaban "send" tidak pernah memberi tahu apakah email itu email operator.

const headers = { "Cache-Control": "no-store" };
const reply = (body, status = 200) => Response.json(body, { status, headers });
const throttle = (globalThis.__dragonetForgot ??= createThrottle({ limit: 10, windowMs: 15 * 60_000 }));
const clientKey = (request) => request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";

const SENT = "Kalau email itu email operator, kode 6 angka sudah dikirim ke kotak masuk pemulihannya. Periksa juga folder spam.";

export async function POST(request) {
  await getSiteSettings(); // email dan kontak dari /admin/kontak
  if (!sameOrigin(request)) return reply({ error: "Asal permintaan tidak valid." }, 403);
  if (adminConfig().issues.length) return reply({ error: "Login operator belum diatur. Isi ADMIN_EMAIL dan ADMIN_PASSWORD di hPanel." }, 503);
  const data = await readJson(request, 4000);
  const email = typeof data?.email === "string" ? data.email.slice(0, 250).trim() : "";
  if (!email || !["send", "reset"].includes(data?.action)) return reply({ error: "Data tidak valid." }, 400);
  const key = clientKey(request);
  if (throttle.blocked(key)) return reply({ error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." }, 429);
  throttle.fail(key); // setiap permintaan dihitung

  if (!mailConfigured()) {
    return reply({ error: `Pengiriman email belum diatur. Isi ${mailIssues().join(", ")} di hPanel, lalu deploy ulang.` }, 503);
  }
  if (!isDatabaseConfigured()) return reply({ error: "Database belum terhubung, jadi password baru belum bisa disimpan. Isi pengaturan MYSQL_* di hPanel." }, 503);

  try {
    if (data.action === "send") {
      if (!isAdminEmail(email)) return reply({ ok: true, message: SENT, minutes: OTP_MINUTES });
      const config = adminConfig();
      const to = otpRecipient(config.email);
      const code = issueOtp(config.email);
      try {
        await sendMail({ to, ...otpMail({ code, account: config.email, minutes: OTP_MINUTES }) });
      } catch (error) {
        dropOtp(config.email);
        console.error(`[admin] email OTP gagal: ${error?.code || error?.message}`);
        return reply({ error: mailFailure(error) }, 502);
      }
      console.info(`[admin] kode OTP dikirim ke ${maskEmail(to)}`);
      return reply({ ok: true, message: SENT, minutes: OTP_MINUTES });
    }

    // reset
    const password = typeof data.password === "string" ? data.password : "";
    const problem = passwordProblem(email, password);
    if (problem) return reply({ error: problem, field: "password" }, 400);
    if (!isAdminEmail(email)) throw new OtpError("Kode sudah tidak berlaku. Minta kode baru.");
    checkOtp(adminConfig().email, data.code);
    await replacePassword(request, password);
    throttle.clear(key);
    return reply({ ok: true });
  } catch (error) {
    if (error instanceof OtpError) return reply({ error: error.message, field: "code" }, error.status);
    console.error(`[admin] lupa password: ${error?.code || error?.message}`);
    return reply({ error: "Password baru belum bisa disimpan. Coba lagi sebentar lagi." }, 500);
  }
}
