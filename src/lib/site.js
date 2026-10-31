// Data situs yang dipakai di banyak halaman. Kontak dan media sosial diisi tim di /admin/kontak (tabel
// settings baris "site", dimuat src/server/site-settings.js ke memori proses dan dibaca di sini saat
// halaman dibuat); isian yang kosong memakai isian lama dari hPanel (NEXT_PUBLIC_*, ditanam saat build)
// atau nilai bawaan. "-" dari hPanel berarti belum diisi (src/lib/env.js). Hanya dipakai di server.
import { cleanWhatsApp } from "./checkout.js";
import { envText } from "./env.js";

/** Tempat isian /admin/kontak di memori proses (diisi src/server/site-settings.js). */
export const SITE_STATE = "__dragonetSite";
const live = () => globalThis[SITE_STATE]?.value ?? null;

const DEFAULT_URL = "https://dragonetdivers.com";

// Origin http(s) dari sebuah isian, atau null bila bukan URL yang valid.
function parseSiteUrl(raw) {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
}

// URL situs dari NEXT_PUBLIC_SITE_URL. Isian yang bukan URL (mis. teks contoh)
// tidak boleh menggagalkan build: pakai URL bawaan dan beri peringatan di log.
export function siteUrl(value = process.env.NEXT_PUBLIC_SITE_URL) {
  const raw = envText(value);
  if (!raw) return DEFAULT_URL;
  const parsed = parseSiteUrl(raw);
  if (parsed) return parsed;
  console.warn(`NEXT_PUBLIC_SITE_URL bukan URL yang valid ("${raw}"); memakai ${DEFAULT_URL}. Isi dengan alamat lengkap, mis. ${DEFAULT_URL}`);
  return DEFAULT_URL;
}

// Tagline dan deskripsi dalam dua bahasa ada di src/content/ui.js (meta).
export const site = {
  name: "Dragonet Divers Raja Ampat",
  shortName: "Dragonet Divers",
  url: siteUrl(),
};

// Kontak dan base dari pemilik (Oktober 2026), dipakai selama /admin/kontak belum diisi. Kotak email
// dibuat pemilik di Hostinger.
export const DEFAULT_CONTACT = {
  email: "halo@dragonetdivers.com",
  address: ["Jl. Mayor, Kurkapa", "Meos Mansar, Raja Ampat", "Papua Barat Daya 98472"],
  base: { lat: -0.5778994776222449, lng: 130.61021304365477 },
};

export const contact = {
  get email() {
    return live()?.email || DEFAULT_CONTACT.email;
  },
  get address() {
    const lines = (live()?.address ?? []).filter(Boolean);
    return lines.length ? lines : DEFAULT_CONTACT.address;
  },
  base: DEFAULT_CONTACT.base,
};

const pointLink = ({ lat, lng }) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

/** Tautan Google Maps ke sebuah titik, atau ke base (tautan dari /admin/kontak bila diisi). */
export const mapsLink = (point) => (point ? pointLink(point) : live()?.mapsUrl || pointLink(DEFAULT_CONTACT.base));

// Akun media sosial dari /admin/kontak (atau variabel publik lama di hPanel), berupa handle
// (@dragonetdivers) atau URL lengkap di domain jaringan itu. Yang kosong atau tidak valid tidak ditampilkan.
export const NETWORKS = [
  { id: "instagram", label: "Instagram", host: "instagram.com", url: (h) => `https://www.instagram.com/${h}/` },
  { id: "tiktok", label: "TikTok", host: "tiktok.com", url: (h) => `https://www.tiktok.com/@${h}` },
  { id: "facebook", label: "Facebook", host: "facebook.com", url: (h) => `https://www.facebook.com/${h}` },
  { id: "youtube", label: "YouTube", host: "youtube.com", url: (h) => `https://www.youtube.com/@${h}` },
];

export function socialUrl(network, value) {
  const raw = envText(value);
  const net = NETWORKS.find((n) => n.id === network);
  if (!raw || !net) return null;
  const handle = raw.replace(/^@/, "");
  if (/^[A-Za-z0-9._-]{1,60}$/.test(handle)) return net.url(handle);
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    return url.protocol === "https:" && (host === net.host || host.endsWith(`.${net.host}`)) ? url.href : null;
  } catch {
    return null;
  }
}

// Nilai NEXT_PUBLIC_* harus ditulis lengkap agar ikut ditanam saat build.
export const SOCIAL_ENV = {
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM,
  tiktok: process.env.NEXT_PUBLIC_TIKTOK,
  facebook: process.env.NEXT_PUBLIC_FACEBOOK,
  youtube: process.env.NEXT_PUBLIC_YOUTUBE,
};

/** Akun media sosial yang berlaku: isian /admin/kontak, lalu isian lama di hPanel. */
const socialValues = () => Object.fromEntries(NETWORKS.map((n) => [n.id, live()?.[n.id] || SOCIAL_ENV[n.id]]));

export function socialLinks(values = socialValues()) {
  return NETWORKS.flatMap((n) => {
    const href = socialUrl(n.id, values[n.id]);
    return href ? [{ id: n.id, label: n.label, href }] : [];
  });
}

// Nomor WhatsApp dengan kode negara (mis. 6281234567890). Isian seperti "+62 822-9131-1277" atau
// "0822..." dirapikan dengan aturan yang sama dengan /admin/kontak (cleanWhatsApp); nilai lain diabaikan.
export function whatsappNumber(value = live()?.whatsapp || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER) {
  const raw = envText(value);
  return raw ? cleanWhatsApp(raw) : null;
}

export function whatsappLink(text, number = whatsappNumber()) {
  if (!number) return null;
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

// Peringatan isian variabel publik untuk /api/health (nilai publik, aman ditampilkan).
export function siteConfigWarnings(env = process.env) {
  const warnings = [];
  const url = envText(env.NEXT_PUBLIC_SITE_URL);
  if (url && !parseSiteUrl(url)) {
    warnings.push(`NEXT_PUBLIC_SITE_URL bukan URL yang valid; memakai ${DEFAULT_URL}.`);
  }
  const wa = envText(env.NEXT_PUBLIC_WHATSAPP_NUMBER);
  if (wa && !whatsappNumber(wa)) {
    warnings.push("NEXT_PUBLIC_WHATSAPP_NUMBER tidak valid; tombol WhatsApp disembunyikan. Format: 6281234567890.");
  }
  for (const n of NETWORKS) {
    const value = envText(env[`NEXT_PUBLIC_${n.id.toUpperCase()}`]);
    if (value && !socialUrl(n.id, value)) {
      warnings.push(`NEXT_PUBLIC_${n.id.toUpperCase()} tidak valid; ikon ${n.label} disembunyikan. Isi handle (@dragonetdivers) atau URL ${n.host}.`);
    }
  }
  return warnings;
}
