import "server-only";
import { query } from "./db";
import { getSetting, saveSetting } from "./settings";

// Formulir selam di database (tabel waivers, migrasi 008) dan teks perjanjian dari /admin/formulir
// (settings baris "waiver": { en, id, updatedAt }). Logika murni di src/lib/waiver.js.

export const DEFAULT_AGREEMENT = { en: "", id: "", updatedAt: "" };

export const getAgreement = () => getSetting("waiver", DEFAULT_AGREEMENT);

export async function saveAgreement({ en, id }) {
  const value = { en, id, updatedAt: new Date().toISOString() };
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
    data,
    ...(full ? { agreement: row.agreement ?? "", signature: row.signature, ip: row.ip ?? "", userAgent: row.user_agent ?? "" } : {}),
  };
}

/** Daftar formulir terbaru (tanpa tanda tangan), untuk /admin/formulir. */
export async function listWaivers(limit = 500) {
  const rows = await query(
    `SELECT code, order_code, locale, full_name, birth_date, nationality, email, phone, dive_date, clearance, minor, data, created_at
     FROM waivers ORDER BY created_at DESC, id DESC LIMIT ?`,
    [limit],
  );
  return rows.map((row) => fromRow(row));
}

/** Satu formulir lengkap dengan tanda tangan dan teks perjanjiannya. */
export async function waiverByCode(code) {
  const [row] = await query("SELECT * FROM waivers WHERE code = ?", [code]);
  return row ? fromRow(row, { full: true }) : null;
}

/** Jumlah formulir per pesanan ({ kode: jumlah }). */
export async function waiverCounts(orderCodes) {
  if (!orderCodes.length) return {};
  const rows = await query(
    `SELECT order_code, COUNT(*) AS n FROM waivers WHERE order_code IN (${orderCodes.map(() => "?").join(", ")}) GROUP BY order_code`,
    orderCodes,
  );
  return Object.fromEntries(rows.map((row) => [row.order_code, Number(row.n)]));
}
