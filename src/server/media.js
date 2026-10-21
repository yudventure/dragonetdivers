import "server-only";
import { randomBytes } from "node:crypto";
import { query } from "./db";

// Foto unggahan tim (tabel media, migrasi 006), dipakai galeri beranda. Diperkecil dengan sharp (ikut
// terpasang bersama Next.js) ke WebP paling lebar 2400 px, plus gambar buram kecil untuk placeholder.
// Tanpa sharp, JPEG/PNG/WebP sampai 4 MB disimpan apa adanya.

export const MAX_UPLOAD = 15 * 1024 * 1024;
const MAX_RAW = 4 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif"];
// Placeholder netral (foam) bila gambar buram tidak bisa dibuat.
export const FALLBACK_BLUR = "data:image/gif;base64,R0lGODlhAQABAIAAAPT5+gAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";

let loading = null;
const sharpLibrary = () => {
  loading ??= import("sharp")
    .then(({ default: sharp }) => {
      sharp.concurrency(1); // hosting bersama: satu utas saja
      sharp.cache(false);
      return sharp;
    })
    .catch(() => null);
  return loading;
};

export class MediaError extends Error {}

/** Simpan satu file gambar; mengembalikan { id, width, height, blur }. */
export async function saveImage(file) {
  if (!file || typeof file.arrayBuffer !== "function") throw new MediaError("Pilih file foto.");
  if (file.size > MAX_UPLOAD) throw new MediaError("Foto maksimal 15 MB.");
  if (file.type && !TYPES.includes(file.type)) throw new MediaError("Pakai foto JPG, PNG, WebP, atau HEIC.");
  const input = Buffer.from(await file.arrayBuffer());
  const sharp = await sharpLibrary();
  let data = input;
  let mime = file.type || "image/jpeg";
  let width = null;
  let height = null;
  let blur = null;
  if (sharp) {
    try {
      const image = sharp(input, { failOn: "error" }).rotate().resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true });
      const result = await image.webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
      data = result.data;
      mime = "image/webp";
      width = result.info.width;
      height = result.info.height;
      const tiny = await sharp(data).resize(16, 16, { fit: "inside" }).webp({ quality: 40 }).toBuffer();
      blur = `data:image/webp;base64,${tiny.toString("base64")}`;
    } catch {
      throw new MediaError("File ini tidak bisa dibaca sebagai foto.");
    }
  } else if (input.length > MAX_RAW || !["image/jpeg", "image/png", "image/webp"].includes(mime)) {
    throw new MediaError("Server belum bisa memperkecil foto. Unggah JPG, PNG, atau WebP di bawah 4 MB.");
  }
  if (data.length > 15 * 1024 * 1024) throw new MediaError("Foto terlalu besar setelah diproses.");
  const id = randomBytes(12).toString("hex");
  const name = String(file.name || "foto").slice(0, 150);
  await query("INSERT INTO media (id, name, mime, width, height, bytes, blur, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [id, name, mime, width, height, data.length, blur, data]);
  return { id, width, height, blur };
}

export async function readImage(id) {
  const [row] = await query("SELECT mime, data FROM media WHERE id = ?", [id]);
  return row ?? null;
}

/** Ukuran dan placeholder beberapa foto: { id: { width, height, blur } }. */
export async function imageInfo(ids) {
  if (!ids.length) return {};
  const rows = await query(`SELECT id, width, height, blur FROM media WHERE id IN (${ids.map(() => "?").join(",")})`, ids);
  return Object.fromEntries(rows.map((r) => [r.id, { width: r.width, height: r.height, blur: r.blur }]));
}

export const deleteImage = (id) => query("DELETE FROM media WHERE id = ?", [id]);
