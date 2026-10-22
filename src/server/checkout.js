import "server-only";
import { randomBytes } from "node:crypto";
import { CheckoutError, isOverdue, MAX_ITEMS, newOrderCode, nextStatus, paymentOutcome, paypalUsd, summarizeItems, validateCart } from "@/lib/checkout";
import { envText } from "@/lib/env";
import { createThrottle } from "@/lib/login-throttle";
import { availability, poolOf } from "@/lib/modules/calendar";
import { localeHref } from "@/lib/i18n";
import { serviceBySlug } from "@/lib/services";
import { dayBookings } from "./admin-data";
import { isDatabaseConfigured } from "./db-config.js";
import { getUsdIdrRate } from "./exchange-rate";
import { createTransaction, transactionStatus, validSignature } from "./midtrans";
import { later, scheduleReminder, sendOrderMail } from "./order-mail";
import { changeStatus, createOrder, orderByCode, setPaymentDetails } from "./orders";
import { packagesByIds } from "./packages";
import { getPayments, methodStatus, readyMethods } from "./payment-settings";
import { capturePaypalOrder, createPaypalOrder } from "./paypal";

// Alur checkout paket (mengikuti Zanclus): pesanan disimpan dulu sebagai "pending", lalu
//   Midtrans  → tamu dibawa ke halaman bayar Snap; notifikasi Midtrans (bertanda tangan) atau cek
//               status saat tamu kembali menandai lunas
//   PayPal    → tamu menyetujui di PayPal, kembali ke /api/payments/paypal/return, uang diambil
//   Transfer  → tamu melihat rekening di halaman pesanannya; tim menandai lunas di /admin/pesanan
// Total selalu dihitung ulang di server dari paket di database. Tamu menerima email saat pesanan dibuat,
// pengingat bila belum membayar (src/server/reminders.js), dan email lunas (src/server/order-mail.js).

const state = (globalThis.__dragonetCheckout ??= { throttle: createThrottle({ limit: 10, windowMs: 15 * 60_000 }) });

/** Cara bayar yang siap, kurs untuk PayPal, dan pengaturan (rekening, batas waktu). */
export async function paymentOptions() {
  const [settings, rate] = await Promise.all([getPayments(), getUsdIdrRate()]);
  const status = methodStatus(settings, rate);
  return { settings, rate, status, methods: readyMethods(status) };
}

/** Alamat publik situs untuk link kembali dari Midtrans dan PayPal. */
export function siteOrigin(request) {
  try {
    const configured = new URL(envText(process.env.NEXT_PUBLIC_SITE_URL));
    if (configured.protocol === "https:" || configured.protocol === "http:") return configured.origin;
  } catch {} // kosong atau bukan URL: pakai alamat permintaan
  const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || new URL(request.url).protocol.replace(":", "");
  return `${proto}://${host}`;
}

/** Halaman status pesanan untuk tamu (kode + token rahasia). */
export const orderPath = (order) => `${localeHref(order.lang, `/order/${order.code}`)}?t=${order.token}`;

const clientKey = (request) => request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";

/** Isi keranjang dari permintaan; bentuk lama { packageId, guests, date } (satu paket) tetap diterima. */
const cartItems = (input) =>
  Array.isArray(input?.items) ? input.items : input?.packageId != null ? [{ packageId: input.packageId, guests: input.guests, date: input.date }] : [];

/** Simpan pesanan (satu atau beberapa paket) dan buka pembayarannya; mengembalikan { code, redirectUrl }. */
export async function startCheckout(request, input, { lang }) {
  const key = clientKey(request);
  if (state.throttle.blocked(key)) throw new CheckoutError("busy", 429);
  const list = cartItems(input).slice(0, MAX_ITEMS + 1);
  const packages = await packagesByIds(list.map((item) => item?.packageId));
  const { settings, rate, methods } = await paymentOptions();
  const value = validateCart({ ...input, items: list }, { packages, methods });
  await checkAvailability(value.items);
  state.throttle.fail(key); // setiap pesanan dihitung, bukan hanya yang gagal
  const origin = siteOrigin(request);
  const now = new Date();
  const paypal = value.method === "paypal";
  const items = value.items.map(({ pkg, guests, date, amount }) => ({
    packageId: pkg.id,
    service: pkg.service,
    packageName: lang === "id" ? pkg.nameId : pkg.nameEn,
    unit: pkg.unit,
    unitPrice: pkg.price,
    guests,
    date,
    amount,
  }));
  const order = await createUnique(
    (code) => ({
      code,
      token: randomBytes(16).toString("hex"),
      ...summarizeItems(items, lang),
      items,
      amount: value.amount,
      amountUsd: paypal ? paypalUsd(value.amount, rate.idrPerUsd) : null,
      usdRate: paypal ? rate.idrPerUsd : null,
      method: value.method,
      name: value.name,
      email: value.email,
      whatsapp: value.whatsapp,
      certification: value.certification,
      notes: value.notes,
      lang,
      dueAt: new Date(now.getTime() + settings.dueHours * 3600_000),
    }),
    now,
  );
  const back = `${origin}${orderPath(order)}`;
  if (value.method === "transfer") {
    afterOrder(order, now);
    return { code: order.code, redirectUrl: back };
  }
  try {
    const redirectUrl = paypal ? await openPaypal(order, origin) : await openMidtrans(order, { origin, back, dueHours: settings.dueHours });
    afterOrder(order, now);
    return { code: order.code, redirectUrl };
  } catch (error) {
    console.error(`[checkout] ${value.method} gagal untuk ${order.code}: ${error.message}`);
    await changeStatus(order.code, "pending", "failed").catch(() => {});
    throw new CheckoutError("provider", 502);
  }
}

/** Email "pesanan diterima" dan jadwal pengingat bayar, setelah jawaban ke tamu terkirim. */
function afterOrder(order, now) {
  later(async () => {
    await scheduleReminder(order, now);
    await sendOrderMail(order.code, "order");
  });
}

/** Ubah status (bandingkan-lalu-tulis); pesanan yang baru lunas dikirimi email pembayaran diterima. */
async function setStatus(order, to, details) {
  const changed = await changeStatus(order.code, order.status, to, details);
  if (changed && to === "paid") later(() => sendOrderMail(order.code, "paid"));
  return changed;
}

/**
 * Tanggal tutup dan kapasitas harian dari /admin/kalender untuk setiap paket: CheckoutError "closed" atau
 * "full" (dengan urutan paketnya). Paket pesanan ini yang jatuh di tanggal dan kelompok yang sama dianggap
 * satu rombongan, jadi yang dihitung jumlah tamu terbesarnya (sama dengan availability()).
 */
async function checkAvailability(items) {
  if (!isDatabaseConfigured()) return;
  const days = new Map();
  for (const date of new Set(items.map((item) => item.date))) days.set(date, await dayBookings(date));
  for (const [index, item] of items.entries()) {
    const a = availability({ date: item.date, service: item.pkg.service, ...days.get(item.date) });
    if (a.closed) throw new CheckoutError("closed", 409, index);
    const pool = poolOf(item.pkg.service);
    const wanted = Math.max(...items.filter((other) => other.date === item.date && poolOf(other.pkg.service) === pool).map((other) => other.guests));
    if (a.left !== null && wanted > a.left) throw new CheckoutError("full", 409, index);
  }
}

/** Simpan pesanan dengan kode baru; kode kembar (sangat jarang) dicoba ulang dengan kode lain. */
async function createUnique(build, now) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await createOrder(build(newOrderCode(now)));
    } catch (error) {
      if (error.code !== "ER_DUP_ENTRY" || attempt >= 3) throw error;
    }
  }
}

async function openMidtrans(order, { origin, back, dueHours }) {
  // Satu baris per paket; jumlahnya selalu sama dengan total pesanan.
  const lines = order.items.map((item) => ({
    id: `pkg-${item.packageId ?? "x"}-${item.position}`,
    ...(item.unit === "group" ? { price: item.amount, quantity: 1 } : { price: item.unitPrice, quantity: item.guests }),
    name: item.packageName.slice(0, 50),
  }));
  const dates = order.items.map((item) => `${serviceBySlug(item.service, "en")?.title ?? item.service} ${item.date}`).join(", ");
  const snap = await createTransaction(
    {
      transaction_details: { order_id: order.code, gross_amount: order.amount },
      item_details: lines,
      customer_details: { first_name: order.name.slice(0, 50), email: order.email, phone: order.whatsapp },
      custom_field1: dates.slice(0, 255),
      callbacks: { finish: back },
      expiry: { unit: "hours", duration: dueHours },
    },
    { notifyUrl: `${origin}/api/payments/midtrans` },
  );
  await setPaymentDetails(order.code, { redirectUrl: snap.redirect_url });
  return snap.redirect_url;
}

async function openPaypal(order, origin) {
  const back = (path) => `${origin}/api/payments/paypal/${path}?code=${encodeURIComponent(order.code)}`;
  const paypal = await createPaypalOrder({
    orderId: order.code,
    usd: order.amountUsd,
    description: `Dragonet Divers ${order.items.map((item) => `${item.packageName} × ${item.guests}, ${item.date}`).join(" · ")}`,
    returnUrl: back("return"),
    cancelUrl: back("cancel"),
    lang: order.lang,
  });
  await setPaymentDetails(order.code, { redirectUrl: paypal.approveUrl, providerRef: paypal.id });
  return paypal.approveUrl;
}

/** Terapkan status Midtrans (dari notifikasi atau cek status) setelah jumlahnya dicocokkan. */
async function applyMidtrans(order, status) {
  if (Number(status.gross_amount) !== order.amount) throw new Error("MIDTRANS_AMOUNT_MISMATCH");
  const to = nextStatus(order.status, paymentOutcome(status));
  if (to) await setStatus(order, to, { providerRef: status.transaction_id, paymentType: status.payment_type });
  return orderByCode(order.code);
}

/** Notifikasi HTTP Midtrans. "forbidden" bila tanda tangan salah, "ignored" untuk pesanan yang bukan milik situs ini. */
export async function midtransNotification(notification) {
  if (!validSignature(notification)) return "forbidden";
  const order = await orderByCode(String(notification.order_id));
  if (!order || order.method !== "midtrans") return "ignored";
  let status = notification;
  // Pembayaran lunas dicek sekali lagi langsung ke Midtrans sebelum pesanan dikonfirmasi.
  if (paymentOutcome(notification) === "paid") {
    try {
      status = (await transactionStatus(order.code)) ?? notification;
    } catch (error) {
      console.error(`[midtrans] cek status gagal: ${error.message}`);
    }
  }
  await applyMidtrans(order, status);
  return "ok";
}

/** PayPal mengembalikan tamu setelah menyetujui: uang diambil, dicocokkan, pesanan jadi lunas. */
export async function completePaypal(code) {
  const order = await orderByCode(code);
  if (!order || order.method !== "paypal" || !order.providerRef || order.status === "paid") return order;
  let result;
  try {
    result = await capturePaypalOrder(order.providerRef);
  } catch (error) {
    console.error(`[paypal] capture gagal untuk ${code}: ${error.message}`);
    return order;
  }
  const done = result.status === "COMPLETED" && result.captureStatus === "COMPLETED" && result.currency === "USD" && Number(result.usd) >= Number(order.amountUsd);
  if (!done) {
    if (result.status === "COMPLETED") console.error(`[paypal] capture tidak cocok dengan pesanan ${code}`);
    return order;
  }
  const to = nextStatus(order.status, "paid");
  if (to) await setStatus(order, to, { providerRef: result.captureId, paymentType: "paypal" });
  return orderByCode(code);
}

/** Tamu meninggalkan PayPal tanpa membayar. */
export async function cancelPaypal(code) {
  const order = await orderByCode(code);
  if (order?.method === "paypal" && order.status === "pending") await changeStatus(code, "pending", "failed");
  return orderByCode(code);
}

/**
 * Status terbaru saat halaman pesanan dibuka atau tim menekan "Cek status": tanya Midtrans, coba
 * ambil pembayaran PayPal yang sudah disetujui, dan tutup pesanan yang lewat batas waktu.
 */
export async function refreshOrder(order) {
  // Pesanan yang ditutup karena lewat batas waktu tetap dicek: uangnya mungkin masuk di detik terakhir.
  if (!order || !["pending", "expired"].includes(order.status) || (order.status === "expired" && order.method === "transfer")) return order;
  let current = order;
  if (order.method === "midtrans") {
    try {
      const status = await transactionStatus(order.code);
      if (status) current = await applyMidtrans(order, status);
    } catch (error) {
      console.error(`[midtrans] cek status ${order.code} gagal: ${error.message}`);
    }
  } else if (order.method === "paypal" && order.providerRef) {
    current = await completePaypal(order.code);
  }
  if (isOverdue(current)) {
    await changeStatus(current.code, "pending", "expired");
    current = await orderByCode(current.code);
  }
  return current;
}

/** Tim menandai pesanan dari /admin/pesanan: "paid" (transfer masuk) atau "cancelled". */
export async function adminSetStatus(code, to) {
  const order = await orderByCode(code);
  if (!order) throw new Error("Pesanan tidak ditemukan.");
  if (to === "paid" && order.method !== "transfer") throw new Error("Hanya pesanan transfer bank yang ditandai lunas oleh tim; Midtrans dan PayPal dikonfirmasi otomatis.");
  if (to === "cancelled" && order.status === "paid") throw new Error("Pesanan lunas tidak bisa dibatalkan dari sini. Kembalikan dananya lewat penyedia pembayaran.");
  const next = nextStatus(order.status, to);
  if (!next || (to === "cancelled" && order.status !== "pending")) throw new Error("Status pesanan ini tidak bisa diubah ke sana.");
  await setStatus(order, next, to === "paid" ? { paymentType: "bank_transfer" } : {});
  return orderByCode(code);
}
