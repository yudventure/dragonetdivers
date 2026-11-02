import { defaultAgreement } from "@/content/waiver-agreement";
import { uiText } from "@/content/ui";
import { sameText } from "@/lib/admin-session";
import { witToday } from "@/lib/checkout";
import { format, isLocale } from "@/lib/i18n";
import { createThrottle } from "@/lib/login-throttle";
import { contact, site, whatsappNumber } from "@/lib/site";
import { cleanWaiver, diversIn, SIGNATURE_MAX, waiverCode, WaiverError } from "@/lib/waiver";
import { waiverMail } from "@/lib/waiver-mail";
import { readJson, sameOrigin } from "@/server/admin-auth";
import { mailConfigured, sendMail } from "@/server/mailer";
import { later } from "@/server/order-mail";
import { orderByCode } from "@/server/orders";
import { getSiteSettings } from "@/server/site-settings";
import { createWaiver, getAgreement } from "@/server/waivers";

export const dynamic = "force-dynamic";

// Kirim formulir selam dari /waiver: { ...isian, medical, signature (PNG base64), order?, token? }.
// Diperiksa ulang di server (cleanWaiver, src/lib/waiver.js), disimpan di tabel waivers bersama salinan teks
// perjanjian yang disetujui, lalu salinan dikirim ke email tamu bila diisi. Pesanan hanya ditautkan bila
// token rahasianya cocok dan pesanannya berisi layanan selam. Paling banyak 30 formulir per jam per alamat IP
// (satu rombongan sering mengisi dari satu ponsel).
const state = (globalThis.__ddWaiver ??= { throttle: createThrottle({ limit: 30, windowMs: 60 * 60_000 }) });
const noStore = { "Cache-Control": "no-store" };
const clientKey = (request) => request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";

export async function POST(request) {
  await getSiteSettings(); // email dan WhatsApp dari /admin/kontak
  const asked = new URL(request.url).searchParams.get("lang");
  const lang = isLocale(asked) ? asked : "en";
  const errors = uiText(lang).waiver.errors;
  const fail = (field, status) =>
    Response.json({ error: field, message: format(errors[field.split(".")[0]] ?? errors.server, { email: contact.email }) }, { status, headers: noStore });
  if (!sameOrigin(request)) return fail("server", 403);
  const key = clientKey(request);
  if (state.throttle.blocked(key)) return fail("busy", 429);
  const input = await readJson(request, SIGNATURE_MAX + 40_000);
  if (!input) return fail("server", 400);

  let agreement;
  try {
    agreement = await getAgreement();
  } catch (error) {
    console.error(`[formulir] teks perjanjian tidak terbaca: ${error.code ?? error.message}`);
    return fail("server", 503);
  }
  const english = agreement.en || defaultAgreement;
  const agreed = lang === "id" && agreement.id ? `${english}\n\n---\n\n${agreement.id}` : english;

  let waiver;
  try {
    waiver = cleanWaiver(input, { today: witToday(), agreement: true });
  } catch (error) {
    if (error instanceof WaiverError) return fail(error.field, 400);
    throw error;
  }
  if (waiver.order) {
    const order = await orderByCode(waiver.order).catch(() => null);
    if (!order || typeof input.token !== "string" || !sameText(order.token, input.token) || diversIn(order.items) === 0) waiver.order = "";
  }

  const ip = key === "local" ? null : key;
  let code;
  for (let attempt = 0; attempt < 3; attempt++) {
    code = waiverCode();
    try {
      await createWaiver(code, waiver, { lang, agreement: agreed, ip, userAgent: request.headers.get("user-agent") });
      break;
    } catch (error) {
      if (error?.code === "ER_DUP_ENTRY" && attempt < 2) continue;
      console.error(`[formulir] tidak tersimpan: ${error.code ?? error.message}`);
      return fail("server", 503);
    }
  }
  state.throttle.fail(key); // setiap formulir dihitung

  const copy = Boolean(waiver.email) && mailConfigured();
  if (copy) {
    const signedAt = new Date().toISOString();
    later(() =>
      sendMail({
        to: waiver.email,
        ...waiverMail(waiver, { code, lang, base: site.url, signedAt, contact: { email: contact.email, address: contact.address }, whatsapp: whatsappNumber() }),
      }),
    );
  }
  return Response.json({ code, clearance: waiver.clearance, copy: copy ? waiver.email : "" }, { status: 201, headers: noStore });
}
