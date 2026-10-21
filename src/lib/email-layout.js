// Kerangka HTML email Dragonet Divers (kode OTP admin, email pesanan ke tamu). Email memakai tabel dan
// gaya inline supaya tampil sama di Gmail, Outlook, dan Apple Mail. Warna dari brand/tokens.json,
// dasar putih, satu tombol oranye (mandarin dengan teks abyss) per email. Fungsi murni: alamat situs
// dan kontak dikirim pemanggil.
import tokens from "../../brand/tokens.json" with { type: "json" };

const { brand: b, neutral: n, semantic: s } = tokens.color;
export const colors = {
  teal: b.teal.value,
  tealWash: b["teal-wash"].value,
  mandarin: b.mandarin.value,
  ember: b.ember.value,
  mandarinWash: b["mandarin-wash"].value,
  sunrise: b.sunrise.value,
  sunriseWash: b["sunrise-wash"].value,
  white: n.white.value,
  foam: n.foam.value,
  mist: n.mist.value,
  slate: n.slate.value,
  abyss: n.abyss.value,
  onDark: n["on-dark-muted"].value,
  success: s.success.value,
};

const c = colors;
export const FONT = "'Plus Jakarta Sans','Segoe UI',Arial,Helvetica,sans-serif";
const DISPLAY = "Fredoka,'Plus Jakarta Sans','Trebuchet MS',Arial,sans-serif";

/** Teks aman untuk HTML. */
export const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const table = (inner, style = "") =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;${style}">${inner}</table>`;

export const paragraph = (html, style = "") => `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.65;color:${c.abyss};${style}">${html}</p>`;

export const title = (text) =>
  `<h1 style="margin:14px 0 14px;font-family:${DISPLAY};font-size:28px;line-height:1.2;font-weight:600;color:${c.abyss};">${esc(text)}</h1>`;

/** Judul kecil berhuruf kapital (eyebrow) di atas sebuah bagian. */
export const heading = (text) =>
  `<p style="margin:28px 0 10px;font-family:${FONT};font-size:12px;line-height:1.4;letter-spacing:1.6px;text-transform:uppercase;font-weight:700;color:${c.ember};">${esc(text)}</p>`;

const TONES = {
  waiting: [c.sunriseWash, c.ember, c.sunrise],
  reminder: [c.mandarinWash, c.ember, c.mandarin],
  paid: [c.success, c.white, c.success],
};

/** Label status berbentuk pil. */
export const badge = (text, tone) => {
  const [bg, fg, ring] = TONES[tone] ?? TONES.waiting;
  return `<span style="display:inline-block;padding:6px 14px;border-radius:999px;background:${bg};color:${fg};border:1px solid ${ring};font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;">${esc(text)}</span>`;
};

/** Tombol: "primary" oranye (sekali per email), "secondary" garis teal. */
export const button = (href, label, kind = "primary") => {
  const look =
    kind === "primary"
      ? `background:${c.mandarin};color:${c.abyss};border:2px solid ${c.mandarin};`
      : `background:${c.white};color:${c.teal};border:2px solid ${c.mist};`;
  return `<a href="${esc(href)}" target="_blank" style="display:inline-block;padding:14px 26px;border-radius:999px;font-family:${FONT};font-size:15px;line-height:1.2;font-weight:700;text-decoration:none;${look}">${esc(label)}</a>`;
};

/** Teks aman untuk HTML; kata dalam keep (mis. kode pesanan) tidak dipotong di tanda hubung. */
export const escKeep = (value, keep = []) =>
  keep.filter(Boolean).reduce((html, word) => html.replaceAll(esc(word), `<span style="white-space:nowrap;">${esc(word)}</span>`), esc(value));

/** Daftar label dan nilai; baris tanpa nilai dilewati. strong = baris total. */
export const rows = (pairs, keep = []) =>
  table(
    pairs
      .filter(([, value]) => value)
      .map(([label, value, strong], i) => {
        const line = i ? `border-top:1px solid ${c.mist};` : "";
        return `<tr><td style="padding:11px 16px;${line}font-family:${FONT};font-size:14px;line-height:1.5;color:${c.slate};width:44%;vertical-align:top;">${esc(label)}</td><td style="padding:11px 16px;${line}font-family:${FONT};font-size:${strong ? 17 : 14}px;line-height:1.5;color:${c.abyss};font-weight:${strong ? 800 : 600};vertical-align:top;text-align:right;">${escKeep(value, keep)}</td></tr>`;
      })
      .join(""),
    `border:1px solid ${c.mist};border-radius:14px;background:${c.white};`,
  );

/** Kotak berwarna (batas waktu, rekening, kode OTP). */
export const box = (inner, { bg = c.foam, border = c.mist } = {}) =>
  table(`<tr><td style="padding:18px 20px;background:${bg};border:1px solid ${border};border-radius:14px;font-family:${FONT};">${inner}</td></tr>`, "margin:4px 0 14px;");

/**
 * Halaman email lengkap. base = alamat situs (logo di base/media/email/), contact = { email, address,
 * whatsapp, whatsappText }, help = { title, text, chat } untuk kotak bantuan (opsional).
 */
export function layout({ lang = "en", subject, preheader = "", reference = "", badgeHtml = "", body, base, contact = {}, help, footer = "" }) {
  const host = String(base).replace(/^https?:\/\//, "");
  const wa = contact.whatsapp ? `https://wa.me/${contact.whatsapp}` : "";
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>@media (max-width:480px){.dd-pad{padding-left:20px!important;padding-right:20px!important}.dd-outer{padding:16px 8px!important}}</style>
</head>
<body style="margin:0;padding:0;background:${c.foam};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${c.foam};">${esc(preheader)}</div>
${table(
  `<tr><td class="dd-outer" align="center" style="padding:28px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-collapse:separate;background:${c.white};border:1px solid ${c.mist};border-radius:20px;overflow:hidden;">
<tr><td class="dd-pad" style="padding:22px 32px;border-bottom:1px solid ${c.mist};">
${table(
  `<tr><td style="vertical-align:middle;"><a href="${esc(base)}" target="_blank"><img src="${esc(base)}/media/email/dragonet-divers-lockup.png" width="176" height="46" alt="Dragonet Divers Raja Ampat" style="display:block;border:0;width:176px;height:46px;"></a></td>${
    reference
      ? `<td align="right" style="vertical-align:middle;font-family:${FONT};font-size:12px;line-height:1.5;color:${c.slate};">${esc(reference.label)}<br><span style="font-size:15px;color:${c.abyss};font-weight:700;letter-spacing:.4px;">${esc(reference.value)}</span></td>`
      : ""
  }</tr>`,
)}
</td></tr>
<tr><td style="height:5px;line-height:5px;font-size:0;background:${c.teal};">&nbsp;</td></tr>
<tr><td class="dd-pad" style="padding:30px 32px 10px;">
${badgeHtml}
${body}
</td></tr>
${
  help
    ? `<tr><td class="dd-pad" style="padding:6px 32px 30px;">${box(
        `<p style="margin:0 0 4px;font-family:${FONT};font-size:15px;font-weight:700;color:${c.abyss};">${esc(help.title)}</p><p style="margin:0${wa ? " 0 14px" : ""};font-family:${FONT};font-size:14px;line-height:1.6;color:${c.slate};">${esc(help.text)}</p>${wa ? button(contact.whatsappText ? `${wa}?text=${encodeURIComponent(contact.whatsappText)}` : wa, help.chat, "secondary") : ""}`,
        { bg: c.tealWash, border: c.tealWash },
      )}</td></tr>`
    : ""
}
<tr><td class="dd-pad" style="background:${c.abyss};padding:24px 32px;font-family:${FONT};font-size:13px;line-height:1.7;color:${c.onDark};">
<strong style="color:${c.white};font-size:14px;">Dragonet Divers Raja Ampat</strong><br>
${(contact.address ?? []).map(esc).join("<br>")}${contact.address?.length ? "<br>" : ""}
${contact.email ? `<a href="mailto:${esc(contact.email)}" style="color:${c.white};text-decoration:none;">${esc(contact.email)}</a> &nbsp;·&nbsp; ` : ""}<a href="${esc(base)}" target="_blank" style="color:${c.white};text-decoration:none;">${esc(host)}</a>
${footer ? `<p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:${c.onDark};">${esc(footer)}</p>` : ""}
</td></tr>
</table>
</td></tr>`,
  `background:${c.foam};`,
)}
</body>
</html>`;
}

/** Gabungkan baris teks email biasa: baris kosong ganda dirapatkan. */
export const plainText = (lines) =>
  lines
    .flat()
    .filter((line) => line !== null && line !== undefined && line !== false)
    .filter((line, i, all) => line !== "" || (i > 0 && all[i - 1] !== ""))
    .join("\n")
    .trim();
