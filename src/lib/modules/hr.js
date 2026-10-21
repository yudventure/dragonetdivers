// HRD (mengikuti Zanclus hr-model): data pegawai, absensi harian, dan slip gaji bulanan yang dihitung
// dari absensi. Pegawai harian dibayar per hari hadir; pegawai lain gaji pokok dikurangi potongan alpa.
import { RecordError } from "../records.js";

export const EMPLOYMENT = [
  ["tetap", "Pegawai tetap"],
  ["kontrak", "Kontrak"],
  ["harian", "Harian lepas"],
  ["magang", "Magang"],
];

export const employee = {
  kind: "employee",
  prefix: "kry",
  noun: "pegawai",
  fields: [
    { key: "name", label: "Nama lengkap", short: "Nama", type: "text", required: true, max: 80, list: true },
    { key: "position", label: "Jabatan", type: "text", required: true, max: 60, list: true, hint: "Mis. Instruktur, Dive guide, Kapten perahu, Admin" },
    { key: "type", label: "Status kerja", type: "select", required: true, options: EMPLOYMENT, default: "tetap", list: true },
    { key: "joinDate", label: "Mulai bekerja", type: "date", required: true },
    { key: "contractEnd", label: "Kontrak berakhir", type: "date" },
    { key: "phone", label: "WhatsApp / telepon", type: "phone", list: true },
    { key: "email", label: "Email", type: "email" },
    { key: "nik", label: "NIK (KTP)", type: "text", max: 16 },
    { key: "certification", label: "Sertifikasi selam", type: "text", max: 120, hint: "Mis. Open Water Scuba Instructor, nomor dan masa berlaku" },
    { key: "base", label: "Gaji pokok per bulan (Rp)", type: "money" },
    { key: "dailyRate", label: "Upah per hari (Rp)", type: "money", hint: "Untuk pegawai harian lepas." },
    { key: "absentDeduction", label: "Potongan per hari alpa (Rp)", type: "money" },
    { key: "allowance", label: "Tunjangan tetap per bulan (Rp)", type: "money" },
    { key: "allowanceNote", label: "Keterangan tunjangan", type: "text", max: 60, hint: "Mis. makan, transport" },
    { key: "deduction", label: "Potongan tetap per bulan (Rp)", type: "money" },
    { key: "deductionNote", label: "Keterangan potongan", type: "text", max: 60, hint: "Mis. BPJS bagian pegawai, kasbon" },
    { key: "bpjsKesehatan", label: "BPJS Kesehatan", type: "boolean", checkLabel: "Terdaftar" },
    { key: "bpjsKetenagakerjaan", label: "BPJS Ketenagakerjaan", type: "boolean", checkLabel: "Terdaftar" },
    { key: "bankName", label: "Bank", type: "text", max: 40 },
    { key: "bankAccount", label: "Nomor rekening", type: "text", max: 34 },
    { key: "bankHolder", label: "Atas nama", type: "text", max: 80 },
    { key: "leaveDays", label: "Jatah cuti per tahun", type: "number", min: 0, max: 60, default: 12 },
    { key: "active", label: "Aktif", type: "boolean", default: true, checkLabel: "Masih bekerja" },
    { key: "notes", label: "Catatan", type: "textarea", max: 300, wide: true },
  ],
  usedBy: [{ kind: "attendance", key: "employeeId", noun: "catatan absensi" }],
  check(r) {
    if (r.contractEnd && r.contractEnd < r.joinDate) throw new RecordError("Kontrak berakhir tidak boleh sebelum mulai bekerja.", "contractEnd");
    if (r.nik && !/^\d{16}$/.test(r.nik)) throw new RecordError("NIK berisi 16 angka.", "nik");
    if (r.bankAccount && !/^\d{4,34}$/.test(r.bankAccount.replace(/[\s-]/g, ""))) throw new RecordError("Nomor rekening hanya angka.", "bankAccount");
    if (r.type === "harian" && !r.dailyRate) throw new RecordError("Isi upah per hari untuk pegawai harian.", "dailyRate");
    r.leaveDays ??= 12;
  },
};

export const ATTENDANCE = [
  ["hadir", "Hadir"],
  ["izin", "Izin"],
  ["sakit", "Sakit"],
  ["cuti", "Cuti"],
  ["alpa", "Tanpa keterangan"],
  ["libur", "Libur"],
];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Isian absensi satu hari ({ date, rows: [{ employeeId, status, timeIn, timeOut, note }] }). */
export function validateAttendance(input, employeeIds) {
  const date = String(input?.date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new RecordError("Pilih tanggal absensi.", "date");
  if (!Array.isArray(input.rows) || input.rows.length > 300) throw new RecordError("Data absensi tidak valid.");
  return {
    date,
    rows: input.rows
      .filter((row) => row && row.status)
      .map((row) => {
        if (!employeeIds.includes(row.employeeId)) throw new RecordError("Ada pegawai yang sudah dihapus. Muat ulang halaman.");
        if (!ATTENDANCE.some(([k]) => k === row.status)) throw new RecordError("Status absensi tidak dikenal.");
        const hadir = row.status === "hadir";
        const timeIn = hadir && row.timeIn ? String(row.timeIn) : "";
        const timeOut = hadir && row.timeOut ? String(row.timeOut) : "";
        if ((timeIn && !TIME.test(timeIn)) || (timeOut && !TIME.test(timeOut))) throw new RecordError("Jam ditulis seperti 08:30.");
        const note = String(row.note ?? "").trim().slice(0, 120);
        return { employeeId: row.employeeId, date, status: row.status, timeIn, timeOut, note };
      }),
  };
}

/** Rekap absensi per pegawai: { employeeId: { hadir, izin, ... } }. */
export function attendanceRecap(rows) {
  const recap = {};
  for (const row of rows) {
    recap[row.employeeId] ??= Object.fromEntries(ATTENDANCE.map(([k]) => [k, 0]));
    recap[row.employeeId][row.status] += 1;
  }
  return recap;
}

/** Slip gaji satu pegawai untuk satu bulan dari data pegawai dan rekap absensinya. */
export function computePayslip(emp, recap = {}) {
  const hadir = recap.hadir ?? 0;
  const alpa = recap.alpa ?? 0;
  const lines = [];
  let basePay;
  if (emp.type === "harian") {
    basePay = (emp.dailyRate ?? 0) * hadir;
    lines.push({ label: `Upah ${hadir} hari hadir`, amount: basePay });
  } else {
    basePay = emp.base ?? 0;
    lines.push({ label: "Gaji pokok", amount: basePay });
    if (alpa && emp.absentDeduction) lines.push({ label: `Alpa ${alpa} hari`, amount: -alpa * emp.absentDeduction });
  }
  const allowance = emp.allowance ?? 0;
  if (allowance) lines.push({ label: `Tunjangan${emp.allowanceNote ? ` · ${emp.allowanceNote}` : ""}`, amount: allowance });
  const absentCut = emp.type === "harian" ? 0 : alpa * (emp.absentDeduction ?? 0);
  const gross = basePay + allowance;
  const deduction = (emp.deduction ?? 0) + absentCut;
  if (emp.deduction) lines.push({ label: `Potongan${emp.deductionNote ? ` · ${emp.deductionNote}` : ""}`, amount: -emp.deduction });
  return { employeeId: emp.id, name: emp.name, position: emp.position, type: emp.type, hadir, alpa, basePay, allowance, deduction, gross, net: Math.max(0, gross - deduction), lines };
}
