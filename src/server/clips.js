import "server-only";
import { randomBytes } from "node:crypto";
import { CLIP_PART, ClipError, cleanClipInfo, partCount, partSize, partsOf } from "@/lib/clips";
import { query } from "./db";

// Klip video galeri di database (tabel media_clips + media_clip_parts, migrasi 009; logika src/lib/clips.js).
// Alur unggah dari /admin/situs: createClip (data file) → savePart per 1 MiB → finishClip. Klip yang tidak
// pernah selesai diunggah dihapus sehari kemudian saat ada unggahan baru.

/** Mulai klip baru; mengembalikan { id, parts, partSize }. */
export async function createClip(input) {
  const info = cleanClipInfo(input);
  await query("DELETE p FROM media_clip_parts p JOIN media_clips c ON c.id = p.clip_id WHERE c.complete = 0 AND c.created_at < NOW() - INTERVAL 1 DAY").catch(() => {});
  await query("DELETE FROM media_clips WHERE complete = 0 AND created_at < NOW() - INTERVAL 1 DAY").catch(() => {});
  const id = randomBytes(12).toString("hex");
  const parts = partCount(info.bytes);
  await query("INSERT INTO media_clips (id, name, mime, bytes, parts, width, height, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
    id,
    info.name,
    info.mime,
    info.bytes,
    parts,
    info.width,
    info.height,
    info.duration,
  ]);
  return { id, parts, partSize: CLIP_PART };
}

const meta = async (id) => (await query("SELECT id, mime, bytes, parts, width, height, duration, complete FROM media_clips WHERE id = ?", [id]))[0] ?? null;

/** Simpan satu bagian (boleh dikirim ulang). */
export async function savePart(id, index, data) {
  const clip = await meta(id);
  if (!clip) throw new ClipError("Unggahan video tidak ditemukan. Pilih videonya lagi.");
  if (clip.complete) throw new ClipError("Video ini sudah selesai diunggah.");
  const expected = partSize(Number(clip.bytes), index);
  if (!expected || data.length !== expected) throw new ClipError("Potongan video tidak utuh. Coba unggah lagi.");
  await query("INSERT INTO media_clip_parts (clip_id, part, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)", [id, index, data]);
}

/** Tandai selesai bila semua bagian sudah masuk; mengembalikan data klip. */
export async function finishClip(id) {
  const clip = await meta(id);
  if (!clip) throw new ClipError("Unggahan video tidak ditemukan. Pilih videonya lagi.");
  const [{ n }] = await query("SELECT COUNT(*) AS n FROM media_clip_parts WHERE clip_id = ?", [id]);
  if (Number(n) !== Number(clip.parts)) throw new ClipError("Sebagian video belum terunggah. Coba lagi.");
  await query("UPDATE media_clips SET complete = 1 WHERE id = ?", [id]);
  return { id, width: clip.width, height: clip.height, duration: clip.duration == null ? null : Number(clip.duration) };
}

/** Data klip yang sudah lengkap (untuk disajikan), atau null. */
export async function readyClip(id) {
  const clip = await meta(id);
  return clip?.complete ? { mime: clip.mime, bytes: Number(clip.bytes) } : null;
}

/** Byte start sampai end (inklusif) dari klip. */
export async function clipBytes(id, start, end) {
  const { first, last } = partsOf(start, end);
  const rows = await query("SELECT part, data FROM media_clip_parts WHERE clip_id = ? AND part BETWEEN ? AND ? ORDER BY part", [id, first, last]);
  if (rows.length !== last - first + 1) throw new Error("bagian klip hilang");
  const joined = Buffer.concat(rows.map((row) => row.data));
  const offset = start - first * CLIP_PART;
  return joined.subarray(offset, offset + (end - start + 1));
}

/** Ukuran klip lengkap: { id: { width, height } }. */
export async function clipInfo(ids) {
  if (!ids.length) return {};
  const rows = await query(`SELECT id, width, height FROM media_clips WHERE complete = 1 AND id IN (${ids.map(() => "?").join(",")})`, ids);
  return Object.fromEntries(rows.map((r) => [r.id, { width: r.width, height: r.height }]));
}

export async function deleteClip(id) {
  await query("DELETE FROM media_clip_parts WHERE clip_id = ?", [id]);
  await query("DELETE FROM media_clips WHERE id = ?", [id]);
}
