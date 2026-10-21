import "server-only";
import { envText } from "@/lib/env";

// PayPal Checkout (Orders API v2), diambil dari Zanclus. Key dari hPanel: PAYPAL_CLIENT_ID dan
// PAYPAL_CLIENT_SECRET (developer.paypal.com → Apps & Credentials), PAYPAL_MODE=live untuk
// pembayaran sungguhan (selain itu sandbox). PAYPAL_API_URL hanya untuk uji lokal. PayPal tidak
// menerima Rupiah, jadi pesanan ditagih dalam dolar AS dengan kurs hari itu.

// "-" berarti belum diisi (file impor .env, src/lib/env.js).
const clean = (value) =>
  envText(
    String(value ?? "")
      .trim()
      .replace(/^["']|["']$/g, ""),
  );
const clientId = () => clean(process.env.PAYPAL_CLIENT_ID);
const secret = () => clean(process.env.PAYPAL_CLIENT_SECRET);
export const paypalConfigured = () => clientId().length > 0 && secret().length > 0;
export const paypalLive = () => clean(process.env.PAYPAL_MODE).toLowerCase() === "live";
export const paypalKeyEnding = () => (clientId().length > 12 ? clientId().slice(-4) : "");

function base() {
  const custom = process.env.PAYPAL_API_URL;
  if (custom) return custom.replace(/\/+$/, "");
  return paypalLive() ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

const state = (globalThis.__dragonetPaypal ??= { lastError: null, token: null });
/** Jawaban terakhir yang ditolak PayPal, ditampilkan di /admin/pembayaran. */
export const lastPaypalError = () => state.lastError;
const remember = (stage, status, message) => {
  state.lastError = { at: new Date().toISOString(), stage, status, message: String(message ?? "").slice(0, 300) };
};
const paypalMessage = (data) => [data?.error_description, data?.message, data?.details?.[0]?.description].filter(Boolean).join(" ");

async function call(path, { method = "GET", body, token, stage }) {
  let response;
  try {
    response = await fetch(base() + path, {
      method,
      headers: token
        ? { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}` }
        : {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${clientId()}:${secret()}`).toString("base64")}`,
          },
      body,
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    remember(stage, 0, `Tidak bisa terhubung ke PayPal. ${error.message}`);
    throw error;
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    remember(stage, response.status, paypalMessage(data));
    throw Object.assign(new Error(`PAYPAL_${stage.toUpperCase()}_${response.status} ${paypalMessage(data)}`), { status: response.status });
  }
  return data;
}

// Access token disimpan sampai sesaat sebelum habis.
async function accessToken() {
  const kept = state.token;
  if (kept && kept.key === clientId() && kept.until > Date.now()) return kept.token;
  const data = await call("/v1/oauth2/token", { method: "POST", body: "grant_type=client_credentials", stage: "token" });
  state.token = { key: clientId(), token: data.access_token, until: Date.now() + Math.max(60, (data.expires_in ?? 300) - 60) * 1000 };
  return data.access_token;
}

/** Buat pesanan yang disetujui tamu di PayPal; mengembalikan { id, approveUrl }. */
export async function createPaypalOrder({ orderId, usd, description, returnUrl, cancelUrl, lang }) {
  const token = await accessToken();
  const data = await call("/v2/checkout/orders", {
    method: "POST",
    token,
    stage: "order",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderId,
          custom_id: orderId,
          invoice_id: orderId,
          description: description.slice(0, 127),
          amount: { currency_code: "USD", value: usd },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "Dragonet Divers",
            locale: lang === "id" ? "id-ID" : "en-US",
            shipping_preference: "NO_SHIPPING",
            user_action: "PAY_NOW",
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        },
      },
    }),
  });
  const approveUrl = data.links?.find((l) => ["payer-action", "approve"].includes(l.rel))?.href;
  if (!data.id || !approveUrl) {
    remember("order", 0, "PayPal tidak mengirim link persetujuan.");
    throw new Error("PAYPAL_NO_APPROVE_LINK");
  }
  state.lastError = null;
  return { id: data.id, approveUrl };
}

/** Ambil uang pesanan yang sudah disetujui. Pesanan yang sudah diambil menjawab dengan capture-nya. */
export async function capturePaypalOrder(paypalId) {
  const token = await accessToken();
  let data;
  try {
    data = await call(`/v2/checkout/orders/${encodeURIComponent(paypalId)}/capture`, { method: "POST", token, stage: "capture", body: "{}" });
  } catch (error) {
    if (error.status !== 422) throw error;
    data = await call(`/v2/checkout/orders/${encodeURIComponent(paypalId)}`, { token, stage: "capture" });
  }
  const capture = data.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    status: data.status,
    captureStatus: capture?.status ?? "",
    usd: capture?.amount?.value ?? "",
    currency: capture?.amount?.currency_code ?? "",
    captureId: capture?.id ?? "",
  };
}

/** Minta access token: membuktikan Client ID dan Secret. */
export async function testPaypal() {
  if (!paypalConfigured()) return { ok: false, reason: "missing" };
  state.token = null;
  try {
    await accessToken();
    state.lastError = null;
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error.status === 401 ? "key" : error.status ? "other" : "network",
      status: error.status ?? 0,
      message: state.lastError?.message ?? error.message,
    };
  }
}
