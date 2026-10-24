// Susunan mosaik galeri beranda (contoh dari pemilik, Oktober 2026): 4 kolom (2 di ponsel) dengan pola 12
// item yang berulang. Blok pertama 3 baris (besar 2×2, kecil, kecil, tinggi 1×2, lalu empat kecil), blok
// kedua 2 baris (besar, tinggi, kecil, kecil); grid-flow-dense di GalleryGrid.jsx mengisi celahnya, jadi
// setiap 12 item membentuk persegi rapi. Item dengan ukuran petak pilihan tim (bukan "Otomatis") tetap
// memakai ukurannya. Fungsi murni, diuji di tests/gallery-layout.test.js.

export const MOSAIC = ["big", "small", "small", "tall", "small", "small", "small", "small", "big", "tall", "small", "small"];

/** Ukuran petak pola mosaik untuk item ke-index (mulai 0). */
export const mosaicSize = (index) => MOSAIC[((index % MOSAIC.length) + MOSAIC.length) % MOSAIC.length];

/**
 * Ukuran petak sebuah item galeri di posisi index: pilihan tim bila ada, selain itu pola mosaik. Video tanpa
 * pilihan: tegak (Shorts, TikTok, Reels) jadi tinggi, mendatar jadi besar di posisi besar atau lebar di posisi lain.
 */
export function tileOf(item, index) {
  if (item.size && item.size !== "auto") return item.size;
  const slot = mosaicSize(index);
  if (item.type === "embed" || item.type === "video") return item.vertical ? "tall" : slot === "big" ? "big" : "wide";
  return slot;
}

/**
 * Item galeri dengan ukuran petak final dan keterangan yang tampil di atas foto. Keterangan hanya ditampilkan
 * bila unik di galeri (keterangan umum yang sama untuk banyak foto tidak diulang-ulang di setiap petak).
 */
export function arrangeGallery(items) {
  const counts = new Map();
  for (const item of items) if (item.alt) counts.set(item.alt, (counts.get(item.alt) ?? 0) + 1);
  return items.map((item, index) => ({
    ...item,
    size: tileOf(item, index),
    caption: item.type === "photo" && item.alt && counts.get(item.alt) === 1 ? item.alt : null,
  }));
}
