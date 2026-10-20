// Data situs yang dipakai di banyak halaman. Nilai NEXT_PUBLIC_* ditanam saat build.

export const site = {
  name: "Dragonet Divers Raja Ampat",
  shortName: "Dragonet Divers",
  tagline: "Dive into colour.",
  description: "Small-group diving, courses and snorkeling trips in Raja Ampat and the Dampier Strait, with local guides.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://dragonetdiversrajaampat.com").replace(/\/+$/, ""),
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
