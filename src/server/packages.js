import "server-only";
import { packageFromRow } from "@/lib/packages";
import { isDatabaseConfigured } from "./db-config.js";
import { query } from "./db";

// Paket di MySQL (tabel packages, database/migrations/002_packages.sql), diisi tim di /admin/paket.

const COLUMNS =
  "id, service, name_en, name_id, summary_en, summary_id, includes_en, includes_id, price_idr, unit, min_guests, max_guests, active, sort_order";
const ORDER = "ORDER BY sort_order, price_idr, id";

/**
 * Paket aktif sebuah layanan untuk halaman publik. Tanpa database (mis. build di CI) daftarnya kosong.
 * Saat build, database yang tidak bisa dihubungi juga dianggap kosong supaya build tetap jalan; saat
 * situs berjalan galatnya dilempar, jadi halaman ISR lama tetap tampil alih-alih daftar kosong.
 */
export async function activePackages(service) {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await query(`SELECT ${COLUMNS} FROM packages WHERE active = 1 AND service = ? ${ORDER}`, [service]);
    return rows.map(packageFromRow);
  } catch (error) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.warn(`[paket] database belum bisa dibaca saat build: ${error.code ?? error.message}`);
      return [];
    }
    throw error;
  }
}

export async function allPackages() {
  return (await query(`SELECT ${COLUMNS} FROM packages ORDER BY service, sort_order, price_idr, id`)).map(packageFromRow);
}

export async function packageById(id, { activeOnly = false } = {}) {
  if (!Number.isSafeInteger(id) || id < 1) return null;
  const [row] = await query(`SELECT ${COLUMNS} FROM packages WHERE id = ?${activeOnly ? " AND active = 1" : ""}`, [id]);
  return row ? packageFromRow(row) : null;
}

const values = (p) => [
  p.service,
  p.nameEn,
  p.nameId,
  p.summaryEn,
  p.summaryId,
  p.includesEn,
  p.includesId,
  p.price,
  p.unit,
  p.minGuests,
  p.maxGuests,
  p.active ? 1 : 0,
  p.sortOrder,
];

/** Simpan paket (hasil validatePackage); id null = paket baru. Mengembalikan id. */
export async function savePackage(id, pkg) {
  if (id) {
    const result = await query(
      "UPDATE packages SET service = ?, name_en = ?, name_id = ?, summary_en = ?, summary_id = ?, includes_en = ?, includes_id = ?, price_idr = ?, unit = ?, min_guests = ?, max_guests = ?, active = ?, sort_order = ? WHERE id = ?",
      [...values(pkg), id],
    );
    if (result.affectedRows === 0) throw new Error("Paket tidak ditemukan.");
    return id;
  }
  const result = await query(
    "INSERT INTO packages (service, name_en, name_id, summary_en, summary_id, includes_en, includes_id, price_idr, unit, min_guests, max_guests, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    values(pkg),
  );
  return Number(result.insertId);
}

/** Hapus paket. Pesanan lama tetap utuh karena menyimpan salinan nama dan harganya. */
export async function deletePackage(id) {
  const result = await query("DELETE FROM packages WHERE id = ?", [id]);
  return result.affectedRows > 0;
}
