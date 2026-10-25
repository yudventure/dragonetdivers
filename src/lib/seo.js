// Google Search Console (permintaan pemilik, Oktober 2026: "siapkan google search console"): kode
// verifikasi tag HTML yang ditempel tim di /admin/google (disimpan di settings baris "site", dipasang di
// <head> lewat app/[lang]/layout.jsx), sitemap.xml (app/sitemap.js), dan robots.txt (app/robots.js).
// Fungsi murni, diuji di tests/seo.test.js.
import { defaultLocale, localeHref, locales } from "./i18n.js";

const TOKEN = /^[A-Za-z0-9_-]{20,100}$/;
const DNS_PREFIX = "google-site-verification=";

/** Isian yang ternyata kode TXT untuk DNS (properti Domain), bukan tag HTML. */
export const isDnsVerification = (value) => typeof value === "string" && value.trim().toLowerCase().startsWith(DNS_PREFIX);

/**
 * Kode verifikasi Google dari isian tim: kodenya saja, atau tag HTML utuh yang disalin dari Search Console
 * (<meta name="google-site-verification" content="..." />). "" bila kosong, null bila bukan kode tag HTML.
 */
export function googleVerificationOf(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  if (isDnsVerification(raw)) return null;
  let code = raw;
  if (raw.startsWith("<")) {
    if (!/name\s*=\s*["']google-site-verification["']/i.test(raw)) return null;
    code = raw.match(/content\s*=\s*["']([^"']*)["']/i)?.[1]?.trim() ?? "";
  }
  return TOKEN.test(code) ? code : null;
}

/** Halaman publik yang didaftarkan ke Google: beranda dan halaman layanan yang tampil. */
export const sitemapPaths = (serviceSlugs) => ["/", ...serviceSlugs.map((slug) => `/services/${slug}`)];

/**
 * Isi sitemap.xml: setiap halaman dalam setiap bahasa, dengan pasangan bahasanya (hreflang) supaya Google
 * menampilkan versi English atau Indonesia sesuai bahasa pencarinya. origin tanpa garis miring akhir.
 */
export function sitemapEntries(origin, serviceSlugs) {
  return sitemapPaths(serviceSlugs).flatMap((path) => {
    const languages = Object.fromEntries(locales.map((lang) => [lang, origin + localeHref(lang, path)]));
    languages["x-default"] = origin + localeHref(defaultLocale, path);
    return locales.map((lang) => ({
      url: origin + localeHref(lang, path),
      changeFrequency: path === "/" ? "weekly" : "monthly",
      priority: path === "/" ? 1 : 0.8,
      alternates: { languages },
    }));
  });
}

/**
 * Isi robots.txt: semua halaman publik boleh dibaca, dashboard tim tidak. Checkout dan halaman pesanan
 * tidak diblokir di sini karena sudah bertanda noindex (Google harus bisa membacanya untuk melihat tanda itu).
 */
export function robotsRules(origin) {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/admin"] }],
    sitemap: `${origin}/sitemap.xml`,
  };
}
