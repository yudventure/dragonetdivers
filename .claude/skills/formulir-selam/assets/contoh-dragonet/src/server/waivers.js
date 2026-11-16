import "server-only";
import { query } from "./db";
import { FALLBACK_BLUR, imageInfo } from "./media";
import { getSetting, saveSetting } from "./settings";

// Formulir selam di database (tabel waivers, migrasi 008) dan teks perjanjian dari /admin/formulir/pengaturan
// (settings baris "waiver": { en, id, zh, ko, updatedAt }). Logika murni di src/lib/waiver.js.

export const DEFAULT_AGREEMENT = { en: "", id: "", zh: "", ko: "", updatedAt: "" };

export const getAgreement = () => getSetting("waiver", DEFAULT_AGREEMENT);

/**
 * Foto di panel kiri /waiver yang dipilih tim dari galeri di /admin/formulir/pengaturan (settings baris "waiver_photo",
 * { mediaId }): gambar next/image, atau null (pakai foto bawaan) bila belum dipilih atau fotonya sudah dihapus.
 */
export async function waiverPhoto() {
  const { mediaId } = await getSetting("waiver_photo", { mediaId: "" });
  if (!/^[a-f0-9]{24}$/.test(mediaId ?? "")) return null;
  const info = (await imageInfo([mediaId]))[mediaId];
  return info ? { src: `/api/media/${mediaId}`, width: info.width || 1600, height: info.height || 1200, blurDataURL: info.blur || FALLBACK_BLUR } : null;
}

export const saveWaiverPhoto = (mediaId) => saveSetting("waiver_photo", { mediaId: mediaId ?? "" });

/** Simpan teks perjanjian yang sudah dibersihkan (cleanAgreement): { en, id, zh, ko }. */
export async function saveAgreement({ en, id, zh, ko }) {
  const value = { en, id, zh, ko, updatedAt: new Date().toISOString() };
  await saveSetting("waiver", value);
  return value;
}

/** Simpan formulir yang sudah dibersihkan (cleanWaiver). */
export async function createWaiver(code, w, { lang, agreement, ip, userAgent }) {
  const { signature, ...data } = w;
  await query(
    `INSERT INTO waivers (code, order_code, locale, full_name, birth_date, nationality, email, phone, dive_date, clearance, minor, data, agreement, signature, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      code,
      w.order || null,
      lang,
      w.fullName,
      w.birthDate,
      w.nationality,
      w.email || null,
      w.phone || null,
      w.date,
      w.clearance ? 1 : 0,
      w.minor ? 1 : 0,
      JSON.stringify(data),
      agreement || null,
      signature,
      ip ? String(ip).slice(0, 64) : null,
      userAgent ? String(userAgent).slice(0, 255) : null,
    ],
  );
}

const iso = (value) => (value instanceof Date ? value.toISOString() : value ? String(value) : "");
const day = (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value ? String(value).slice(0, 10) : "");

function fromRow(row, { full = false } = {}) {
  let data = {};
  try {
    data = JSON.parse(row.data);
  } catch {
    data = {};
  }
  return {
    code: row.code,
    order: row.order_code ?? "",
    lang: row.locale,
    name: row.full_name,
    birthDate: day(row.birth_date),
    nationality: row.nationality,
    email: row.email ?? "",
    phone: row.phone ?? "",
    date: day(row.dive_date),
    clearance: Boolean(row.clearance),
    minor: Boolean(row.minor),
    createdAt: iso(row.created_at),
    arrival: row.arrival ?? "",
    arrivalAt: iso(row.arrival_at),
    arrivalBy: row.arrival_by ?? "",
    trashedAt: iso(row.trashed_at),
    trashedBy: row.trashed_by ?? "",
    data,
    ...(full ? { agreement: row.agreement ?? "", signature: row.signature, ip: row.ip ?? "", userAgent: row.user_agent ?? "" } : {}),
  };
}

// Kolom daftar (tanpa tanda tangan) beserta konfirmasi kedatangan dan sampah (tabel waiver_status, migrasi 011).
const LIST_COLUMNS = `w.code, w.order_code, w.locale, w.full_name, w.birth_date, w.nationality, w.email, w.phone, w.dive_date, w.clearance,
  w.minor, w.data, w.created_at, s.arrival, s.arrival_at, s.arrival_by, s.trashed_at, s.trashed_by`;
const WITH_STATUS = "FROM waivers w LEFT JOIN waiver_status s ON s.code = w.code";

/**
 * Daftar formulir terbaru untuk meja peninjauan /admin/formulir. trashed = true: isi sampah (yang terakhir
 * dipindahkan di atas); selain itu formulir di sampah tidak ikut.
 */
export async function listWaivers(limit = 2000, { trashed = false } = {}) {
  const rows = await query(
    `SELECT ${LIST_COLUMNS} ${WITH_STATUS}
     WHERE s.trashed_at IS ${trashed ? "NOT NULL" : "NULL"}
     ORDER BY ${trashed ? "s.trashed_at DESC," : ""} w.created_at DESC, w.id DESC LIMIT ?`,
    [limit],
  );
  return rows.map((row) => fromRow(row));
}

/** Formulir dengan kode tertentu (termasuk yang di sampah), urut dari yang paling lama, untuk spreadsheet. */
export async function listWaiversByCodes(codes) {
  if (!codes.length) return [];
  const rows = await query(
    `SELECT ${LIST_COLUMNS} ${WITH_STATUS} WHERE w.code IN (${codes.map(() => "?").join(", ")}) ORDER BY w.created_at, w.id`,
    codes,
  );
  return rows.map((row) => fromRow(row));
}

/** Jumlah formulir di luar sampah, dan jumlah di sampah. */
export async function waiverTotal() {
  const [row] = await query(`SELECT COUNT(*) AS n ${WITH_STATUS} WHERE s.trashed_at IS NULL`);
  return Number(row?.n ?? 0);
}

export async function trashCount() {
  const [row] = await query("SELECT COUNT(*) AS n FROM waiver_status WHERE trashed_at IS NOT NULL");
  return Number(row?.n ?? 0);
}

/** Simpan konfirmasi kedatangan (arrival sudah diperiksa isArrival). by = email operator. */
export async function setArrival(code, arrival, by) {
  const result = await query(
    `INSERT INTO waiver_status (code, arrival, arrival_at, arrival_by)
     SELECT code, ?, ${arrival ? "UTC_TIMESTAMP()" : "NULL"}, ? FROM waivers WHERE code = ?
     ON DUPLICATE KEY UPDATE arrival = VALUES(arrival), arrival_at = VALUES(arrival_at), arrival_by = VALUES(arrival_by)`,
    [arrival, arrival ? by : null, code],
  );
  return result.affectedRows > 0;
}

/** Pindahkan ke sampah, hanya bila tamu tidak datang atau formulir uji coba (canTrash). */
export async function trashWaiver(code, by) {
  const result = await query(
    "UPDATE waiver_status SET trashed_at = UTC_TIMESTAMP(), trashed_by = ? WHERE code = ? AND arrival IN ('tidak', 'uji') AND trashed_at IS NULL",
    [by, code],
  );
  return result.affectedRows > 0;
}

export async function restoreWaiver(code) {
  const result = await query("UPDATE waiver_status SET trashed_at = NULL, trashed_by = NULL WHERE code = ? AND trashed_at IS NOT NULL", [code]);
  return result.affectedRows > 0;
}

/** Hapus permanen formulir yang sudah di sampah (beserta catatan status dan pengiriman spreadsheetnya). */
export async function deleteWaiver(code) {
  const [row] = await query("SELECT code FROM waiver_status WHERE code = ? AND trashed_at IS NOT NULL", [code]);
  if (!row) return false;
  await query("DELETE FROM waivers WHERE code = ?", [code]);
  await query("DELETE FROM waiver_status WHERE code = ?", [code]);
  await query("DELETE FROM waiver_sheet_sync WHERE code = ?", [code]);
  return true;
}

/** Satu formulir lengkap dengan tanda tangan dan teks perjanjiannya. */
export async function waiverByCode(code) {
  const [row] = await query(
    `SELECT w.*, s.arrival, s.arrival_at, s.arrival_by, s.trashed_at, s.trashed_by ${WITH_STATUS} WHERE w.code = ?`,
    [code],
  );
  return row ? fromRow(row, { full: true }) : null;
}

/** Jumlah formulir per pesanan ({ kode: jumlah }), tanpa yang di sampah. */
export async function waiverCounts(orderCodes) {
  if (!orderCodes.length) return {};
  const rows = await query(
    `SELECT w.order_code, COUNT(*) AS n ${WITH_STATUS}
     WHERE s.trashed_at IS NULL AND w.order_code IN (${orderCodes.map(() => "?").join(", ")}) GROUP BY w.order_code`,
    orderCodes,
  );
  return Object.fromEntries(rows.map((row) => [row.order_code, Number(row.n)]));
}
