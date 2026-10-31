// Isi galeri beranda (src/components/Gallery.jsx), urut dari kiri atas. Tiga jenis item:
//
//   { type: "photo", image: <impor .webp dari src/assets/gallery>, alt: { en, id }, size }
//   { type: "video", sources: [{ src, type }], poster: <impor .webp>, title: { en, id }, size }
//       Klip sendiri di public/media (MP4 + WebM, olah dengan brand/video/make-loop.py). Paling cepat
//       dan pasti diputar otomatis tanpa suara serta berulang.
//   { type: "embed", url: "<tautan YouTube, Shorts, TikTok, Instagram, atau Facebook>", title: { en, id }, size }
//       Tautan dibaca src/lib/video-embed.js. YouTube dan TikTok diputar otomatis dan berulang,
//       Facebook otomatis tanpa berulang, Instagram saat diketuk.
//
// Teks alt dan judul ditulis dalam English (en) dan Bahasa Indonesia (id).
// size: "small" (1×1), "wide" (2×1), "tall" (1×2, cocok untuk Shorts, TikTok, Reels), "big" (2×2).
// illustration: true menandai ilustrasi AI (BRANDING.md §7); selama masih ada, galeri menampilkan
// catatan bahwa foto dan video asli menyusul. Ganti dengan foto dan video asli begitu ada.
import learnDiver from "../assets/learn-diver.webp";
import mantaBelly from "../assets/gallery/manta-belly.webp";
import mantaSunrays from "../assets/gallery/manta-sunrays.webp";
import mantaPoster from "../assets/ocean-manta-loop.webp";
import * as koPack from "./locales/ko.js";
import * as zhPack from "./locales/zh.js";

export const gallery = [
  {
    type: "video",
    title: {
      en: "Reef manta ray gliding under the morning light",
      id: "Pari manta karang meluncur di bawah cahaya pagi",
    },
    sources: [
      { src: "/media/ocean-manta-loop.webm", type: "video/webm" },
      { src: "/media/ocean-manta-loop.mp4", type: "video/mp4" },
    ],
    poster: mantaPoster,
    size: "big",
    illustration: true,
  },
  {
    type: "photo",
    image: learnDiver,
    alt: {
      en: "Scuba diver giving the OK sign in clear blue water",
      id: "Penyelam memberi tanda OK di air biru yang jernih",
    },
    size: "tall",
    illustration: true,
  },
  {
    type: "photo",
    image: mantaBelly,
    alt: {
      en: "Reef manta ray passing overhead, its white spotted belly lit by the sun",
      id: "Pari manta karang melintas di atas, perut putihnya yang berbintik diterangi matahari",
    },
    size: "small",
    illustration: true,
  },
  {
    type: "photo",
    image: mantaSunrays,
    alt: {
      en: "Distant manta ray silhouette under sun rays in the open blue",
      id: "Siluet pari manta di kejauhan, di bawah sinar matahari di laut lepas",
    },
    size: "small",
    illustration: true,
  },
];

// Teks alt dan judul Mandarin dan Korea dari src/content/locales/, urut sama dengan item di atas.
gallery.forEach((item, i) => {
  const key = item.alt ? "alt" : "title";
  item[key] = { ...item[key], zh: zhPack.gallery[i], ko: koPack.gallery[i] };
});
