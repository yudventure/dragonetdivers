// Formulir selam ke spreadsheet (permintaan pemilik 2 November 2026: "buatkan hasil form bisa langsung rapih di
// spreadsheet", dengan contoh sheet "Divers Liability Release" yang kolomnya penuh #ERROR! dan tanggalnya acak).
// Satu baris per penyelam dengan kolom yang sama untuk Google Sheets (dikirim otomatis lewat Apps Script milik
// tim, src/server/waiver-sheet.js) dan unduhan Excel (/api/admin/export?type=formulir).
// - Teks (telepon, kontak darurat, nomor sertifikat) tetap teks: format "@" di Google Sheets, sel teks di Excel.
//   Nomor yang diawali + atau 0 tidak lagi berubah jadi rumus (#ERROR!) atau angka tanpa nol depan.
// - Tanggal dan waktu (WIT) dikirim ISO lalu diberi format tanggal, jadi bisa diurutkan dan difilter.
// - Kolom medis dan persetujuan dokter diwarnai bila perlu dokter.
// Fungsi murni, diuji di tests/waiver-sheet.test.js.

import { boxItems, MEDICAL } from "./waiver.js";

/** Nama lembar di Google Sheets dan Excel. */
export const SHEET_NAME = "Diving Waivers";

/**
 * Kolom spreadsheet: header (English, seperti sheet contoh pemilik), type (text, date, datetime, number, link),
 * width (piksel Google Sheets; Excel memakai width / 7). key = kolom pengenal (ID) untuk menimpa baris yang sama
 * saat dikirim ulang. alert = diwarnai bila formulir perlu persetujuan dokter.
 */
export const SHEET_COLUMNS = [
  { header: "Timestamp (WIT)", type: "datetime", width: 170 },
  { header: "ID", type: "text", width: 150, key: true },
  { header: "Full Name", type: "text", width: 200 },
  { header: "Nationality", type: "text", width: 120 },
  { header: "Dive Date", type: "date", width: 110 },
  { header: "Email", type: "text", width: 220 },
  { header: "WhatsApp", type: "text", width: 160 },
  { header: "Emergency Contact", type: "text", width: 240 },
  { header: "Room / Homestay", type: "text", width: 160 },
  { header: "Date of Birth", type: "date", width: 110 },
  { header: "Age", type: "number", width: 60 },
  { header: "Address", type: "text", width: 220 },
  { header: "Certified", type: "text", width: 85 },
  { header: "Agency", type: "text", width: 95 },
  { header: "Level", type: "text", width: 170 },
  { header: "Cert No.", type: "text", width: 130 },
  { header: "Last Dive", type: "date", width: 110 },
  { header: "Total Dives", type: "number", width: 95 },
  { header: "Insurance", type: "text", width: 90 },
  { header: "Insurer", type: "text", width: 170 },
  { header: "Under 18", type: "text", width: 85 },
  { header: "Parent/Guardian", type: "text", width: 170 },
  { header: "Medical", type: "text", width: 210, alert: true },
  { header: "Doctor Clearance", type: "text", width: 135, alert: true },
  { header: "Language", type: "text", width: 105 },
  { header: "Order", type: "text", width: 140 },
  { header: "Status", type: "text", width: 80 },
  { header: "Form", type: "link", width: 110, label: "Open form" },
];

const LANGUAGES = { en: "English", id: "Indonesian", zh: "Chinese", ko: "Korean" };
const yesNo = (value) => (value ? "Yes" : "No");
const isoDay = (value) => (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.slice(0, 10)) ? value.slice(0, 10) : "");

/** Waktu ISO (UTC) sebagai waktu WIT "YYYY-MM-DD HH:MM", atau "" bila tidak sah. */
export function witStamp(iso) {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return "";
  return new Date(time + 9 * 3_600_000).toISOString().slice(0, 16).replace("T", " ");
}

/**
 * Ringkasan jawaban medis: "All NO", atau pertanyaan yang dijawab Ya beserta isi kotak lanjutannya yang Ya,
 * mis. "YES Q1 (A2, A4), Q5".
 */
export function medicalSummary(medical = {}) {
  const yes = MEDICAL.filter((q) => medical[q.id] === true).map((q) => {
    const boxed = q.box ? boxItems(q.box).filter((id) => medical[id] === true) : [];
    return `${q.id.toUpperCase()}${boxed.length ? ` (${boxed.join(", ")})` : ""}`;
  });
  return yes.length ? `YES ${yes.join(", ")}` : "All NO";
}

/**
 * Satu formulir (bentuk listWaivers/waiverByCode di src/server/waivers.js) sebagai nilai kolom SHEET_COLUMNS.
 * base = alamat website untuk tautan ke halaman formulir di admin.
 */
export function sheetValues(w, { base = "" } = {}) {
  const d = w.data ?? {};
  const certified = d.certified !== false;
  const insurance = d.insurance === "yes" ? "Yes" : d.insurance === "no" ? "No" : "";
  return [
    witStamp(w.createdAt),
    w.code,
    w.name ?? d.fullName ?? "",
    w.nationality ?? d.nationality ?? "",
    isoDay(w.date ?? d.date),
    w.email ?? d.email ?? "",
    w.phone ?? d.phone ?? "",
    d.emergency ?? "",
    d.room ?? "",
    isoDay(w.birthDate ?? d.birthDate),
    Number.isInteger(d.age) ? d.age : "",
    d.address ?? "",
    yesNo(certified),
    certified ? (d.certAgency ?? "") : "",
    certified ? (d.certLevel ?? "") : "",
    d.certNumber ?? "",
    isoDay(d.lastDive),
    Number.isInteger(d.loggedDives) ? d.loggedDives : "",
    insurance,
    d.insurer ?? "",
    yesNo(w.minor ?? d.minor),
    d.guardian ?? "",
    medicalSummary(d.medical),
    w.clearance ? "Needed" : "Not needed",
    LANGUAGES[w.lang] ?? w.lang ?? "",
    w.order || "",
    "Signed",
    base ? `${base.replace(/\/$/, "")}/admin/formulir/${w.code}` : "",
  ];
}

/** Baris untuk Apps Script: { id, values, alert }. */
export const sheetRow = (w, options) => ({ id: w.code, values: sheetValues(w, options), alert: Boolean(w.clearance) });

/** Kolom untuk Apps Script (tanpa properti yang tidak dipakai di sana). */
export const sheetColumns = () => SHEET_COLUMNS.map(({ header, type, width, key, alert, label }) => ({ header, type, width, key: Boolean(key), alert: Boolean(alert), label: label ?? "" }));

/** Alamat Web app Apps Script yang diterima (hanya script.google.com, supaya server tidak mengirim ke tempat lain). */
export function cleanSheetUrl(value) {
  if (value == null) return "";
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!url) return "";
  const match = url.match(/^https:\/\/script\.google\.com\/(?:a\/macros\/[A-Za-z0-9.-]+|macros)\/s\/([A-Za-z0-9_-]{20,})\/(exec|dev)(?:\?.*)?$/);
  if (!match) return null;
  if (match[2] === "dev") return null; // alamat /dev hanya bisa dibuka pemilik skrip
  return url.split("?")[0];
}

/** Sel untuk penulis Excel (src/lib/xlsx.js): tanggal dan waktu jadi sel tanggal, angka di tengah, lainnya apa adanya. */
export function excelRow(values) {
  return values.map((value, i) => {
    const type = SHEET_COLUMNS[i]?.type;
    if (value === "" || value == null) return "";
    if (type === "date") return { date: value };
    if (type === "datetime") return { datetime: value };
    if (type === "link") return { link: value, text: SHEET_COLUMNS[i].label };
    if (type === "number") return { value, center: true };
    return value;
  });
}

/**
 * Kode Google Apps Script yang ditempel tim di spreadsheetnya (Extensions, Apps Script). Menerima kiriman
 * { token, columns, rows } dari website, membuat lembar SHEET_NAME bila belum ada (baris judul teal dengan
 * huruf putih yang menempel, tiga kolom pertama menempel, filter, warna selang-seling, lebar kolom), lalu
 * menulis tiap baris: baris dengan ID yang sama ditimpa (kirim ulang aman), selain itu ditambahkan di bawah.
 * Format kolom dipasang sebelum nilainya, jadi teks tetap teks dan tanggal jadi tanggal; isian tamu yang diawali
 * = + - @ ditulis sebagai teks kaya supaya tidak pernah dijalankan sebagai rumus.
 */
export function appsScript(token) {
  return `/**
 * Dragonet Divers Raja Ampat · formulir selam ke Google Sheets.
 * Website mengirim tiap formulir yang masuk ke sini. Jangan ubah TOKEN. Bila perlu, salin ulang dari /admin/formulir/pengaturan.
 */
const TOKEN = ${JSON.stringify(token)};
const SHEET_NAME = ${JSON.stringify(SHEET_NAME)};
const FORMATS = { text: "@", link: "@", date: "dd mmm yyyy", datetime: "dd mmm yyyy hh:mm", number: "0" };
const BRAND = { header: "#146E7F", headerText: "#FFFFFF", band: "#F4F9FA", alert: "#FDF4EC", alertText: "#B4560F" };

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (error) {
    return reply({ ok: false, error: "json" });
  }
  if (!body || body.token !== TOKEN) return reply({ ok: false, error: "token" });
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = prepare(body.columns);
    const result = write(sheet, body.columns, body.rows || []);
    SpreadsheetApp.flush();
    return reply({ ok: true, added: result.added, updated: result.updated, url: SpreadsheetApp.getActive().getUrl() });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return reply({ ok: true, app: "dragonet-waivers" });
}

function reply(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function prepare(columns) {
  const book = SpreadsheetApp.getActive();
  let sheet = book.getSheetByName(SHEET_NAME);
  const fresh = !sheet;
  if (fresh) sheet = book.insertSheet(SHEET_NAME, 0);
  const width = columns.length;
  if (sheet.getMaxColumns() < width) sheet.insertColumnsAfter(sheet.getMaxColumns(), width - sheet.getMaxColumns());
  sheet
    .getRange(1, 1, 1, width)
    .setValues([columns.map((c) => c.header)])
    .setFontWeight("bold")
    .setFontColor(BRAND.headerText)
    .setBackground(BRAND.header)
    .setVerticalAlignment("middle")
    .setWrap(true);
  if (fresh) {
    columns.forEach((c, i) => {
      sheet.setColumnWidth(i + 1, c.width || 120);
      if (c.type === "number") sheet.getRange(2, i + 1, sheet.getMaxRows() - 1, 1).setHorizontalAlignment("center");
    });
    sheet.setRowHeight(1, 34);
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(3);
    const all = sheet.getRange(1, 1, sheet.getMaxRows(), width);
    const band = all.applyRowBanding(SpreadsheetApp.BandingTheme.CYAN, true, false);
    band.setHeaderRowColor(BRAND.header).setFirstRowColor("#FFFFFF").setSecondRowColor(BRAND.band);
    all.createFilter();
  }
  return sheet;
}

function write(sheet, columns, rows) {
  const width = columns.length;
  const keyCol = Math.max(0, columns.findIndex((c) => c.key)) + 1;
  const last = sheet.getLastRow();
  const ids = last > 1 ? sheet.getRange(2, keyCol, last - 1, 1).getDisplayValues().map((r) => String(r[0])) : [];
  const formats = columns.map((c) => FORMATS[c.type] || "@");
  let added = 0;
  let updated = 0;
  rows.forEach((row) => {
    let at = ids.indexOf(String(row.id));
    if (at < 0) {
      ids.push(String(row.id));
      at = ids.length - 1;
      added++;
    } else {
      updated++;
    }
    const r = at + 2;
    if (r > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), 200);
    const range = sheet.getRange(r, 1, 1, width);
    range.setNumberFormats([formats]);
    // Isian yang diawali = + - @ ditulis sebagai teks kaya, yang tidak pernah dibaca sebagai rumus.
    const literal = (c, v) => c.type !== "link" && typeof v === "string" && /^[=+\-@]/.test(v);
    range.setValues([columns.map((c, i) => (c.type === "link" || literal(c, row.values[i]) || row.values[i] === null || row.values[i] === undefined ? "" : row.values[i]))]);
    columns.forEach((c, i) => {
      const cell = sheet.getRange(r, i + 1);
      if (c.type === "link" && row.values[i]) {
        cell.setRichTextValue(SpreadsheetApp.newRichTextValue().setText(c.label || "Open").setLinkUrl(row.values[i]).build());
      } else if (literal(c, row.values[i])) {
        cell.setRichTextValue(SpreadsheetApp.newRichTextValue().setText(row.values[i]).build());
      }
      if (c.alert) cell.setBackground(row.alert ? BRAND.alert : null).setFontColor(row.alert ? BRAND.alertText : null).setFontWeight(row.alert ? "bold" : null);
    });
  });
  const filter = sheet.getFilter();
  if (filter && filter.getRange().getLastRow() < sheet.getLastRow()) {
    filter.remove();
    sheet.getRange(1, 1, sheet.getMaxRows(), width).createFilter();
  }
  return { added: added, updated: updated };
}
`;
}
