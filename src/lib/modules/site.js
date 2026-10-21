// Situs web: galeri beranda yang diisi tim dari /admin/situs. Foto diunggah (tabel media) atau tautan
// video (YouTube, Shorts, TikTok, Instagram, Facebook; dibaca src/lib/video-embed.js). Selama belum ada
// item yang aktif, beranda memakai galeri bawaan di src/content/gallery.js.
import { parseVideoUrl } from "../video-embed.js";
import { RecordError } from "../records.js";

export const SIZES = [
  ["auto", "Otomatis (foto kecil, video tegak tinggi, video lain lebar)"],
  ["small", "Kecil (1×1)"],
  ["wide", "Lebar (2×1)"],
  ["tall", "Tinggi (1×2), cocok untuk Shorts, TikTok, Reels"],
  ["big", "Besar (2×2)"],
];

export const galleryItem = {
  kind: "gallery",
  prefix: "gal",
  noun: "item galeri",
  revalidate: ["/[lang]"],
  fields: [
    { key: "type", label: "Jenis", type: "select", required: true, options: [["photo", "Foto"], ["embed", "Tautan video"]], default: "photo", list: true },
    { key: "mediaId", label: "Foto", type: "text", max: 24, hidden: true },
    { key: "url", label: "Tautan video", type: "url", placeholder: "https://www.youtube.com/shorts/…", hint: "YouTube, Shorts, TikTok, Instagram, atau Facebook." },
    { key: "captionId", label: "Keterangan (Indonesia)", short: "Keterangan", type: "text", required: true, max: 120, list: true },
    { key: "captionEn", label: "Keterangan (English)", type: "text", required: true, max: 120 },
    { key: "size", label: "Ukuran petak", short: "Ukuran", type: "select", options: SIZES, default: "auto", list: true },
    { key: "order", label: "Urutan", type: "number", min: -999, max: 999, default: 0, list: true, hint: "Angka kecil tampil lebih dulu." },
    { key: "active", label: "Tampil", type: "boolean", default: true, checkLabel: "Tampil di beranda", list: true },
  ],
  check(r) {
    if (r.type === "photo") {
      if (!/^[a-f0-9]{24}$/.test(r.mediaId)) throw new RecordError("Unggah fotonya dulu.", "mediaId");
      r.url = "";
    } else {
      if (!r.url || !parseVideoUrl(r.url)) throw new RecordError("Tautan video tidak dikenali. Pakai tautan YouTube, Shorts, TikTok, Instagram, atau Facebook.", "url");
      r.mediaId = "";
    }
  },
};

/** Item galeri tersimpan → bentuk item galeri beranda (src/content/gallery.js). */
export function toGalleryItem(r) {
  // "auto": foto kecil; video dipilih Gallery.jsx (tegak = tinggi, lainnya lebar).
  const size = r.size !== "auto" && SIZES.some(([k]) => k === r.size) ? r.size : r.type === "photo" ? "small" : undefined;
  if (r.type === "photo") {
    const image = { src: `/api/media/${r.mediaId}`, width: r.width || 1600, height: r.height || 1200, blurDataURL: r.blur };
    return { type: "photo", image, alt: { en: r.captionEn, id: r.captionId }, size };
  }
  return { type: "embed", url: r.url, title: { en: r.captionEn, id: r.captionId }, size };
}

/** Item aktif, urut menurut kolom urutan lalu terbaru. */
export const activeGallery = (records) =>
  records
    .filter((r) => r.active)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(b.createdAt).localeCompare(String(a.createdAt)))
    .map(toGalleryItem);
