// Email kode OTP "Lupa password" admin (Bahasa Indonesia, seperti seluruh /admin).
import { box, colors, esc, FONT, layout, paragraph, plainText, title } from "./email-layout.js";
import { contact, site } from "./site.js";

export function otpMail({ code, account, minutes, base = site.url, now = new Date() }) {
  const when = `${new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jayapura" }).format(now)} WIT`;
  const subject = `${code} kode untuk mengganti password admin Dragonet Divers`;
  const intro = `Seseorang meminta password baru untuk akun operator ${account} di dashboard Dragonet Divers. Masukkan kode ini di halaman masuk.`;
  const valid = `Kode berlaku ${minutes} menit dan hanya bisa dipakai sekali. Diminta pada ${when}.`;
  const ignore = "Kalau kamu tidak meminta kode ini, abaikan email ini. Password tidak berubah tanpa kode ini.";
  const body = `${title("Kode untuk password baru")}
${paragraph(esc(intro))}
${box(`<p style="margin:0;font-family:${FONT};font-size:34px;line-height:1.2;font-weight:800;letter-spacing:10px;color:${colors.abyss};text-align:center;">${esc(code)}</p>`)}
${paragraph(esc(valid), `font-size:14px;color:${colors.slate};`)}
${paragraph(esc(ignore), `font-size:14px;color:${colors.slate};`)}`;
  return {
    subject,
    html: layout({ lang: "id", subject, preheader: valid, body, base, contact: { email: contact.email, address: contact.address } }),
    text: plainText(["Halo,", "", intro, "", code, "", valid, ignore, "", `${site.shortName} · ${base.replace(/^https?:\/\//, "")}`]),
  };
}
