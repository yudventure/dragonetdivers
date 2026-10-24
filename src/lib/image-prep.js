// Persiapan foto di peramban sebelum diunggah ke galeri (/admin/situs): foto diperkecil ke paling lebar
// 2400 px dan dikompres (WebP, atau JPEG bila peramban tidak bisa membuat WebP), jadi yang dikirim
// biasanya di bawah 1 MB, bukan 5 sampai 15 MB dari kamera. Unggahan jadi cepat dan jarang gagal di
// jaringan lambat, dan server Hostinger tidak perlu mengolah file besar. Server tetap memeriksa dan
// mengolah ulang hasilnya (src/server/media.js). Bagian murni diuji di tests/image-prep.test.js.

/** Sisi terpanjang foto yang disimpan (sama dengan src/server/media.js). */
export const MAX_SIDE = 2400;
/** File yang sudah cukup kecil dikirim apa adanya supaya tidak dikompres dua kali. */
export const SMALL_FILE = 1.5 * 1024 * 1024;
/** File asli paling besar yang diterima. */
export const MAX_ORIGINAL = 40 * 1024 * 1024;
/** Batas file yang dikirim apa adanya bila peramban tidak bisa membaca fotonya (sama dengan server). */
export const MAX_UPLOAD = 15 * 1024 * 1024;
/** Foto paling banyak dalam satu kali unggah. */
export const MAX_BATCH = 40;

/** Ukuran baru yang muat dalam max × max dengan perbandingan sisi tetap (tidak pernah diperbesar). */
export function fitSize(width, height, max = MAX_SIDE) {
  if (!width || !height) return { width, height };
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Perlu diperkecil atau dikompres ulang? Foto kecil (JPEG/WebP, ukuran pas) dikirim apa adanya. */
export function needsResize({ width, height, size, type }) {
  if (!width || !height) return false;
  if (Math.max(width, height) > MAX_SIDE) return true;
  if (size > SMALL_FILE) return true;
  return !["image/jpeg", "image/webp"].includes(type);
}

/** Foto HEIC/HEIF dari iPhone (ditandai dari jenis atau nama file). */
export const isHeic = (file) => /hei[cf]/i.test(file?.type ?? "") || /\.hei[cf]$/i.test(file?.name ?? "");

/** Galat unggah yang layak dicoba lagi: jaringan putus (0), waktu habis, server sibuk atau galat sementara. */
export const isRetryable = (status) => status === 0 || status === 408 || status === 429 || status >= 500;

/** Jeda sebelum percobaan berikutnya: 1,5 detik, 4 detik, 10 detik. */
export const retryDelay = (attempt) => [1500, 4000, 10_000][Math.min(attempt, 2)];

/** Nama file hasil kompres: "IMG_1234.HEIC" → "IMG_1234.webp". */
export const renamed = (name, type) => `${String(name || "foto").replace(/\.[^.]+$/, "")}.${type === "image/webp" ? "webp" : "jpg"}`;

/** Gambar dari file (urutan rotasi EXIF diikuti). Null bila peramban tidak bisa membacanya. */
async function decode(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {} // lanjut ke <img>
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));

/**
 * Siapkan satu foto: { file, width, height } dengan width/height ukuran ASLI (untuk saran resolusi), atau
 * { error } bila foto tidak bisa dipakai. file = hasil kompres, atau file asli bila sudah kecil atau
 * peramban tidak bisa membacanya (server yang memutuskan).
 */
export async function prepareImage(file) {
  if (!file?.type?.startsWith("image/") && !isHeic(file)) return { error: "Bukan file foto." };
  if (file.size > MAX_ORIGINAL) return { error: "Foto lebih dari 40 MB." };
  const image = await decode(file);
  if (!image) {
    if (isHeic(file)) return { error: "Peramban ini tidak bisa membuka foto HEIC. Unggah lewat Safari di iPhone, atau simpan sebagai JPG dulu." };
    if (file.size > MAX_UPLOAD) return { error: "Foto ini tidak bisa dibaca peramban dan lebih dari 15 MB." };
    return { file, width: null, height: null };
  }
  const width = image.naturalWidth ?? image.width;
  const height = image.naturalHeight ?? image.height;
  try {
    if (!needsResize({ width, height, size: file.size, type: file.type })) return { file, width, height };
    const size = fitSize(width, height);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, size.width, size.height);
    let blob = await toBlob(canvas, "image/webp", 0.86);
    if (!blob || blob.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg", 0.88); // Safari lama
    canvas.width = canvas.height = 0; // lepas memori lebih cepat (iPhone)
    if (!blob || blob.size >= file.size) return file.size > MAX_UPLOAD ? { error: "Foto lebih dari 15 MB." } : { file, width, height };
    return { file: new File([blob], renamed(file.name, blob.type), { type: blob.type }), width, height };
  } finally {
    image.close?.();
  }
}
