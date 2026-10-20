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

export const site = {
  name: "Dragonet Divers Raja Ampat",
  shortName: "Dragonet Divers",
  tagline: "Dive into colour.",
  description: "Small-group diving, courses and snorkeling trips in Raja Ampat and the Dampier Strait, with local guides.",
  url: siteUrl(),
};

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
  return warnings;
}
