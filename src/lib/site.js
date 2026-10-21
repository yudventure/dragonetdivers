// Data situs yang dipakai di banyak halaman. Nilai NEXT_PUBLIC_* ditanam saat build.

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
  const raw = value?.trim();
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

// Kontak dan base dari pemilik (Oktober 2026). Kotak email dibuat pemilik di Hostinger.
export const contact = {
  email: "halo@dragonetdivers.com",
  address: ["Jl. Mayor, Kurkapa", "Meos Mansar, Raja Ampat", "Papua Barat Daya 98472"],
  base: { lat: -0.5778994776222449, lng: 130.61021304365477 },
};

export const mapsLink = ({ lat, lng } = contact.base) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

// Akun media sosial diisi lewat variabel publik (hPanel), berupa handle (@dragonetdivers) atau URL
// lengkap di domain jaringan itu. Yang kosong atau tidak valid tidak ditampilkan.
const NETWORKS = [
  { id: "instagram", label: "Instagram", host: "instagram.com", url: (h) => `https://www.instagram.com/${h}/` },
  { id: "tiktok", label: "TikTok", host: "tiktok.com", url: (h) => `https://www.tiktok.com/@${h}` },
  { id: "facebook", label: "Facebook", host: "facebook.com", url: (h) => `https://www.facebook.com/${h}` },
  { id: "youtube", label: "YouTube", host: "youtube.com", url: (h) => `https://www.youtube.com/@${h}` },
];

export function socialUrl(network, value) {
  const raw = value?.trim();
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
const SOCIAL_ENV = {
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM,
  tiktok: process.env.NEXT_PUBLIC_TIKTOK,
  facebook: process.env.NEXT_PUBLIC_FACEBOOK,
  youtube: process.env.NEXT_PUBLIC_YOUTUBE,
};

export function socialLinks(values = SOCIAL_ENV) {
  return NETWORKS.flatMap((n) => {
    const href = socialUrl(n.id, values[n.id]);
    return href ? [{ id: n.id, label: n.label, href }] : [];
  });
}

// Nomor WhatsApp hanya angka dengan kode negara (mis. 6281234567890). Nilai lain diabaikan.
export function whatsappNumber(value = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER) {
  const digits = value?.trim();
  return digits && /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

export function whatsappLink(text, number = whatsappNumber()) {
  if (!number) return null;
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

// Peringatan isian variabel publik untuk /api/health (nilai publik, aman ditampilkan).
export function siteConfigWarnings(env = process.env) {
  const warnings = [];
  const url = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (url && !parseSiteUrl(url)) {
    warnings.push(`NEXT_PUBLIC_SITE_URL bukan URL yang valid; memakai ${DEFAULT_URL}.`);
  }
  const wa = env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim();
  if (wa && !whatsappNumber(wa)) {
    warnings.push("NEXT_PUBLIC_WHATSAPP_NUMBER tidak valid; tombol WhatsApp disembunyikan. Format: 6281234567890.");
  }
  for (const n of NETWORKS) {
    const value = env[`NEXT_PUBLIC_${n.id.toUpperCase()}`]?.trim();
    if (value && !socialUrl(n.id, value)) {
      warnings.push(`NEXT_PUBLIC_${n.id.toUpperCase()} tidak valid; ikon ${n.label} disembunyikan. Isi handle (@dragonetdivers) atau URL ${n.host}.`);
    }
  }
  return warnings;
}
