// Susunan mosaik galeri beranda (contoh dari pemilik, Oktober 2026): 4 kolom (2 di ponsel) dengan pola 12
// item yang berulang. Blok pertama 3 baris (besar 2×2, kecil, kecil, tinggi 1×2, lalu empat kecil), blok
// kedua 2 baris (besar, tinggi, kecil, kecil); grid-flow-dense di GalleryGrid.jsx mengisi celahnya, jadi
// setiap 12 item membentuk persegi rapi. Item dengan ukuran petak pilihan tim (bukan "Otomatis") tetap
// memakai ukurannya. Fungsi murni, diuji di tests/gallery-layout.test.js.
//
// Rata tanpa lubang (permintaan pemilik 2 November 2026: "rapihkan lagi marginnya ... tampilan awal yang
// memperlihatkan galeri harus rapih juga"): video tegak dan ukuran pilihan tim menggeser pola 12 item, jadi
// baris terakhir bisa berlubang. fitMosaic menyesuaikan ukuran petak foto "Otomatis" (dan video mendatar)
// untuk item yang sedang tampil, di 4 kolom dan 2 kolom, sampai kisinya penuh dan rata di bawah. Perubahan
// dicari dari item terakhir dulu, jadi bagian atas tetap mengikuti pola.

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
 * Ukuran petak yang boleh dipakai sebuah item saat galeri dirapatkan (fitMosaic). "full" (selebar kisi, dua
 * baris) hanya untuk foto otomatis dan hanya dipakai bila ukuran lain tidak bisa menutup lubang, misalnya galeri
 * yang baru berisi satu foto.
 */
export function sizesFor(item) {
  if (item.size && item.size !== "auto") return [item.size];
  if (item.type === "embed" || item.type === "video") return item.vertical ? ["tall"] : ["wide", "big"];
  return ["small", "wide", "tall", "big", "full"];
}

// Lebar dan tinggi petak dalam sel kisi; lebar dibatasi jumlah kolom (full = selebar kisi).
const SPAN = { small: [1, 1], wide: [2, 1], tall: [1, 2], big: [2, 2], full: [Infinity, 2] };

/**
 * Penempatan seperti grid-auto-flow: row dense di peramban (setiap item mencari tempat kosong pertama dari
 * atas kiri): { cells: [kolom, baris] per item, rows, holes } dengan holes = sel kosong di dalam baris terpakai.
 */
export function denseLayout(sizes, columns) {
  const taken = new Set();
  const free = (c, r, w, h) => {
    if (c + w > columns) return false;
    for (let x = c; x < c + w; x++) for (let y = r; y < r + h; y++) if (taken.has(x * 10_000 + y)) return false;
    return true;
  };
  let rows = 0;
  const cells = sizes.map((size) => {
    const [w, h] = (SPAN[size] ?? SPAN.small).map((n, i) => (i === 0 ? Math.min(n, columns) : n));
    for (let r = 0; ; r++) {
      for (let c = 0; c < columns; c++) {
        if (!free(c, r, w, h)) continue;
        for (let x = c; x < c + w; x++) for (let y = r; y < r + h; y++) taken.add(x * 10_000 + y);
        rows = Math.max(rows, r + h);
        return [c, r];
      }
    }
  });
  return { cells, rows, holes: rows * columns - taken.size };
}

/** Satu langkah: penggantian satu ukuran (atau dua di ujung) yang mengurangi lubang, item paling akhir dulu. */
function improve(sizes, holes, allowed, columns) {
  const flexible = sizes.map((_, i) => i).filter((i) => allowed[i].length > 1).reverse();
  const tries = (i) => allowed[i].filter((size) => size !== sizes[i]);
  const layoutHoles = (trial) => denseLayout(trial, columns).holes;
  for (const i of flexible) {
    let best = null;
    for (const size of tries(i)) {
      const trial = sizes.slice();
      trial[i] = size;
      const h = layoutHoles(trial);
      if (h < (best?.holes ?? holes)) best = { sizes: trial, holes: h };
    }
    if (best) return best;
  }
  // Tidak ada satu penggantian yang menolong: dua sekaligus di antara 10 item fleksibel terakhir.
  const tail = flexible.slice(0, 10);
  for (const i of tail) {
    let best = null;
    for (const j of tail) {
      if (j >= i) continue;
      for (const a of tries(i)) {
        for (const b of tries(j)) {
          const trial = sizes.slice();
          trial[i] = a;
          trial[j] = b;
          const h = layoutHoles(trial);
          if (h < (best?.holes ?? holes)) best = { sizes: trial, holes: h };
        }
      }
    }
    if (best) return best;
  }
  return null;
}

/**
 * Ukuran petak yang membuat kisi `columns` kolom penuh tanpa lubang. preferred = ukuran pola tiap item,
 * allowed = ukuran yang boleh dipakai tiap item (sizesFor). Sekali jalan mengganti satu ukuran yang mengurangi
 * lubang, dicari dari item terakhir, jadi bagian atas tetap mengikuti pola; bila tidak ada, dicoba pasangan di
 * antara item-item terakhir. Urutan percobaan: hanya item mulai `keep` (yang baru tampil) tanpa ukuran "full",
 * lalu dengan "full", lalu semua item dengan cara yang sama. Item berukuran tetap tidak pernah diubah.
 */
export function fitMosaic(preferred, allowed, columns, keep = 0) {
  const options = preferred.map((size, i) => (allowed[i]?.length ? allowed[i] : [size]));
  const start = preferred.map((size, i) => (options[i].includes(size) ? size : options[i][0]));
  let best = { sizes: start, holes: denseLayout(start, columns).holes };
  const phases = [keep, 0]
    .filter((from, index) => index === 0 || from !== keep)
    .flatMap((from) => [false, true].map((full) => ({ from, full })));
  for (const { from, full } of phases) {
    if (best.holes === 0) break;
    const choices = options.map((list, i) => (i < from ? [start[i]] : full ? list : list.filter((size) => size !== "full")));
    let sizes = start;
    let holes = denseLayout(sizes, columns).holes;
    for (let pass = 0; holes > 0 && pass < 80; pass++) {
      const next = improve(sizes, holes, choices.map((list, i) => (list.includes(sizes[i]) ? list : [sizes[i], ...list])), columns);
      if (!next) break;
      ({ sizes, holes } = next);
    }
    if (holes < best.holes) best = { sizes, holes };
  }
  return best.sizes;
}

/**
 * Ukuran petak untuk `count` item pertama galeri (yang sedang tampil) di `columns` kolom. Beranda menampilkan
 * `first` item lalu `more` item per ketukan tombol, jadi kisi dirapatkan per kelompok itu: kelompok yang sudah
 * tampil tidak berubah bentuk saat kelompok berikutnya dibuka, kecuali tidak ada cara lain untuk menutup lubang.
 */
export function fitGallery(items, columns, { count = items.length, first = 12, more = 12 } = {}) {
  let sizes = [];
  for (let end = Math.min(first, count), from = 0; from < count; from = end, end = Math.min(end + more, count)) {
    const shown = items.slice(0, end);
    sizes = fitMosaic(
      shown.map((item, i) => sizes[i] ?? item.size),
      shown.map((item) => item.sizes ?? [item.size]),
      columns,
      from,
    );
  }
  return sizes;
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
    sizes: sizesFor(item),
    caption: item.type === "photo" && item.alt && counts.get(item.alt) === 1 ? item.alt : null,
  }));
}
