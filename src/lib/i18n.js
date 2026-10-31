// Empat bahasa situs publik: English di akar (/, /services/fun-dives), lalu Bahasa Indonesia, Mandarin
// (Tionghoa Sederhana), dan Korea di bawah /id, /zh, dan /ko (permintaan pemilik akhir Oktober 2026 untuk
// zh dan ko). Halaman ada di app/[lang]; proxy.js menulis ulang alamat English ke /en/... di belakang
// layar. Teks antarmuka di src/content/ui.js (en, id) dan src/content/locales/{zh,ko}.js. Admin (/admin)
// hanya Bahasa Indonesia. File ini murni (tanpa Next.js) karena dipakai proxy.js dan diuji di
// tests/i18n.test.js.

export const locales = ["en", "id", "zh", "ko"];
export const defaultLocale = "en";
/** Nama bahasa dalam bahasanya sendiri (daftar pilihan bahasa) dan singkatannya (tombol header). */
export const localeNames = { en: "English", id: "Bahasa Indonesia", zh: "简体中文", ko: "한국어" };
export const localeShort = { en: "EN", id: "ID", zh: "中文", ko: "한국어" };
/** Nama bahasa dalam Bahasa Indonesia untuk dashboard /admin. */
export const localeNamesId = { en: "English", id: "Indonesia", zh: "Mandarin", ko: "Korea" };
export const intlLocale = { en: "en-US", id: "id-ID", zh: "zh-CN", ko: "ko-KR" };
export const ogLocale = { en: "en_US", id: "id_ID", zh: "zh_CN", ko: "ko_KR" };
/** Kode bahasa untuk <html lang> dan hreflang (zh-Hans supaya peramban memakai huruf Tionghoa Sederhana). */
export const htmlLang = { en: "en", id: "id", zh: "zh-Hans", ko: "ko" };

export const isLocale = (value) => locales.includes(value);

/** Tautan di dalam situs (path, query, hash) untuk bahasa itu: "/#faq" → "/id#faq" untuk id. */
export function localeHref(lang, href = "/") {
  if (lang === defaultLocale || !href.startsWith("/") || href.startsWith("//")) return href;
  const cut = href.search(/[?#]/);
  const path = cut === -1 ? href : href.slice(0, cut);
  const rest = cut === -1 ? "" : href.slice(cut);
  return `/${lang}${path === "/" ? "" : path}${rest}`;
}

/** Alamat yang sama di setiap bahasa, berkunci kode hreflang (metadata halaman). path tanpa awalan bahasa. */
export const alternates = (path = "/") => Object.fromEntries(locales.map((lang) => [htmlLang[lang], localeHref(lang, path)]));

/**
 * Keputusan proxy untuk sebuah path:
 *   /en, /en/...  → { redirect } ke alamat tanpa /en (English cukup satu alamat)
 *   /id, /zh, /ko (dan di bawahnya) → {} diteruskan apa adanya
 *   selain itu    → { rewrite: "/en" + path } ke halaman English
 */
export function localeRoute(pathname) {
  const [, first] = pathname.split("/");
  if (first === defaultLocale) return { redirect: pathname.slice(defaultLocale.length + 1) || "/" };
  if (isLocale(first)) return {};
  return { rewrite: `/${defaultLocale}${pathname === "/" ? "" : pathname}` };
}

// Pilihan bahasa tamu diingat (permintaan pemilik, Oktober 2026: "kalau memilih English, semuanya English").
// Tombol bahasa menambahkan ?lang=xx; proxy.js menyimpannya di cookie dd_lang selama setahun dan sejak itu
// mengalihkan alamat berbahasa lain (tautan /id dari riwayat peramban, email, atau admin) ke bahasa pilihan.
// Tanpa pilihan (pengunjung baru, Google) alamat dipakai apa adanya; bawaan tetap English di akar.
export const LANG_COOKIE = "dd_lang";
export const LANG_PARAM = "lang";
export const LANG_COOKIE_DAYS = 365;

/** Bahasa sebuah alamat publik: /id, /zh, /ko (dan di bawahnya) bahasanya masing-masing, selain itu English. */
export function langOfPath(pathname) {
  const [, first] = pathname.split("/");
  return first !== defaultLocale && isLocale(first) ? first : defaultLocale;
}

/** Alamat yang sama dalam bahasa lain: "/id/services/x" → "/services/x" (en), "/" → "/zh" (zh). */
export function pathIn(lang, pathname) {
  const from = langOfPath(pathname);
  const base = from === defaultLocale ? pathname : pathname.slice(from.length + 1) || "/";
  return localeHref(lang, base);
}

/** Tautan tombol bahasa: halaman ini dalam bahasa itu, ditambah ?lang=xx supaya pilihannya diingat. */
export function chooseLangHref(lang, path = "/") {
  const href = localeHref(lang, path);
  const cut = href.indexOf("#");
  const [main, hash] = cut === -1 ? [href, ""] : [href.slice(0, cut), href.slice(cut)];
  return `${main}${main.includes("?") ? "&" : "?"}${LANG_PARAM}=${lang}${hash}`;
}

/**
 * Keputusan proxy untuk pilihan bahasa (pathname sudah tanpa awalan /en):
 *   ?lang=xx                → { remember: xx, redirect: alamat ini dalam xx } (cookie diisi, ?lang dibuang)
 *   cookie xx ≠ bahasa path → { redirect: alamat ini dalam xx }
 *   selain itu              → null (diteruskan)
 */
export function languageChoice(pathname, { param = null, cookie = null } = {}) {
  if (isLocale(param)) return { remember: param, redirect: pathIn(param, pathname) };
  if (isLocale(cookie) && cookie !== langOfPath(pathname)) return { redirect: pathIn(cookie, pathname) };
  return null;
}

/** Isi {nama} di teks dengan nilai: format("Tanya soal {x}", { x: "kursus" }). */
export const format = (template, values = {}) => template.replace(/\{(\w+)\}/g, (all, key) => (key in values ? String(values[key]) : all));
