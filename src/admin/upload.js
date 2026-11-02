import { isRetryable, retryDelay } from "@/lib/image-prep";

// Unggah satu foto ke /api/admin/media dengan progres (XMLHttpRequest) dan coba ulang otomatis bila
// jaringan putus, waktu habis, atau server sedang sibuk (sampai 4 kali, jeda 1,5 s, 4 s, 10 s). Galat isian
// (mis. bukan foto) tidak dicoba ulang. Dipakai panel unggah banyak foto dan form galeri di /admin/situs.

const ATTEMPTS = 4;
const TIMEOUT_MS = 120_000;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function send(file, onProgress) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media");
    xhr.timeout = TIMEOUT_MS;
    xhr.upload.onprogress = (event) => event.lengthComputable && onProgress?.(event.loaded / event.total);
    const body = () => {
      try {
        return JSON.parse(xhr.responseText);
      } catch {
        return {};
      }
    };
    xhr.onload = () => resolve({ status: xhr.status, body: body() });
    xhr.onerror = () => resolve({ status: 0, body: {} });
    xhr.ontimeout = () => resolve({ status: 408, body: {} });
    const form = new FormData();
    form.append("file", file, file.name);
    xhr.send(form);
  });
}

/** { id, width, height } foto tersimpan, atau Error dengan pesan untuk tim. onRetry(n) saat mencoba lagi. */
export async function uploadPhoto(file, { onProgress, onRetry } = {}) {
  for (let attempt = 0; ; attempt++) {
    const { status, body } = await send(file, onProgress);
    if (status >= 200 && status < 300 && body.id) return body;
    if (status === 401) throw new Error("Sesi admin berakhir. Masuk lagi, lalu unggah ulang foto ini.");
    if (!isRetryable(status) || attempt >= ATTEMPTS - 1) {
      throw new Error(body.error || (status === 0 ? "Koneksi terputus. Periksa internet lalu coba lagi." : "Foto belum terunggah. Coba lagi."));
    }
    onRetry?.(attempt + 1);
    onProgress?.(0);
    await wait(retryDelay(attempt));
  }
}

/** Hapus foto yang terunggah tapi batal disimpan (tidak menunggu, galat diabaikan). */
export const discardUpload = (id) => fetch(`/api/admin/media?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});

/** Simpan banyak foto galeri sekaligus; "" bila berhasil, atau pesan galat. */
export async function saveGalleryPhotos(items) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch("/api/admin/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    }).catch(() => null);
    const result = (await response?.json().catch(() => ({}))) ?? {};
    if (response?.ok) return "";
    if (!isRetryable(response?.status ?? 0) || attempt >= 2) {
      return result.error ? `${result.index != null ? `Foto ke-${result.index + 1}: ` : ""}${result.error}` : "Galeri belum tersimpan. Coba lagi.";
    }
    await wait(retryDelay(attempt));
  }
}

/** Alamat gambar kecil lewat pengecil gambar Next.js (bukan file 2400 px utuh), untuk daftar di admin. */
export const thumbUrl = (src, width = 640) => `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;

// Klip video galeri (src/lib/clips.js): dikirim per 1 MiB berurutan, tiap bagian dicoba ulang sendiri, supaya
// video puluhan MB tetap terunggah lewat koneksi ponsel dan batas unggah hosting.
const VIDEO_TYPES = { mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime", webm: "video/webm" };

/** Jenis video yang didukung dari file (dari tipe peramban, atau ekstensinya), atau "". */
export function videoType(file) {
  const type = String(file?.type || "").toLowerCase();
  if (type === "video/x-m4v") return "video/mp4";
  if (Object.values(VIDEO_TYPES).includes(type)) return type;
  return VIDEO_TYPES[String(file?.name || "").split(".").pop().toLowerCase()] ?? "";
}

/** Ukuran dan durasi video dari file, atau null bila peramban tidak bisa membacanya. */
export function readVideo(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      resolve(result);
    };
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () =>
      done(video.videoWidth > 0 ? { width: video.videoWidth, height: video.videoHeight, duration: Number.isFinite(video.duration) ? video.duration : null } : null);
    video.onerror = () => done(null);
    setTimeout(() => done(null), 20_000);
    video.src = url;
  });
}

async function call(url, init) {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, init).catch(() => null);
    const status = response?.status ?? 0;
    const body = (await response?.json().catch(() => ({}))) ?? {};
    if (response?.ok) return body;
    if (status === 401) throw new Error("Sesi admin berakhir. Masuk lagi, lalu unggah ulang videonya.");
    if (!isRetryable(status) || attempt >= ATTEMPTS - 1) {
      throw new Error(body.error || (status === 0 ? "Koneksi terputus. Periksa internet lalu coba lagi." : "Video belum terunggah. Coba lagi."));
    }
    await wait(retryDelay(attempt));
  }
}

/** Unggah klip; { id, width, height, duration } bila berhasil, atau Error dengan pesan untuk tim. */
export async function uploadClip(file, info, { onProgress } = {}) {
  const { id, parts, partSize } = await call("/api/admin/clips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...info, name: file.name, bytes: file.size }),
  });
  try {
    for (let i = 0; i < parts; i++) {
      const body = file.slice(i * partSize, Math.min(file.size, (i + 1) * partSize));
      await call(`/api/admin/clips/${id}?part=${i}`, { method: "PUT", headers: { "Content-Type": "application/octet-stream" }, body });
      onProgress?.((i + 1) / parts);
    }
    return { id, ...(await call(`/api/admin/clips/${id}`, { method: "POST" })) };
  } catch (e) {
    discardClip(id);
    throw e;
  }
}

/** Hapus klip yang terunggah tapi batal dipakai (tidak menunggu, galat diabaikan). */
export const discardClip = (id) => fetch(`/api/admin/clips?id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => {});
