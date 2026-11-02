// Formulir selam untuk tamu yang menyelam (permintaan pemilik 2 November 2026, contoh: form waiver Turtle Dive
// Homestay): data diri, profil penyelam dan asuransi, kuesioner medis penyelam (10 pertanyaan dengan kotak
// lanjutan A sampai G, mengikuti Diver Medical Participant Questionnaire 2020), teks perjanjian (liability
// release) dari tim di /admin/formulir, dan tanda tangan. Tiap penyelam mengisi formulirnya sendiri, idealnya
// sebelum datang (tautan di halaman pesanan dan email pesanan), atau di dive center lewat /waiver.
// Fungsi murni, diuji di tests/waiver.test.js. Teks tampilan ada di src/content/ui.js (waiver).

import { isOrderCode } from "./checkout.js";

/**
 * Sepuluh pertanyaan utama. box = kotak pertanyaan lanjutan bila dijawab Ya; doctor = jawaban Ya langsung
 * berarti perlu pemeriksaan dokter (pertanyaan 3, 5, dan 10).
 */
export const MEDICAL = [
  { id: "q1", box: "A" },
  { id: "q2", box: "B" },
  { id: "q3", doctor: true },
  { id: "q4", box: "C" },
  { id: "q5", doctor: true },
  { id: "q6", box: "D" },
  { id: "q7", box: "E" },
  { id: "q8", box: "F" },
  { id: "q9", box: "G" },
  { id: "q10", doctor: true },
];

/** Jumlah pertanyaan di tiap kotak lanjutan; idnya A1, A2, dst. */
export const BOXES = { A: 5, B: 4, C: 4, D: 5, E: 4, F: 5, G: 6 };

export const boxItems = (box) => Array.from({ length: BOXES[box] ?? 0 }, (_, i) => `${box}${i + 1}`);

/** Semua id pertanyaan yang harus dijawab untuk jawaban ini (utama, plus kotak dari jawaban Ya). */
export function medicalQuestions(answers = {}) {
  return MEDICAL.flatMap((q) => [q.id, ...(q.box && answers[q.id] === true ? boxItems(q.box) : [])]);
}

/**
 * Apakah jawaban medis ini memerlukan persetujuan dokter sebelum menyelam: Ya di pertanyaan 3, 5, atau 10,
 * atau Ya di salah satu pertanyaan kotak lanjutan. Ya di pertanyaan berkotak tetapi Tidak di semua isi
 * kotaknya tidak memerlukan dokter.
 */
export function needsClearance(answers = {}) {
  return MEDICAL.some((q) => answers[q.id] === true && (q.doctor || boxItems(q.box).some((id) => answers[id] === true)));
}

/** Umur dalam tahun penuh pada tanggal tertentu (YYYY-MM-DD), atau null bila tanggal tidak sah. */
export function ageOn(birthDate, onDate) {
  if (!isDate(birthDate) || !isDate(onDate)) return null;
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [y, m, d] = onDate.split("-").map(Number);
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
}

/** Tanggal YYYY-MM-DD yang benar-benar ada di kalender. */
export function isDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const addDays = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

/** Isian yang salah; field = nama kolom di formulir, dipetakan ke pesan di ui.waiver.errors. */
export class WaiverError extends Error {
  constructor(field) {
    super(field);
    this.field = field;
  }
}

const text = (value, max) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max + 1) : "");
const sameName = (a, b) => text(a, 200).toLocaleLowerCase() === text(b, 200).toLocaleLowerCase();
const EMAIL = /^[^\s@<>()",;]+@[^\s@<>()",;]+\.[^\s@<>()",;]{2,}$/;
// Tanda tangan dari kanvas: PNG base64, paling besar sekitar 300 KB.
const SIGNATURE = /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/;
export const SIGNATURE_MAX = 400_000;

/** Kode formulir: DW-YYMMDD-XXXXX (tanggal WIT, huruf dan angka yang tidak membingungkan). */
export function waiverCode(now = new Date(), random = Math.random) {
  const wit = new Date(now.getTime() + 9 * 3_600_000).toISOString();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const tail = Array.from({ length: 5 }, () => chars[Math.floor(random() * chars.length)]).join("");
  return `DW-${wit.slice(2, 4)}${wit.slice(5, 7)}${wit.slice(8, 10)}-${tail}`;
}

export const isWaiverCode = (value) => typeof value === "string" && /^DW-\d{6}-[A-HJ-NP-Z2-9]{5}$/.test(value);

/**
 * Isian formulir yang dibersihkan, atau WaiverError dengan nama kolom pertama yang salah.
 * today = tanggal hari ini (YYYY-MM-DD, WIT); agreement = apakah ada teks perjanjian yang harus disetujui.
 */
export function cleanWaiver(input, { today, agreement = false } = {}) {
  if (!input || typeof input !== "object") throw new WaiverError("server");
  const fail = (field) => {
    throw new WaiverError(field);
  };
  const out = {};

  out.fullName = text(input.fullName, 120);
  if (out.fullName.length < 2 || out.fullName.length > 120) fail("fullName");

  out.birthDate = input.birthDate;
  const age = ageOn(out.birthDate, today);
  if (age === null || age < 8 || age > 100) fail("birthDate");
  out.age = age;

  out.address = text(input.address, 200);
  if (out.address.length > 200) fail("address");

  out.nationality = text(input.nationality, 80);
  if (out.nationality.length < 2 || out.nationality.length > 80) fail("nationality");

  out.date = input.date;
  if (!isDate(out.date) || out.date < addDays(today, -1) || out.date > addDays(today, 400)) fail("date");

  out.emergency = text(input.emergency, 160);
  if (out.emergency.length < 5 || out.emergency.length > 160) fail("emergency");

  out.email = text(input.email, 160).toLowerCase();
  if (out.email && (out.email.length > 160 || !EMAIL.test(out.email))) fail("email");

  out.phone = text(input.phone, 40);
  if (out.phone && (out.phone.length > 40 || !/^\+?[\d\s()-]{6,}$/.test(out.phone))) fail("phone");

  out.room = text(input.room, 80);
  if (out.room.length > 80) fail("room");

  // Penyelam bersertifikat mengisi agensi dan tingkatnya; yang belum (ikut kursus) boleh dikosongkan.
  out.certified = input.certified !== false;
  out.certAgency = text(input.certAgency, 60);
  out.certLevel = text(input.certLevel, 80);
  out.certNumber = text(input.certNumber, 60);
  if (out.certified) {
    if (out.certAgency.length < 2 || out.certAgency.length > 60) fail("certAgency");
    if (out.certLevel.length < 2 || out.certLevel.length > 80) fail("certLevel");
  }
  if (out.certNumber.length > 60) fail("certNumber");

  out.lastDive = input.lastDive || "";
  if (out.lastDive && (!isDate(out.lastDive) || out.lastDive > today || out.lastDive < "1950-01-01")) fail("lastDive");

  const dives = input.loggedDives;
  out.loggedDives = dives === "" || dives === null || dives === undefined ? null : Number(dives);
  if (out.loggedDives !== null && (!Number.isInteger(out.loggedDives) || out.loggedDives < 0 || out.loggedDives > 99_999)) fail("loggedDives");

  out.insurance = input.insurance === "yes" || input.insurance === "no" ? input.insurance : "";
  out.insurer = out.insurance === "yes" ? text(input.insurer, 80) : "";
  if (out.insurer.length > 80) fail("insurer");

  // Di bawah 18 tahun: orang tua atau wali ikut menandatangani (namanya wajib).
  out.minor = age < 18;
  out.guardian = out.minor ? text(input.guardian, 120) : "";
  if (out.minor && (out.guardian.length < 2 || out.guardian.length > 120)) fail("guardian");

  const answers = input.medical && typeof input.medical === "object" ? input.medical : {};
  out.medical = {};
  for (const id of medicalQuestions(answers)) {
    if (typeof answers[id] !== "boolean") fail(`medical.${id}`);
    out.medical[id] = answers[id];
  }
  out.clearance = needsClearance(out.medical);
  if (input.declaration !== true) fail("declaration");

  out.signature = typeof input.signature === "string" ? input.signature : "";
  if (out.signature.length < 200 || out.signature.length > SIGNATURE_MAX || !SIGNATURE.test(out.signature)) fail("signature");

  // Nama yang diketik sebagai konfirmasi: nama peserta, atau nama wali bila peserta di bawah 18 tahun.
  const signer = out.minor ? out.guardian : out.fullName;
  if (!sameName(input.confirmName, signer)) fail("confirmName");
  out.confirmName = text(input.confirmName, 120);

  if (input.agree !== true) fail("agree");
  out.agreement = Boolean(agreement);

  out.order = isOrderCode(input.order) ? input.order : "";
  return out;
}

// Teks perjanjian (bawaan src/content/waiver-agreement.js, atau dari /admin/formulir): paragraf dipisah baris kosong; paragraf satu baris yang diawali nomor
// ("1. Agreement Parties") atau tanda pagar ("# Judul") tampil sebagai judul.
export const AGREEMENT_MAX = 40_000;

/** Teks perjanjian sebagai daftar blok { heading, text }. */
export function agreementBlocks(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const single = !block.includes("\n") && block.length <= 120;
      const hash = block.match(/^#{1,3}\s+(.+)$/);
      if (single && hash) return { heading: true, text: hash[1].trim() };
      if (single && /^\d{1,2}[.)]\s+\S/.test(block) && !/[.!?]$/.test(block)) return { heading: true, text: block };
      return { heading: false, text: block.replace(/\s*\n\s*/g, " ") };
    });
}

/** Isian teks perjanjian dari admin (English wajib bila ada terjemahan; kosong = teks bawaan). */
export function cleanAgreement(input) {
  const clean = (value) => (typeof value === "string" ? value.replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").trim() : "");
  const en = clean(input?.en);
  const id = clean(input?.id);
  if (en.length > AGREEMENT_MAX || id.length > AGREEMENT_MAX) throw new WaiverError("length");
  if (!en && id) throw new WaiverError("english");
  return { en, id };
}

/** Layanan yang termasuk menyelam (pesanan yang tamunya perlu mengisi formulir). */
export const DIVE_SERVICES = ["fun-dives", "dusk-dives", "dive-courses"];

/** Jumlah penyelam di sebuah pesanan: tamu terbanyak di paket selamnya (0 = bukan pesanan selam). */
export function diversIn(items = []) {
  return items.filter((item) => DIVE_SERVICES.includes(item.service)).reduce((max, item) => Math.max(max, Number(item.guests) || 0), 0);
}

/** Tanggal selam pertama di pesanan (untuk mengisi kolom tanggal formulir), atau "". */
export const firstDiveDate = (items = []) =>
  items
    .filter((item) => DIVE_SERVICES.includes(item.service))
    .map((item) => item.date)
    .filter(isDate)
    .sort()[0] ?? "";
