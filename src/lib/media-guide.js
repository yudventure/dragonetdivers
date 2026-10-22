// Panduan ukuran foto dan video untuk galeri beranda di /admin/situs. Angka mengikuti petak galeri
// (src/components/GalleryGrid.jsx: 4 kolom, baris 190 sampai 220 px di layar lebar, 2 kolom di ponsel),
// dikali dua untuk layar tajam (Retina). Foto dipotong mengikuti petak, jadi objek utama sebaiknya di
// tengah. Fungsi murni, diuji di tests/media-guide.test.js.

/** Rekomendasi per ukuran petak: rasio pratinjau (CSS aspect-ratio), arah foto, dan ukuran minimal (px). */
export const TILE_GUIDE = {
  small: { label: "Kecil", aspect: "4 / 3", shape: "Mendatar 4:3 atau persegi", minWidth: 1200, minHeight: 900 },
  wide: { label: "Lebar", aspect: "8 / 3", shape: "Mendatar memanjang, 16:9 atau lebih lebar", minWidth: 2400, minHeight: 900 },
  tall: { label: "Tinggi", aspect: "5 / 8", shape: "Tegak 2:3 atau 9:16", minWidth: 1080, minHeight: 1620 },
  big: { label: "Besar", aspect: "4 / 3", shape: "Mendatar 4:3", minWidth: 2400, minHeight: 1800 },
};

export const PHOTO_RULES = {
  formats: "JPG, PNG, WebP, atau HEIC (foto iPhone)",
  maxMb: 15,
  best: "2400 px di sisi terpanjang",
};

export const VIDEO_GUIDE = [
  { kind: "Shorts, TikTok, Reels", shape: "Tegak 9:16", size: "1080 × 1920 px", tile: "Tinggi (otomatis)" },
  { kind: "YouTube atau Facebook biasa", shape: "Mendatar 16:9", size: "1920 × 1080 px (Full HD)", tile: "Lebar atau Besar" },
];

/** Petak yang dipakai: "auto" untuk foto = kecil, untuk video tegak = tinggi, video lain = lebar. */
export function tileFor(size, { type = "photo", vertical = false } = {}) {
  if (size && size !== "auto" && TILE_GUIDE[size]) return size;
  if (type === "photo") return "small";
  return vertical ? "tall" : "wide";
}

/**
 * Penilaian sebuah foto untuk petaknya: { level: "good" | "fair" | "small", message, suggest }.
 * suggest = petak yang lebih cocok dengan arah foto, atau null.
 */
export function photoAdvice({ width, height }, size = "auto") {
  if (!width || !height) return null;
  const tile = tileFor(size);
  const guide = TILE_GUIDE[tile];
  const ratio = width / height;
  let suggest = null;
  if (ratio < 0.85 && tile !== "tall") suggest = "tall";
  else if (ratio > 2.2 && tile !== "wide") suggest = "wide";
  const dims = `${width} × ${height} px`;
  if (width >= guide.minWidth && height >= guide.minHeight) {
    return { level: "good", message: `${dims}, tajam untuk petak ${guide.label}.`, suggest };
  }
  if (Math.max(width, height) >= 1200) {
    return { level: "fair", message: `${dims}, cukup, tapi bisa sedikit kurang tajam di layar besar. Ideal minimal ${guide.minWidth} × ${guide.minHeight} px.`, suggest };
  }
  return { level: "small", message: `${dims}, terlalu kecil dan akan terlihat buram. Pakai foto minimal ${guide.minWidth} × ${guide.minHeight} px.`, suggest };
}
