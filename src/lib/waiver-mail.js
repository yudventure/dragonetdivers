// Salinan formulir selam untuk tamu (email setelah tanda tangan di /waiver, bila tamu mengisi email). Teks dari
// ui.waiver.mail dan ui.waiver.done (src/content/ui.js), kerangka bermerek src/lib/email-layout.js. Murni,
// diuji di tests/waiver.test.js.
import { orderMailText } from "../content/order-mail.js";
import { uiText } from "../content/ui.js";
import { badge, box, colors, esc, FONT, layout, paragraph, plainText, rows, title } from "./email-layout.js";
import { format, intlLocale } from "./i18n.js";

const day = (date, lang) =>
  new Intl.DateTimeFormat(intlLocale[lang] ?? intlLocale.en, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );

const witTime = (iso, lang) =>
  `${new Intl.DateTimeFormat(intlLocale[lang] ?? intlLocale.en, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jayapura" }).format(new Date(iso))} WIT`;

/** { subject, html, text } untuk formulir w (hasil cleanWaiver) bernomor code. */
export function waiverMail(w, { code, lang, base, signedAt, contact = {}, whatsapp = null }) {
  const all = uiText(lang);
  const t = all.waiver;
  const help = orderMailText[lang] ?? orderMailText.en;
  const m = t.mail;
  const host = String(base).replace(/^https?:\/\//, "");
  const subject = format(m.subject, { code });
  const medical = w.clearance ? t.done.clearanceTitle : t.medical.noClearance;
  const details = [
    [m.code, code],
    [t.fields.fullName, w.fullName],
    [m.date, day(w.date, lang)],
    [m.signedAt, witTime(signedAt, lang)],
    [m.medical, medical],
  ];
  const clearance = w.clearance
    ? box(
        `<p style="margin:0 0 6px;font-family:${FONT};font-size:15px;font-weight:800;color:${colors.abyss};">${esc(t.done.clearanceTitle)}</p><p style="margin:0;font-family:${FONT};font-size:14px;line-height:1.6;color:${colors.abyss};">${esc(t.done.clearance)}</p>`,
        { bg: colors.sunriseWash, border: colors.sunrise },
      )
    : "";
  const body = `${title(m.title)}
${paragraph(esc(format(m.hello, { name: w.fullName })))}
${paragraph(esc(m.intro))}
${clearance}
${rows(details, [code])}`;
  const html = layout({
    lang,
    subject,
    preheader: m.intro,
    reference: { label: m.code, value: code },
    badgeHtml: badge(w.clearance ? t.done.clearanceTitle : t.done.title, w.clearance ? "reminder" : "paid"),
    body,
    base,
    contact: { ...contact, whatsapp, whatsappText: format(t.done.chatMessage, { code }) },
    help: { title: help.help, text: format(help.helpText, { email: contact.email ?? "" }), chat: help.chat },
    footer: format(m.footer, { host }),
  });
  const text = plainText([
    format(m.hello, { name: w.fullName }),
    "",
    `${m.title}.`,
    m.intro,
    "",
    w.clearance ? [t.done.clearanceTitle, t.done.clearance, ""] : [],
    details.map(([label, value]) => `${label}  ${value}`),
    "",
    `${help.help} ${format(help.helpText, { email: contact.email ?? "" })}`,
    whatsapp ? `WhatsApp  https://wa.me/${whatsapp}` : null,
    "",
    `Dragonet Divers Raja Ampat · ${host}`,
  ]);
  return { subject, html, text };
}
