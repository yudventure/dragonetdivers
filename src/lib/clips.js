// Klip video unggahan untuk petak video galeri (permintaan pemilik 2 November 2026, tangkapan layar ponsel
// dengan tombol jeda YouTube di tengah petak Shorts DAMPIER: "hilangkan play dan pausenya dan buat autoplay
// dan loop"). Pemutar YouTube di layar sentuh memasang tombol play/pause sendiri yang tidak bisa dimatikan
// dari halaman (controls=0 tidak selalu dipatuhi), jadi satu-satunya cara pasti adalah video biasa
// (<video muted loop playsinline> tanpa controls) dari file yang diunggah tim di /admin/situs.
//
// File disimpan di database per bagian 1 MiB (tabel media_clips dan media_clip_parts, migrasi 009), supaya
// setiap permintaan unggah dan setiap baris tetap kecil (batas unggah hosting dan max_allowed_packet MySQL),
// lalu disajikan /api/clips/<id> dengan dukungan Range yang dibutuhkan Safari untuk memutar video.
// Fungsi murni, diuji tests/clips.test.js.

export const CLIP_PART = 1024 * 1024;
export const CLIP_MAX_MB = 40;
export const CLIP_MAX = CLIP_MAX_MB * 1024 * 1024;
/** Paling banyak sekian byte per jawaban Range terbuka ("bytes=0-"); peramban meminta sisanya sendiri. */
export const CLIP_CHUNK = 4 * CLIP_PART;
export const CLIP_TYPES = { "video/mp4": "MP4", "video/webm": "WebM", "video/quicktime": "MOV" };
/** Saran untuk tim: ukuran dan durasi yang masih ringan diputar berulang di ponsel. */
export const CLIP_ADVICE = { goodMb: 15, maxSeconds: 60 };

export class ClipError extends Error {}

export const isClipId = (value) => typeof value === "string" && /^[a-f0-9]{24}$/.test(value);

/** Jumlah bagian untuk file sebesar ini. */
export const partCount = (bytes) => Math.ceil(bytes / CLIP_PART);

/** Ukuran yang seharusnya untuk bagian ke-index (semua CLIP_PART, kecuali bagian terakhir). */
export function partSize(bytes, index) {
  const count = partCount(bytes);
  if (!Number.isInteger(index) || index < 0 || index >= count) return 0;
  return index < count - 1 ? CLIP_PART : bytes - CLIP_PART * (count - 1);
}

const whole = (value, min, max) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : null;
};

/** Data klip dari peramban admin sebelum diunggah: { name, mime, bytes, width, height, duration }. */
export function cleanClipInfo(input) {
  const mime = String(input?.mime ?? "").toLowerCase();
  if (!CLIP_TYPES[mime]) throw new ClipError("Pakai video MP4, WebM, atau MOV.");
  const bytes = Number(input?.bytes);
  if (!Number.isInteger(bytes) || bytes < 1) throw new ClipError("File video kosong.");
  if (bytes > CLIP_MAX) throw new ClipError(`Video maksimal ${CLIP_MAX_MB} MB. Potong videonya lebih pendek atau ekspor ulang dengan resolusi 720p.`);
  const name = String(input?.name ?? "video").replace(/[\u0000-\u001f]/g, "").slice(0, 150) || "video";
  const duration = Number(input?.duration);
  return {
    name,
    mime,
    bytes,
    width: whole(input?.width, 1, 10_000),
    height: whole(input?.height, 1, 10_000),
    duration: Number.isFinite(duration) && duration > 0 && duration < 36_000 ? Math.round(duration * 100) / 100 : null,
  };
}

/** Catatan untuk tim tentang klip yang dipilih: [{ level: "good" | "fair" | "bad", message }]. */
export function clipAdvice({ mime, bytes, duration, width, height }) {
  const notes = [];
  const mb = bytes / 1024 / 1024;
  if (mime === "video/quicktime") {
    notes.push({ level: "fair", message: "Video MOV dari iPhone kadang tidak berputar di ponsel Android. Lebih aman ekspor sebagai MP4 (H.264)." });
  }
  if (mb > CLIP_ADVICE.goodMb) {
    notes.push({ level: "fair", message: `Video ${mb.toFixed(0)} MB cukup berat untuk ponsel. Idealnya di bawah ${CLIP_ADVICE.goodMb} MB (720p, 10 sampai 30 detik).` });
  }
  if (duration > CLIP_ADVICE.maxSeconds) {
    notes.push({ level: "fair", message: `Durasi ${Math.round(duration)} detik. Klip berulang terasa paling halus bila 10 sampai 30 detik.` });
  }
  if (width && height && Math.max(width, height) < 640) {
    notes.push({ level: "bad", message: `Resolusi ${width} × ${height} px terlalu kecil, video akan tampak buram. Pakai minimal 720p.` });
  }
  if (!notes.length) notes.push({ level: "good", message: "Ukuran dan durasi video pas untuk diputar berulang di beranda." });
  return notes;
}

/**
 * Rentang byte dari kepala Range untuk file sebesar size.
 * - Tanpa Range (atau bentuk yang tidak didukung, mis. beberapa rentang): { start: 0, end: size - 1, partial: false }.
 * - Range sah: { start, end, partial: true }, rentang terbuka dibatasi CLIP_CHUNK byte.
 * - Range di luar file: null (jawab 416).
 */
export function byteRange(header, size, chunk = CLIP_CHUNK) {
  const full = { start: 0, end: size - 1, partial: false };
  if (typeof header !== "string" || !header.trim()) return full;
  const match = header.trim().match(/^bytes=(\d*)-(\d*)$/);
  if (!match || (match[1] === "" && match[2] === "")) return full;
  let start;
  let end;
  if (match[1] === "") {
    // Akhiran: "bytes=-500" = 500 byte terakhir.
    const suffix = Number(match[2]);
    if (suffix === 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    if (start >= size) return null;
    end = match[2] === "" ? Math.min(size - 1, start + chunk - 1) : Math.min(size - 1, Number(match[2]));
    if (end < start) return null;
  }
  return { start, end, partial: true };
}

/** Bagian pertama dan terakhir yang berisi byte start sampai end. */
export const partsOf = (start, end) => ({ first: Math.floor(start / CLIP_PART), last: Math.floor(end / CLIP_PART) });
