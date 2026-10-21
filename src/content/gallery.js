// Isi galeri beranda (src/components/Gallery.jsx), urut dari kiri atas. Tiga jenis item:
//
//   { type: "photo", image: <impor .webp dari src/assets/gallery>, alt, size }
//   { type: "video", sources: [{ src, type }], poster: <impor .webp>, title, size }
//       Klip sendiri di public/media (MP4 + WebM, olah dengan brand/video/make-loop.py). Paling cepat
//       dan pasti diputar otomatis tanpa suara serta berulang.
//   { type: "embed", url: "<tautan YouTube, Shorts, TikTok, Instagram, atau Facebook>", title, size }
//       Tautan dibaca src/lib/video-embed.js. YouTube dan TikTok diputar otomatis dan berulang,
//       Facebook otomatis tanpa berulang, Instagram saat diketuk.
//
// size: "small" (1×1), "wide" (2×1), "tall" (1×2, cocok untuk Shorts, TikTok, Reels), "big" (2×2).
// illustration: true menandai ilustrasi AI (BRANDING.md §7); selama masih ada, galeri menampilkan
// catatan bahwa foto dan video asli menyusul. Ganti dengan foto dan video asli begitu ada.
import learnDiver from "../assets/learn-diver.webp";
import mantaBelly from "../assets/gallery/manta-belly.webp";
import mantaSunrays from "../assets/gallery/manta-sunrays.webp";
import mantaPoster from "../assets/ocean-manta-loop.webp";

export const gallery = [
  {
    type: "video",
    title: "Reef manta ray gliding under the morning light",
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
    alt: "Scuba diver giving the OK sign in clear blue water",
    size: "tall",
    illustration: true,
  },
  {
    type: "photo",
    image: mantaBelly,
    alt: "Reef manta ray passing overhead, its white spotted belly lit by the sun",
    size: "small",
    illustration: true,
  },
  {
    type: "photo",
    image: mantaSunrays,
    alt: "Distant manta ray silhouette under sun rays in the open blue",
    size: "small",
    illustration: true,
  },
];
