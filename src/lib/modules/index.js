// Daftar semua jenis catatan modul admin (tabel admin_records). schemaFor(kind) dipakai API umum
// /api/admin/records dan form di src/admin/RecordManager.jsx.
import { reservation } from "./calendar.js";
import { transaction } from "./finance.js";
import { employee } from "./hr.js";
import { partner, post } from "./pr.js";
import { galleryItem } from "./site.js";

// Absensi dan slip gaji disimpan lewat API sendiri (/api/admin/hr), tidak lewat form umum.
const attendance = { kind: "attendance", prefix: "abs", noun: "absensi", internal: true, fields: [] };
const payslip = { kind: "payslip", prefix: "slp", noun: "slip gaji", internal: true, fields: [] };

export const SCHEMAS = Object.fromEntries(
  [reservation, transaction, employee, attendance, payslip, partner, post, galleryItem].map((s) => [s.kind, s]),
);

/** Skema yang bisa diubah lewat form umum, atau null. */
export const schemaFor = (kind) => (typeof kind === "string" && Object.hasOwn(SCHEMAS, kind) && !SCHEMAS[kind].internal ? SCHEMAS[kind] : null);
