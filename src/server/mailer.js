import "server-only";
import nodemailer from "nodemailer";
import { envText } from "@/lib/env";
import { contact, site } from "@/lib/site";

// Email dari website (kode OTP admin, email pesanan ke tamu) lewat akun SMTP di hPanel, sama dengan
// Zanclus. Email Hostinger: SMTP_HOST=smtp.hostinger.com, SMTP_PORT=465. Port 465 memakai SSL,
// port lain (587) memakai STARTTLS. "-" berarti belum diisi (src/lib/env.js).

const unquote = (value) =>
  envText(
    String(value ?? "")
      .trim()
      .replace(/^(["'])(.*)\1$/s, "$2"),
  );
const env = (name) => unquote(process.env[name]);

/** Nama variabel SMTP yang masih kosong. */
export function mailIssues() {
  return ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter((name) => !env(name));
}
export const mailConfigured = () => mailIssues().length === 0;

/** Pengirim yang dilihat penerima: SMTP_FROM, atau "Dragonet Divers" <SMTP_USER>. */
export const mailSender = () => env("SMTP_FROM") || (env("SMTP_USER") ? `"${site.shortName}" <${env("SMTP_USER")}>` : "");

/** Ke mana kode OTP admin dikirim: ADMIN_OTP_EMAIL, atau email operator itu sendiri. */
export const otpRecipient = (adminEmail) => env("ADMIN_OTP_EMAIL") || adminEmail;

export async function sendMail({ to, subject, text, html, replyTo = contact.email }) {
  const port = Number(env("SMTP_PORT")) || 465;
  const transport = nodemailer.createTransport({
    host: env("SMTP_HOST"),
    port,
    secure: port === 465,
    auth: { user: env("SMTP_USER"), pass: env("SMTP_PASS") },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
  });
  await transport.sendMail({ from: mailSender(), to, subject, text, html, ...(replyTo ? { replyTo } : {}) });
}

/** Alasan pengiriman gagal, dengan kata-kata yang bisa ditindaklanjuti pemilik. */
export function mailFailure(error) {
  const code = error?.code || "";
  if (code === "EAUTH" || error?.responseCode === 535) return "Server email menolak login SMTP. Periksa SMTP_USER dan SMTP_PASS di hPanel.";
  if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "EDNS", "ECONNREFUSED"].includes(code)) {
    return "Server email tidak bisa dihubungi. Periksa SMTP_HOST dan SMTP_PORT di hPanel.";
  }
  if (code === "EENVELOPE") return "Alamat penerima atau pengirim ditolak server email. Periksa SMTP_FROM dan alamat tujuannya.";
  return "Email belum bisa dikirim. Periksa pengaturan SMTP di hPanel.";
}
