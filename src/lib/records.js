// Mesin data modul admin (seperti src/server/records.js di Zanclus): setiap jenis catatan punya skema
// kolom, dan cleanRecord() memeriksa isian dari form sebelum disimpan di tabel admin_records sebagai
// JSON. Skema tiap modul ada di src/lib/modules/*.js. Fungsi murni, diuji di tests/records.test.js.

export class RecordError extends Error {
  constructor(message, field) {
    super(message);
    this.field = field;
  }
}

/** Tanggal hari ini di Raja Ampat (WIT), "YYYY-MM-DD". */
export const witDate = (now = new Date()) => new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
/** Bulan ini di WIT, "YYYY-MM". */
export const witMonth = (now = new Date()) => witDate(now).slice(0, 7);

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isDate = (value) => typeof value === "string" && DATE.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
export const isMonth = (value) => typeof value === "string" && MONTH.test(value) && Number(value.slice(5)) >= 1 && Number(value.slice(5)) <= 12;

/** Angka dari isian "1.500.000", "1500000", atau "1,5" (desimal koma). */
export function parseNumber(value, { decimals = false } = {}) {
  if (typeof value === "number") return value;
  let text = String(value ?? "").trim().replace(/\s|Rp|IDR/gi, "");
  if (!text) return null;
  if (decimals) text = text.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  else text = text.replace(/[.,](?=\d{3}(\D|$))/g, "");
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : NaN;
}

/** Nilai bersih untuk satu kolom; RecordError bila tidak sesuai. */
function cleanField(field, raw) {
  const { key, label, type = "text", required = false } = field;
  const empty = raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "");
  if (empty) {
    if (type === "boolean") return Boolean(field.default);
    if (required) throw new RecordError(`${label} wajib diisi.`, key);
    return type === "number" || type === "money" ? null : "";
  }
  switch (type) {
    case "text":
    case "textarea":
    case "phone": {
      const text = String(raw).trim();
      const max = field.max ?? (type === "textarea" ? 2000 : 160);
      if (text.length > max) throw new RecordError(`${label} maksimal ${max} karakter.`, key);
      if (type === "phone" && !/^[+\d][\d\s-]{5,24}$/.test(text)) throw new RecordError(`${label} berisi angka dengan kode negara, mis. +62 812 3456 7890.`, key);
      return text;
    }
    case "email": {
      const text = String(raw).trim().toLowerCase();
      if (text.length > 190 || !EMAIL.test(text)) throw new RecordError(`${label} bukan alamat email yang benar.`, key);
      return text;
    }
    case "url": {
      const text = String(raw).trim();
      try {
        const url = new URL(text);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
      } catch {
        throw new RecordError(`${label} harus alamat lengkap yang diawali https://`, key);
      }
      if (text.length > 500) throw new RecordError(`${label} terlalu panjang.`, key);
      return text;
    }
    case "number":
    case "money": {
      const number = parseNumber(raw, { decimals: type === "number" && field.decimals });
      if (!Number.isFinite(number)) throw new RecordError(`${label} harus berupa angka.`, key);
      if (type === "money" && !Number.isInteger(number)) throw new RecordError(`${label} ditulis dalam rupiah tanpa sen.`, key);
      const min = field.min ?? (type === "money" ? 0 : -1e12);
      const max = field.max ?? 1e12;
      if (number < min) throw new RecordError(`${label} paling kecil ${min}.`, key);
      if (number > max) throw new RecordError(`${label} paling besar ${max}.`, key);
      return field.decimals ? Math.round(number * 100) / 100 : Math.round(number);
    }
    case "date":
      if (!isDate(String(raw))) throw new RecordError(`${label} harus tanggal yang benar.`, key);
      return String(raw);
    case "month":
      if (!isMonth(String(raw))) throw new RecordError(`${label} harus bulan yang benar.`, key);
      return String(raw);
    case "time":
      if (!TIME.test(String(raw))) throw new RecordError(`${label} harus jam seperti 08:30.`, key);
      return String(raw);
    case "select": {
      const value = String(raw);
      if (!field.options.some(([option]) => option === value)) throw new RecordError(`Pilih ${label.toLowerCase()} dari daftar.`, key);
      return value;
    }
    case "boolean":
      return raw === true || raw === "true" || raw === "on" || raw === 1;
    case "ref": {
      const value = String(raw);
      if (!/^[a-z]+:[0-9a-f]{12}$/.test(value)) throw new RecordError(`Pilih ${label.toLowerCase()} dari daftar.`, key);
      return value;
    }
    default:
      throw new RecordError(`Jenis kolom tidak dikenal: ${type}`, key);
  }
}

/** Catatan bersih menurut skema ({ fields, check? }); hanya kolom di skema yang disimpan. */
export function cleanRecord(schema, input = {}) {
  const record = {};
  for (const field of schema.fields) record[field.key] = cleanField(field, input?.[field.key]);
  schema.check?.(record);
  return record;
}

/** Tanggal utama catatan untuk kolom ref_date (dari schema.dateField), atau null. */
export const recordDate = (schema, record) => (schema.dateField && isDate(record[schema.dateField]) ? record[schema.dateField] : null);

/** Label pilihan untuk kolom select. */
export const optionLabel = (field, value) => field.options?.find(([option]) => option === value)?.[1] ?? value;

/** Hari pertama dan terakhir sebuah bulan "YYYY-MM". */
export function monthRange(month) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
}

/** Bulan sebelum/sesudah "YYYY-MM". */
export function shiftMonth(month, by) {
  const [y, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + by, 1));
  return date.toISOString().slice(0, 7);
}

/** "Oktober 2026" */
export const monthLabel = (month) =>
  new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));

/** "Rp 1.500.000" */
export const rupiah = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n ?? 0);

/** "Sab, 31 Okt 2026" */
export const shortDay = (date) =>
  new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
