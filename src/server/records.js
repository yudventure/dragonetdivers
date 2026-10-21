import "server-only";
import { randomBytes } from "node:crypto";
import { cleanRecord, recordDate } from "@/lib/records";
import { query } from "./db";

// Simpan dan baca catatan modul admin (tabel admin_records). Isi diperiksa skema (src/lib/records.js)
// sebelum disimpan; id berbentuk "<awalan>:<12 hex>", mis. "kas:3f2a9c0d1e4b".

const fromRow = (row) => ({
  ...JSON.parse(row.data),
  id: row.id,
  createdBy: row.created_by,
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
});

/** Catatan satu jenis, terbaru dulu; from/to menyaring ref_date (YYYY-MM-DD). */
export async function listRecords(kind, { from, to, limit = 5000 } = {}) {
  const where = ["kind = ?"];
  const params = [kind];
  if (from) {
    where.push("ref_date >= ?");
    params.push(from);
  }
  if (to) {
    where.push("ref_date <= ?");
    params.push(to);
  }
  const rows = await query(
    `SELECT id, data, created_by, created_at, updated_at FROM admin_records WHERE ${where.join(" AND ")} ORDER BY ref_date DESC, created_at DESC LIMIT ${Number(limit)}`,
    params,
  );
  return rows.map(fromRow);
}

export async function getRecord(kind, id) {
  const [row] = await query("SELECT id, data, created_by, created_at, updated_at FROM admin_records WHERE kind = ? AND id = ?", [kind, id]);
  return row ? fromRow(row) : null;
}

export const validId = (schema, id) => typeof id === "string" && new RegExp(`^${schema.prefix}:[0-9a-f]{12}$`).test(id);

/**
 * Simpan catatan baru (id null) atau ubah yang ada. Mengembalikan catatan tersimpan. RecordError dari
 * skema diteruskan ke pemanggil supaya pesannya tampil di form.
 */
export async function saveRecord(schema, id, input, { by = null, extra } = {}) {
  const record = cleanRecord(schema, input);
  if (extra) await extra(record, id);
  const data = JSON.stringify(record);
  const date = recordDate(schema, record);
  if (id) {
    const result = await query("UPDATE admin_records SET data = ?, ref_date = ? WHERE kind = ? AND id = ?", [data, date, schema.kind, id]);
    if (!result.affectedRows) throw Object.assign(new Error("Data tidak ditemukan. Muat ulang halaman."), { status: 404 });
    return getRecord(schema.kind, id);
  }
  const newId = `${schema.prefix}:${randomBytes(6).toString("hex")}`;
  await query("INSERT INTO admin_records (id, kind, ref_date, data, created_by) VALUES (?, ?, ?, ?, ?)", [newId, schema.kind, date, data, by]);
  return getRecord(schema.kind, newId);
}

export async function deleteRecord(kind, id) {
  const result = await query("DELETE FROM admin_records WHERE kind = ? AND id = ?", [kind, id]);
  return result.affectedRows > 0;
}

/** Jumlah catatan satu jenis yang merujuk id lain di kolom key (untuk mencegah hapus data yang dipakai). */
export async function countReferences(kind, key, id) {
  const rows = await query("SELECT data FROM admin_records WHERE kind = ? AND data LIKE ?", [kind, `%${id}%`]);
  return rows.filter((row) => JSON.parse(row.data)[key] === id).length;
}

/** Simpan catatan yang isinya sudah diperiksa pemanggil (absensi, slip gaji). */
export async function insertRaw(kind, prefix, date, data, by = null) {
  const id = `${prefix}:${randomBytes(6).toString("hex")}`;
  await query("INSERT INTO admin_records (id, kind, ref_date, data, created_by) VALUES (?, ?, ?, ?, ?)", [id, kind, date, JSON.stringify(data), by]);
  return id;
}

/** Hapus semua catatan satu jenis pada satu tanggal (absensi diganti per hari). */
export const deleteOnDate = (kind, date) => query("DELETE FROM admin_records WHERE kind = ? AND ref_date = ?", [kind, date]);
