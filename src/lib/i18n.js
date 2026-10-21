// Dua bahasa situs publik: English di akar (/, /services/fun-dives) dan Bahasa Indonesia di bawah /id
// (/id, /id/services/fun-dives). Halaman ada di app/[lang]; proxy.js menulis ulang alamat English ke
// /en/... di belakang layar. Teks antarmuka di src/content/ui.js. Admin (/admin) hanya Bahasa Indonesia.
// File ini murni (tanpa Next.js) karena dipakai proxy.js dan diuji di tests/i18n.test.js.

export const locales = ["en", "id"];
export const defaultLocale = "en";
export const localeNames = { en: "English", id: "Bahasa Indonesia" };
export const intlLocale = { en: "en-US", id: "id-ID" };
export const ogLocale = { en: "en_US", id: "id_ID" };

export const isLocale = (value) => locales.includes(value);

/** Tautan di dalam situs (path, query, hash) untuk bahasa itu: "/#faq" → "/id#faq" untuk id. */
export function localeHref(lang, href = "/") {
  if (lang === defaultLocale || !href.startsWith("/") || href.startsWith("//")) return href;
  const cut = href.search(/[?#]/);
  const path = cut === -1 ? href : href.slice(0, cut);
  const rest = cut === -1 ? "" : href.slice(cut);
  return `/${lang}${path === "/" ? "" : path}${rest}`;
}

/** Alamat yang sama di setiap bahasa (untuk hreflang dan tombol EN / ID). path tanpa awalan bahasa. */
export const alternates = (path = "/") => Object.fromEntries(locales.map((lang) => [lang, localeHref(lang, path)]));

/**
 * Keputusan proxy untuk sebuah path:
 *   /en, /en/...  → { redirect } ke alamat tanpa /en (English cukup satu alamat)
 *   /id, /id/...  → {} diteruskan apa adanya
 *   selain itu    → { rewrite: "/en" + path } ke halaman English
 */
export function localeRoute(pathname) {
  const [, first] = pathname.split("/");
  if (first === defaultLocale) return { redirect: pathname.slice(defaultLocale.length + 1) || "/" };
  if (isLocale(first)) return {};
  return { rewrite: `/${defaultLocale}${pathname === "/" ? "" : pathname}` };
}

/** Isi {nama} di teks dengan nilai: format("Tanya soal {x}", { x: "kursus" }). */
export const format = (template, values = {}) => template.replace(/\{(\w+)\}/g, (all, key) => (key in values ? String(values[key]) : all));
