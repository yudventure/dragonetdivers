// Isian /admin/kontak: WhatsApp, email, alamat, tautan Google Maps, akun media sosial yang tampil di
// website, dan showUsd (pilihan dolar AS di website; mati = semua harga hanya dalam Rupiah). Disimpan di tabel settings baris "site" (src/server/site-settings.js) dan dibaca src/lib/site.js.
// Isian kosong berarti memakai isian lama dari hPanel atau nilai bawaan. Fungsi murni, diuji di
// tests/site-settings.test.js.
import { cleanEmail, cleanWhatsApp } from "./checkout.js";
import { NETWORKS, socialUrl } from "./site.js";

export const ADDRESS_LINES = 3;
export const DEFAULT_SITE_SETTINGS = {
  whatsapp: "",
  email: "",
  address: ["", "", ""],
  mapsUrl: "",
  ...Object.fromEntries(NETWORKS.map((n) => [n.id, ""])),
  showUsd: false,
};

/** Isian yang salah; field = nama kolom di form. */
export class SiteSettingsError extends Error {
  constructor(message, field) {
    super(message);
    this.field = field;
  }
}

const text = (value) => (typeof value === "string" ? value.trim() : "");
const MAPS_HOSTS = ["google.com", "maps.google.com", "goo.gl", "maps.app.goo.gl", "g.co"];

/** Tautan Google Maps yang sah (https, domain Google) atau null. */
export function mapsUrlOf(value) {
  try {
    const url = new URL(text(value));
    const host = url.hostname.replace(/^www\./, "");
    const google = MAPS_HOSTS.includes(host) || /^google\.[a-z.]{2,6}$/.test(host);
    return url.protocol === "https:" && google ? url.href : null;
  } catch {
    return null;
  }
}

/** Isian form → isian yang disimpan, atau SiteSettingsError dengan pesan untuk tim. */
export function validateSiteSettings(input) {
  if (!input || typeof input !== "object") throw new SiteSettingsError("Isian tidak valid.", "form");
  const out = structuredClone(DEFAULT_SITE_SETTINGS);
  const whatsapp = text(input.whatsapp);
  if (whatsapp) {
    out.whatsapp = cleanWhatsApp(whatsapp);
    if (!out.whatsapp) throw new SiteSettingsError("Nomor WhatsApp belum benar. Tulis dengan kode negara, mis. +62 812 3456 7890.", "whatsapp");
  }
  const email = text(input.email);
  if (email) {
    out.email = cleanEmail(email);
    if (!out.email) throw new SiteSettingsError("Alamat email belum benar.", "email");
  }
  const lines = Array.isArray(input.address) ? input.address : [];
  out.address = Array.from({ length: ADDRESS_LINES }, (_, i) => {
    const line = text(lines[i]).replace(/\s+/g, " ");
    if (line.length > 80 || /[<>]/.test(line)) throw new SiteSettingsError("Setiap baris alamat maksimal 80 huruf, tanpa < atau >.", `address${i}`);
    return line;
  });
  const maps = text(input.mapsUrl);
  if (maps) {
    out.mapsUrl = mapsUrlOf(maps);
    if (!out.mapsUrl) throw new SiteSettingsError("Tempel tautan dari Google Maps (diawali https://).", "mapsUrl");
  }
  for (const n of NETWORKS) {
    const value = text(input[n.id]);
    if (!value) continue;
    if (value.length > 200 || !socialUrl(n.id, value)) {
      throw new SiteSettingsError(`Akun ${n.label} belum benar. Tulis nama akunnya (mis. @dragonetdivers) atau tempel tautan profil ${n.host}.`, n.id);
    }
    out[n.id] = value;
  }
  out.showUsd = input.showUsd === true;
  return out;
}

/** Simpanan lama atau rusak tetap menghasilkan bentuk lengkap (isian yang salah dikosongkan). */
export function normalizeSiteSettings(value) {
  try {
    return validateSiteSettings({ ...DEFAULT_SITE_SETTINGS, ...(value ?? {}) });
  } catch {
    return structuredClone(DEFAULT_SITE_SETTINGS);
  }
}
