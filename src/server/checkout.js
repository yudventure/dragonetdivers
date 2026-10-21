import "server-only";
import { randomBytes } from "node:crypto";
import { CheckoutError, isOverdue, newOrderCode, nextStatus, paymentOutcome, paypalUsd, validateCheckout } from "@/lib/checkout";
import { createThrottle } from "@/lib/login-throttle";
import { localeHref } from "@/lib/i18n";
import { serviceBySlug } from "@/lib/services";
import { getUsdIdrRate } from "./exchange-rate";
import { createTransaction, transactionStatus, validSignature } from "./midtrans";
import { changeStatus, createOrder, orderByCode, setPaymentDetails } from "./orders";
import { packageById } from "./packages";
import { getPayments, methodStatus, readyMethods } from "./payment-settings";
import { capturePaypalOrder, createPaypalOrder } from "./paypal";

// Alur checkout paket (mengikuti Zanclus): pesanan disimpan dulu sebagai "pending", lalu
//   Midtrans  → tamu dibawa ke halaman bayar Snap; notifikasi Midtrans (bertanda tangan) atau cek
//               status saat tamu kembali menandai lunas
//   PayPal    → tamu menyetujui di PayPal, kembali ke /api/payments/paypal/return, uang diambil
//   Transfer  → tamu melihat rekening di halaman pesanannya; tim menandai lunas di /admin/pesanan
// Total selalu dihitung ulang di server dari paket di database.

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
    const configured = new URL(process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "");
    if (configured.protocol === "https:" || configured.protocol === "http:") return configured.origin;
  } catch {} // kosong atau bukan URL: pakai alamat permintaan
  const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() || request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || new URL(request.url).protocol.replace(":", "");
  return `${proto}://${host}`;
}

/** Halaman status pesanan untuk tamu (kode + token rahasia). */
export const orderPath = (order) => `${localeHref(order.lang, `/order/${order.code}`)}?t=${order.token}`;

const clientKey = (request) => request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";

/** Simpan pesanan dan buka pembayarannya; mengembalikan { code, redirectUrl }. */
export async function startCheckout(request, input, { lang }) {
  const key = clientKey(request);
  if (state.throttle.blocked(key)) throw new CheckoutError("busy", 429);
  const id = Number(input?.packageId);
  const pkg = Number.isSafeInteger(id) ? await packageById(id, { activeOnly: true }) : null;
  const { settings, rate, methods } = await paymentOptions();
  const value = validateCheckout(input, { pkg, methods });
  state.throttle.fail(key); // setiap pesanan dihitung, bukan hanya yang gagal
  const origin = siteOrigin(request);
  const now = new Date();
  const paypal = value.method === "paypal";
  const order = await createUnique(
    (code) => ({
      code,
      token: randomBytes(16).toString("hex"),
      packageId: pkg.id,
      service: pkg.service,
      packageName: lang === "id" ? pkg.nameId : pkg.nameEn,
      unit: pkg.unit,
      unitPrice: pkg.price,
      guests: value.guests,
      amount: value.amount,
      amountUsd: paypal ? paypalUsd(value.amount, rate.idrPerUsd) : null,
      usdRate: paypal ? rate.idrPerUsd : null,
      method: value.method,
      name: value.name,
      email: value.email,
      whatsapp: value.whatsapp,
      date: value.date,
      certification: value.certification,
      notes: value.notes,
      lang,
      dueAt: new Date(now.getTime() + settings.dueHours * 3600_000),
    }),
    now,
  );
  const back = `${origin}${orderPath(order)}`;
  if (value.method === "transfer") return { code: order.code, redirectUrl: back };
  try {
    const redirectUrl = paypal ? await openPaypal(order, origin) : await openMidtrans(order, { origin, back, dueHours: settings.dueHours });
    return { code: order.code, redirectUrl };
  } catch (error) {
    console.error(`[checkout] ${value.method} gagal untuk ${order.code}: ${error.message}`);
    await changeStatus(order.code, "pending", "failed").catch(() => {});
    throw new CheckoutError("provider", 502);
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
  const service = serviceBySlug(order.service, "en");
  const snap = await createTransaction(
    {
      transaction_details: { order_id: order.code, gross_amount: order.amount },
      item_details: [
        order.unit === "group"
          ? { id: `pkg-${order.packageId}`, price: order.amount, quantity: 1, name: order.packageName.slice(0, 50) }
          : { id: `pkg-${order.packageId}`, price: order.unitPrice, quantity: order.guests, name: order.packageName.slice(0, 50) },
      ],
      customer_details: { first_name: order.name.slice(0, 50), email: order.email, phone: order.whatsapp },
      custom_field1: `${service?.title ?? order.service} ${order.date}`.slice(0, 255),
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
    description: `Dragonet Divers ${order.packageName} × ${order.guests}, ${order.date}`,
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
  if (to) await changeStatus(order.code, order.status, to, { providerRef: status.transaction_id, paymentType: status.payment_type });
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
  if (to) await changeStatus(code, order.status, to, { providerRef: result.captureId, paymentType: "paypal" });
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
  await changeStatus(code, order.status, next, to === "paid" ? { paymentType: "bank_transfer" } : {});
  return orderByCode(code);
}
