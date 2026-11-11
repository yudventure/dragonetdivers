// Dokumen formulir selam yang dicetak atau disimpan sebagai PDF dari /admin/formulir/<kode> (permintaan pemilik
// 11 November 2026: "perbaiki desain dan tambahkan brandingan dragonet untuk bagian atas atau kopnya ... dan
// downloadtan pdfnya itu memuat nama dan negaranya serta nomor suratnya", dengan contoh PDF waiver Turtle Dive).
// Tampilannya di src/admin/WaiverDocument.jsx. Fungsi murni, diuji di tests/waiver-document.test.js.

// Karakter yang tidak boleh ada di nama file (Windows, macOS) ikut dibuang bersama tanda baca lain.
const clean = (value) =>
  String(value ?? "")
    .normalize("NFC")
    .replace(/['’`"]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "");

/**
 * Nama file PDF (tanpa .pdf), dipakai sebagai judul halaman karena peramban menamai PDF dari judul halaman:
 * nomor surat, nama, dan kewarganegaraan, mis. "DW-261111-HJG72_DAMPIERs_Team_Indonesia".
 */
export function waiverFileName(w) {
  const parts = [w.code, clean(w.name), clean(w.nationality)].filter(Boolean);
  return parts.join("_").slice(0, 120).replace(/_+$/, "");
}

/** Tanggal untuk dokumen (English, WIT), mis. "11 Nov 2026". date = YYYY-MM-DD atau waktu ISO. */
export function docDate(value) {
  if (!value) return "";
  const time = /^\d{4}-\d{2}-\d{2}$/.test(value) ? Date.parse(`${value}T12:00:00Z`) : Date.parse(value);
  if (Number.isNaN(time)) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jayapura" }).format(new Date(time));
}

/** Jam WIT dari waktu ISO, mis. "19:34". */
export function docTime(iso) {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Jayapura" }).format(new Date(time));
}

/** Nomor WhatsApp (angka dengan kode negara) yang mudah dibaca, mis. "+62 812 3456 7890". */
export function displayPhone(digits) {
  const n = String(digits ?? "").replace(/\D/g, "");
  if (!n) return "";
  if (n.startsWith("62") && n.length >= 10) {
    const rest = n.slice(2);
    return `+62 ${rest.slice(0, 3)} ${rest.slice(3, 7)} ${rest.slice(7)}`.trim();
  }
  return `+${n}`;
}

/** Nama bahasa formulir untuk dokumen. */
export const DOC_LANGUAGES = { en: "English", id: "Indonesian", zh: "Chinese", ko: "Korean" };
