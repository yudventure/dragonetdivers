// Email HTML ke tamu tentang pesanannya, dalam bahasa saat tamu memesan (teks di
// src/content/order-mail.js). Fungsi murni: pesanan, rekening, dan alamat situs dikirim pemanggil
// (src/server/order-mail.js), supaya bisa diuji dan dipratinjau tanpa database.
import { orderMailText } from "../content/order-mail.js";
import { uiText } from "../content/ui.js";
import { formatMoney } from "./currency.js";
import { badge, box, button, colors, esc, escKeep, FONT, heading, layout, paragraph, plainText, rows, title } from "./email-layout.js";
import { format, intlLocale, localeHref } from "./i18n.js";

export const ORDER_MAIL_KINDS = ["order", "reminder", "paid"];
const TONE = { order: "waiting", reminder: "reminder", paid: "paid" };

/** Alamat halaman status pesanan tamu (dengan token rahasia). */
export const orderUrl = (base, order) => `${base}${localeHref(order.lang, `/order/${order.code}`)}?t=${order.token}`;

const witTime = (iso, lang) =>
  `${new Intl.DateTimeFormat(intlLocale[lang], { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jayapura" }).format(new Date(iso))} WIT`;

const diveDay = (date, lang) =>
  new Intl.DateTimeFormat(intlLocale[lang], { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

/**
 * { subject, html, text } untuk satu email. kind: "order" | "reminder" | "paid". accounts = rekening
 * transfer dari /admin/pembayaran, serviceTitle = nama layanan dalam bahasa tamu, contact = { email,
 * address }, whatsapp = nomor WhatsApp (angka saja) atau null.
 */
export function orderMail(kind, { order, base, accounts = [], serviceTitle = "", contact = {}, whatsapp = null }) {
  if (!ORDER_MAIL_KINDS.includes(kind)) throw new Error(`Jenis email tidak dikenal: ${kind}`);
  const lang = order.lang === "id" ? "id" : "en";
  const t = orderMailText[lang];
  const k = t.kinds[kind];
  const ui = uiText(lang);
  const money = (amount) => formatMoney(amount, "IDR", lang);
  const usd = order.amountUsd ? formatMoney(Number(order.amountUsd), "USD", lang, { cents: true }) : "";
  const values = { code: order.code, name: order.name, amount: money(order.amount), usd, email: contact.email ?? "" };
  const due = order.dueAt ? witTime(order.dueAt, lang) : "";
  const link = orderUrl(base, order);
  const transfer = order.method === "transfer";
  const paid = kind === "paid";
  const host = String(base).replace(/^https?:\/\//, "");
  const subject = format(k.subject, values);
  const keep = [order.code]; // kode pesanan tidak dipotong di tanda hubung

  const methodName = ui.order.methodNames[order.method] ?? order.method;
  const paymentType = t.paymentTypes[order.paymentType] ?? "";
  const details = [
    [t.code, order.code],
    [t.service, serviceTitle],
    [t.package, order.packageName],
    [t.date, diveDay(order.date, lang)],
    [t.guests, String(order.guests)],
    [t.certification, order.certification ? (ui.checkout.certifications[order.certification] ?? order.certification) : ""],
    [t.method, paid && paymentType && paymentType !== methodName ? `${methodName} · ${paymentType}` : methodName],
    paid ? [t.paidAt, order.paidAt ? witTime(order.paidAt, lang) : ""] : [t.due, due],
  ];
  const amounts = [
    ...(order.unit === "group" ? [] : [[format(t.price, { price: money(order.unitPrice), guests: order.guests }), money(order.amount)]]),
    [t.total, money(order.amount), true],
    ...(order.method === "paypal" && usd ? [[t.charged, usd]] : []),
  ];

  const next = format(transfer && k.transferNext ? k.transferNext : k.next, { ...values, due });
  const dueBox =
    !paid && due
      ? box(
          `<p style="margin:0 0 6px;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${colors.ember};">${esc(t.due)}</p><p style="margin:0 0 6px;font-family:${FONT};font-size:19px;line-height:1.35;font-weight:800;color:${colors.abyss};">${esc(due)}</p><p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.6;color:${colors.slate};">${esc(t.dueNote)}</p>`,
          { bg: colors.sunriseWash, border: colors.sunrise },
        )
      : "";
  const proof = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(format(t.proofMessage, values))}` : "";
  const transferBlock =
    !paid && transfer && accounts.length
      ? `${heading(t.transferTitle)}${accounts
          .map((a) =>
            box(
              `<p style="margin:0 0 4px;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${colors.slate};">${esc(t.bank)} ${esc(a.bank)}</p><p style="margin:0 0 4px;font-family:${FONT};font-size:22px;line-height:1.3;font-weight:800;letter-spacing:1px;color:${colors.abyss};">${esc(a.number)}</p><p style="margin:0;font-family:${FONT};font-size:14px;color:${colors.abyss};">${esc(t.accountHolder)} <strong>${esc(a.holder)}</strong></p>`,
              { bg: colors.white },
            ),
          )
          .join("")}${paragraph(escKeep(format(t.transferNote, values), keep), `font-size:14px;color:${colors.slate};`)}`
      : "";
  const paypalLine = !paid && order.method === "paypal" && usd ? paragraph(esc(format(t.paypalNote, values)), `font-size:14px;color:${colors.slate};`) : "";
  const actions = `<p style="margin:20px 0 8px;">${button(link, paid || transfer ? t.view : t.open)}${
    proof && transfer && !paid ? `&nbsp; ${button(proof, t.proof, "secondary")}` : ""
  }</p>`;
  const already = kind === "reminder" ? paragraph(esc(k.paidAlready), `font-size:14px;color:${colors.slate};margin-top:10px;`) : "";

  const body = `${title(k.title)}
${paragraph(esc(format(t.hello, values)))}
${paragraph(escKeep(format(k.intro, values), keep))}
${paragraph(escKeep(next, keep))}
${dueBox}
${transferBlock}
${paypalLine}
${actions}
${already}
${heading(t.summary)}
${rows(details, keep)}
<div style="height:12px;line-height:12px;font-size:0;">&nbsp;</div>
${rows(amounts)}`;

  const html = layout({
    lang,
    subject,
    preheader: paid ? format(k.intro, values) : `${t.due} ${due}`,
    reference: { label: t.reference, value: order.code },
    badgeHtml: badge(k.tag, TONE[kind]),
    body,
    base,
    contact: { ...contact, whatsapp, whatsappText: format(t.chatMessage, values) },
    help: { title: t.help, text: format(t.helpText, values), chat: t.chat },
    footer: format(t.footer, { host }),
  });

  const pair = ([label, value]) => (value ? `${label}  ${value}` : null);
  const text = plainText([
    format(t.hello, values),
    "",
    `${k.title}.`,
    format(k.intro, values),
    next,
    !paid && due ? [t.dueNote] : [],
    "",
    !paid && transfer && accounts.length
      ? [t.transferTitle, ...accounts.map((a) => `${a.bank} ${a.number}, ${t.accountHolder} ${a.holder}`), format(t.transferNote, values), ""]
      : [],
    !paid && order.method === "paypal" && usd ? [format(t.paypalNote, values), ""] : [],
    `${paid || transfer ? t.view : t.open}  ${link}`,
    kind === "reminder" ? ["", k.paidAlready] : [],
    "",
    t.summary.toUpperCase(),
    details.map(pair),
    amounts.map(pair),
    "",
    `${t.help} ${format(t.helpText, values)}`,
    whatsapp ? `WhatsApp  https://wa.me/${whatsapp}` : null,
    "",
    `Dragonet Divers Raja Ampat · ${host}`,
  ]);

  return { subject, html, text };
}

/** Pesanan contoh untuk pratinjau email di /admin (tidak pernah dikirim ke tamu). */
export function sampleOrder({ kind = "order", lang = "id", method = "midtrans", now = new Date() } = {}) {
  const day = new Date(now.getTime() + 14 * 86_400_000).toISOString().slice(0, 10);
  return {
    code: "DD-261021-CONTO",
    token: "0".repeat(32),
    lang,
    name: lang === "id" ? "Rani Wijaya" : "Alex Morgan",
    service: "fun-dives",
    packageName: lang === "id" ? "Contoh paket 2 kali menyelam" : "Sample package, 2 dives",
    unit: "person",
    unitPrice: 1_000_000,
    guests: 2,
    amount: 2_000_000,
    amountUsd: method === "paypal" ? "123.08" : null,
    method,
    paymentType: kind === "paid" ? (method === "paypal" ? "paypal" : method === "transfer" ? "bank_transfer" : "qris") : null,
    date: day,
    certification: "open_water",
    dueAt: new Date(now.getTime() + 24 * 3600_000).toISOString(),
    paidAt: kind === "paid" ? now.toISOString() : null,
    status: kind === "paid" ? "paid" : "pending",
  };
}
