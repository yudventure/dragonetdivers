// Mata uang tampilan: Rupiah (IDR) dan Dolar AS (USD). Harga ditulis dalam Rupiah; dalam mode USD
// dikonversi dengan kurs harian. Kurs referensi Bank Sentral Eropa (ECB) lewat Frankfurter (gratis,
// tanpa API key, diperbarui tiap hari kerja), atau angka tetap dari variabel server USD_IDR_RATE.
// File ini murni (tanpa Next.js) supaya bisa diuji; pengambilan dengan cache di src/server/exchange-rate.js.
import { intlLocale } from "./i18n.js";

export const currencies = ["USD", "IDR"];
export const RATE_URL = "https://api.frankfurter.dev/v1/latest?base=USD&symbols=IDR";
export const RATE_REFRESH_SECONDS = 12 * 3600;

/** Pilihan awal sebelum tamu memilih: English → USD, Indonesia → IDR. */
export const defaultCurrency = (lang) => (lang === "id" ? "IDR" : "USD");

export const isCurrency = (value) => currencies.includes(value);

// Kurs yang masuk akal untuk Rupiah per Dolar; angka di luar ini dianggap salah isi atau data rusak.
const sensible = (n) => Number.isFinite(n) && n >= 1000 && n <= 100000;

/** Jawaban Frankfurter ({ base: "USD", date, rates: { IDR } }) → { idrPerUsd, date, source } atau null. */
export function parseRate(body) {
  const idrPerUsd = Number(body?.rates?.IDR);
  if (body?.base !== "USD" || !sensible(idrPerUsd)) return null;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date ?? "") ? body.date : null;
  return { idrPerUsd, date, source: "ecb" };
}

/** USD_IDR_RATE dari hPanel (mis. "16250" atau "16.250"), atau null bila kosong atau tidak masuk akal. */
export function rateFromEnv(value) {
  const raw = value?.trim().replace(/[.,\s](?=\d{3}\b)/g, "");
  if (!raw) return null;
  const idrPerUsd = Number(raw.replace(",", "."));
  return sensible(idrPerUsd) ? { idrPerUsd, date: null, source: "manual" } : null;
}

/** Jumlah Rupiah dalam mata uang pilihan; null bila USD diminta tanpa kurs. */
export function convert(idr, currency, rate) {
  if (currency === "IDR") return idr;
  return rate?.idrPerUsd ? idr / rate.idrPerUsd : null;
}

/**
 * "Rp 1.500.000" / "IDR 1,500,000" atau "US$92" / "US$ 92", mengikuti bahasa halaman. cents: true untuk
 * jumlah dolar yang benar-benar ditagih (PayPal), mis. "US$184.62"; tanpanya dolar dibulatkan sebagai perkiraan.
 */
export function formatMoney(amount, currency, lang = "en", { cents = false } = {}) {
  const locale = intlLocale[lang] ?? intlLocale.en;
  if (currency === "IDR") {
    return new Intl.NumberFormat(locale, { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
  }
  const digits = cents || amount < 10 ? 2 : 0;
  const number = new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount);
  return lang === "id" ? `US$ ${number}` : `US$${number}`;
}

/** Tanggal kurs "2026-10-20" → "Oct 20, 2026" / "20 Okt 2026". */
export const formatRateDate = (date, lang = "en") =>
  date
    ? new Date(`${date}T12:00:00Z`).toLocaleDateString(intlLocale[lang] ?? intlLocale.en, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    : null;
