// Mode developer (mengikuti Zanclus src/developer.js): selama aktif, pemilik bisa menutup seluruh
// website, satu halaman, atau satu bagian beranda. Pengunjung lalu melihat halaman perawatan (503) atau
// kartu "sedang diperbarui" di bagian itu; operator yang masuk di /admin tetap melihat semuanya dengan
// bilah di atas. Mematikan mode developer membuka semua kunci sekaligus, pilihan kuncinya tetap disimpan.
// Fungsi murni, diuji di tests/developer.test.js.

export const ADMIN_COOKIE = "dd_admin"; // sama dengan COOKIE di src/server/admin-auth.js
export const PREVIEW_COOKIE = "dd_pratinjau"; // ?pratinjau=pengunjung: operator melihat seperti pengunjung
export const OPERATOR_COOKIE = "dd_operator"; // penanda tanpa rahasia: peramban ini pernah masuk /admin
export const PREVIEW_MINUTES = 30;

export const LOCKABLE_PAGES = [
  ["home", "Beranda", "/"],
  ["fun-dives", "Fun dive", "/services/fun-dives"],
  ["dive-courses", "Kursus selam", "/services/dive-courses"],
  ["snorkeling", "Snorkeling", "/services/snorkeling"],
  ["island-trips", "Trip pulau", "/services/island-trips"],
  ["dusk-dives", "Dusk dive", "/services/dusk-dives"],
  ["checkout", "Checkout dan pembayaran online", "/checkout"],
];
export const LOCKABLE_SECTIONS = [
  ["conditions", "Kondisi laut live"],
  ["services", "Layanan"],
  ["dive-sites", "Peta titik selam"],
  ["gallery", "Galeri foto & video"],
  ["getting-here", "Cara ke sini"],
  ["faq", "FAQ"],
];
const PAGE_KEYS = LOCKABLE_PAGES.map(([key]) => key);
const SECTION_KEYS = LOCKABLE_SECTIONS.map(([key]) => key);
const UNTIL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export const DEFAULT_DEVELOPER = { enabled: false, site: false, pages: [], sections: [], message: { id: "", en: "" }, until: "" };

const keys = (value, allowed, label) => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 50) throw new Error(`Pilihan ${label} tidak valid.`);
  const out = [];
  for (const key of value) {
    if (!allowed.includes(key)) throw new Error(`Pilihan ${label} tidak dikenal.`);
    if (!out.includes(key)) out.push(key);
  }
  return out;
};

/** Pengaturan mode developer yang bersih dari form /admin/developer; Error berisi pesan untuk tim. */
export function validateDeveloper(input) {
  if (!input || typeof input !== "object") throw new Error("Pengaturan mode developer tidak valid.");
  const message = {};
  for (const lang of ["id", "en"]) {
    const text = input.message?.[lang] ?? "";
    if (typeof text !== "string" || text.length > 400) throw new Error("Pesan untuk pengunjung maksimal 400 karakter.");
    message[lang] = text.trim();
  }
  const until = input.until ?? "";
  if (until !== "" && (typeof until !== "string" || !UNTIL.test(until))) throw new Error("Perkiraan selesai harus berupa tanggal dan jam.");
  return {
    enabled: input.enabled === true,
    site: input.site === true,
    pages: keys(input.pages, PAGE_KEYS, "halaman"),
    sections: keys(input.sections, SECTION_KEYS, "bagian"),
    message,
    until,
  };
}

/** Pengaturan tersimpan yang rusak atau dari versi lama tetap menghasilkan bentuk yang lengkap. */
export function normalizeDeveloper(value) {
  try {
    return validateDeveloper({ ...DEFAULT_DEVELOPER, ...(value ?? {}) });
  } catch {
    return structuredClone(DEFAULT_DEVELOPER);
  }
}

/** Kunci yang berlaku untuk penampil ini. Operator yang masuk, atau mode developer mati, tanpa kunci. */
export function visitorLocks(developer, admin = false) {
  const d = developer ?? DEFAULT_DEVELOPER;
  const on = d.enabled === true && !admin;
  const map = (list) => Object.fromEntries((on ? (list ?? []) : []).map((key) => [key, true]));
  return { site: on && d.site === true, pages: map(d.pages), sections: map(d.sections) };
}
export const NO_LOCKS = visitorLocks(null);

export const pageLocked = (locks, page) => Boolean(locks?.site || (page && locks?.pages?.[page]));
export const sectionLocked = (locks, section) => Boolean(locks?.sections?.[section]);

/** Kunci halaman untuk alamat tanpa awalan bahasa (/, /services/fun-dives, /checkout/3), atau null. */
export function pageForPath(path) {
  const clean = String(path || "/").replace(/\/+$/, "") || "/";
  if (clean === "/") return "home";
  if (clean === "/checkout" || clean.startsWith("/checkout/")) return "checkout";
  const match = clean.match(/^\/services\/([a-z-]+)$/);
  return match && PAGE_KEYS.includes(match[1]) ? match[1] : null;
}

/** Jumlah kunci yang aktif, untuk bilah operator dan halaman pengaturan. */
export function lockCount(developer) {
  const d = developer ?? DEFAULT_DEVELOPER;
  if (!d.enabled) return 0;
  if (d.site) return 1;
  return d.pages.length + d.sections.length;
}

/** Detik untuk header Retry-After: sampai perkiraan selesai (WIT), 5 menit sampai sehari; 1 jam bila kosong. */
export function retryAfter(until, now = Date.now()) {
  if (!until) return 3600;
  const end = Date.parse(`${until}:00+09:00`);
  if (!Number.isFinite(end)) return 3600;
  return Math.min(86400, Math.max(300, Math.round((end - now) / 1000)));
}

/** Nama tempat pengaturan terakhir di memori proses, dibaca proxy.js tanpa menyentuh database. */
export const DEVELOPER_STATE = "__dragonetDeveloper";
