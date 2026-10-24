// Halaman perawatan berupa HTML mandiri (gaya inline, warna dari brand/tokens.json) untuk app/maintenance,
// yang menjawab dengan status 503 supaya mesin pencari kembali lagi nanti. Fungsi murni.
import { maintenanceText } from "../content/maintenance.js";
import { colors, esc } from "./email-layout.js";
import { chooseLangHref, format, localeHref } from "./i18n.js";

const c = colors;
const FONT = "'Plus Jakarta Sans','Segoe UI',system-ui,-apple-system,sans-serif";
const DISPLAY = "Fredoka,'Plus Jakarta Sans','Trebuchet MS',system-ui,sans-serif";

/** "21 Oktober 2026 pukul 18.00" dari "2026-10-21T18:00" (waktu WIT apa adanya). */
export function untilLabel(until, lang) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(until ?? "")) return "";
  const date = new Date(`${until}:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-US", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(date);
}

/**
 * kind: "site" (seluruh website tutup) atau "page" (satu halaman). path = alamat yang diminta tanpa awalan
 * bahasa, untuk tautan ganti bahasa. whatsapp = nomor (angka) atau null.
 */
export function maintenanceHtml({ kind = "site", lang = "en", path = "/", message = "", until = "", whatsapp = null, email = "", previewExit = "" }) {
  const t = maintenanceText[lang === "id" ? "id" : "en"];
  const title = kind === "page" ? t.pageTitle : t.siteTitle;
  const text = message || (kind === "page" ? t.pageText : t.siteText);
  const when = untilLabel(until, lang);
  const other = lang === "id" ? "en" : "id";
  const link = (href, label, solid = false) =>
    `<a href="${esc(href)}" style="display:inline-block;margin:6px 6px 0 0;padding:12px 22px;border-radius:999px;font-weight:700;text-decoration:none;${
      solid ? `background:${c.teal};color:${c.white};` : `background:${c.white};color:${c.teal};border:1.5px solid ${c.mist};`
    }">${esc(label)}</a>`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(title)} · Dragonet Divers</title>
<link rel="icon" href="/icon.png">
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;min-height:100vh;background:${c.foam};font-family:${FONT};color:${c.abyss};display:flex;align-items:center;justify-content:center;padding:24px 16px;box-sizing:border-box;">
<main style="width:100%;max-width:560px;background:${c.white};border:1px solid ${c.mist};border-radius:24px;padding:36px 28px;box-sizing:border-box;text-align:center;">
<img src="/media/email/dragonet-divers-lockup.png" width="176" height="46" alt="Dragonet Divers Raja Ampat" style="display:block;margin:0 auto 24px;width:176px;height:auto;">
<div style="height:4px;width:64px;margin:0 auto 24px;border-radius:4px;background:${c.teal};"></div>
<h1 style="margin:0 0 12px;font-family:${DISPLAY};font-weight:600;font-size:30px;line-height:1.2;">${esc(title)}</h1>
<p style="margin:0 0 12px;font-size:16px;line-height:1.65;color:${c.slate};">${esc(text)}</p>
${when ? `<p style="margin:0 0 16px;font-size:14px;font-weight:700;color:${c.ember};">${esc(format(t.until, { until: when }))}</p>` : ""}
${
  whatsapp || email
    ? `<p style="margin:24px 0 4px;font-size:14px;font-weight:700;">${esc(t.contact)}</p><div>${whatsapp ? link(`https://wa.me/${whatsapp}`, t.whatsapp, true) : ""}${
        email ? link(`mailto:${email}`, format(t.email, { email })) : ""
      }</div>`
    : ""
}
<p style="margin:28px 0 0;font-size:14px;">${kind === "page" ? `<a href="${esc(localeHref(lang, "/"))}" style="color:${c.teal};font-weight:700;">${esc(t.home)}</a> &nbsp;·&nbsp; ` : ""}<a href="${esc(chooseLangHref(other, path))}" style="color:${c.teal};font-weight:700;">${esc(t.language)}</a></p>
${previewExit ? `<p style="margin:20px 0 0;font-size:13px;color:${c.slate};">Pratinjau pengunjung · <a href="${esc(previewExit)}" style="color:${c.teal};font-weight:700;">Kembali ke tampilan admin</a></p>` : ""}
</main>
</body>
</html>`;
}
