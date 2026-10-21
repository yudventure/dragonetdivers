// Isi seksi "How to get here" di beranda (src/components/GettingHere.jsx).
// Rute dari pemilik: base Dragonet di Kurkapa, Pulau Mansuar (Meos Mansar). Fakta perjalanan dicek dari
// sumber umum (Oktober 2026): Bandara Domine Eduard Osok (SOQ) Sorong, kapal cepat Sorong ke Waisai
// sekitar 2 jam, kartu masuk taman laut dijual di kantor otoritas di Waisai (kkprajaampat.com).
// Jadwal dan harga sengaja tidak ditulis (CLAUDE.md), karena sering berubah dan sumbernya berbeda-beda.
import { contact } from "./site.js";

/** Proyeksi peta bersama (garis-pantai.json): 1 satuan = 0,001 derajat, titik nol 0.06 LU 130.18 BT. */
export const toMap = (lat, lng) => [(lng - 130.18) * 1000, (0.06 - lat) * 1000];

/** Potongan peta rute [x, y, lebar, tinggi] dalam satuan peta: Waisai sampai Mansuar. */
export const CROP = [360, 425, 440, 300];

/** Pulau yang digambar di peta rute (Batanta, Arborek, dan Kepulauan Fam di luar potongan). */
export const MAP_ISLANDS = ["waigeo", "gam", "mansuar", "kri", "friwen", "lain"];

export const PLACES = {
  // Pelabuhan kapal cepat Waisai (data tanda "pelabuhan-waisai" peta bersama).
  waisai: toMap(-0.4325, 130.812),
  // Base Dragonet Divers, titik dari pemilik.
  base: toMap(contact.base.lat, contact.base.lng),
  // Arah ke Sorong (di luar potongan peta, tenggara Waisai).
  sorong: toMap(-0.882, 131.25),
};

/** Jalur perahu Waisai ke Kurkapa lewat perairan (dicek tidak memotong daratan di peramban). */
export const BOAT_ROUTE = [PLACES.waisai, [600, 525], [552, 572], [505, 603], [462, 626], PLACES.base];

/** Titik di tepi potongan tempat garis kapal cepat dari Sorong masuk. */
export function ferryEntry([x0, y0, w] = CROP, from = PLACES.waisai, to = PLACES.sorong) {
  const t = (x0 + w - from[0]) / (to[0] - from[0]);
  return [x0 + w, from[1] + (to[1] - from[1]) * t];
}

/** Letak titik peta sebagai persen dari potongan, untuk label HTML di atas gambar. */
export const percentIn = ([x, y], [x0, y0, w, h] = CROP) => ({ left: `${((x - x0) / w) * 100}%`, top: `${((y - y0) / h) * 100}%` });

export const steps = [
  {
    title: "Fly to Sorong",
    text: "Land at Domine Eduard Osok Airport (SOQ) in Sorong, the gateway to Raja Ampat. Most international travellers connect through Jakarta or Bali.",
  },
  {
    title: "Fast ferry to Waisai",
    text: "From Sorong harbour, the express ferry crosses to Waisai, the capital of Raja Ampat on Waigeo island, in about two hours. Tickets are sold at the harbour counter.",
  },
  {
    title: "Get your marine park entry card",
    text: "Every visitor needs a Raja Ampat Marine Park entry card before entering the protected waters. It is sold at the marine park office in Waisai and is valid for 12 months.",
    link: { href: "https://kkprajaampat.com/en/entry-card/", label: "Entry card details" },
  },
  {
    title: "Speedboat to Kurkapa",
    text: "Our base is in Kurkapa, a village on the north coast of Mansuar island, about an hour by speedboat from Waisai across the Dampier Strait. Message us before you travel to plan this last leg.",
  },
];
