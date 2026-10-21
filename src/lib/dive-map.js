// Isi peta titik selam & snorkel di beranda (src/components/DiveSiteMap.jsx).
// Peta dan datanya dari peta Raja Ampat bersama (src/components/peta-raja-ampat/, sumber DAMPIER),
// disaring hanya titik selam & snorkel, seperti di situs Zanclus. Fungsi murni supaya bisa diuji.
import { keSatuan } from "../components/peta-raja-ampat/logika.js";

/** Jenis tanda "Dive & snorkel site" di data/tata.json. */
export const SITE_KIND = "selam";

/** Hanya titik selam & snorkel; kampung, homestay, dive center lain, dsb. tidak ditampilkan. */
export const pickDiveSites = (tanda) => tanda.filter((x) => x.jenis === SITE_KIND);

/** Jarak titik ke tepi kotak wilayah, dalam satuan peta (1 satuan sekitar 111 m). */
const SITE_MARGIN = 3;

/**
 * Hanya wilayah yang punya titik, supaya tidak ada pulau yang diketuk lalu kosong. Kotak kamera
 * tiap wilayah diperlebar sampai semua titiknya masuk bingkai (kotak Arborek di data bawaan hanya
 * selebar pulaunya, jadi Manta Sandy dan Manta Ridge tadinya di luar layar).
 */
export function areasWithSites(wilayah, sites, bingkai) {
  return wilayah.flatMap((area) => {
    const own = sites.filter((x) => x.wilayah === area.id);
    if (own.length === 0) return [];
    let [x0, y0, w, h] = area.kotak;
    let x1 = x0 + w;
    let y1 = y0 + h;
    for (const site of own) {
      const [x, y] = keSatuan(bingkai, site.lat, site.lng);
      x0 = Math.min(x0, x - SITE_MARGIN);
      y0 = Math.min(y0, y - SITE_MARGIN);
      x1 = Math.max(x1, x + SITE_MARGIN);
      y1 = Math.max(y1, y + SITE_MARGIN);
    }
    return [{ ...area, kotak: [x0, y0, x1 - x0, y1 - y0] }];
  });
}

// Teks peta yang ditimpa per bahasa (kunci dari data/teks.json). Tanpa titik dua, titik koma, atau tanda
// pisah panjang (aturan pemilik untuk peta), tanpa harga, jadwal, atau klaim bisnis (CLAUDE.md).
export const mapText = {
  en: {
    awalJudul: "Dive and snorkel sites",
    awalTeks:
      "The sites on this map spread across the Dampier Strait around Kri, Mansuar, Arborek, Gam and Friwen, out to Piaynemo in the west. Pick an island to see the sites around it.",
    diWilayah: "Sites around {wilayah}",
    belumAdaTanda: "No dive or snorkel sites in this area yet.",
    legenda: "Map markers",
    lihatLayanan: "See fun dives",
  },
  id: {
    awalJudul: "Titik selam dan snorkel",
    awalTeks:
      "Titik di peta ini tersebar di Selat Dampier sekitar Kri, Mansuar, Arborek, Gam, dan Friwen, sampai Piaynemo di barat. Pilih pulau untuk melihat titik di sekitarnya.",
    diWilayah: "Titik di sekitar {wilayah}",
    belumAdaTanda: "Belum ada titik selam atau snorkel di wilayah ini.",
    legenda: "Tanda di peta",
    lihatLayanan: "Lihat fun dive",
  },
};

/** Tombol di kartu titik: ke halaman layanan fun dives (diberi awalan bahasa dengan localeHref). */
export const SITE_LINK = "/services/fun-dives";
