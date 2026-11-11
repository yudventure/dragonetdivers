#!/usr/bin/env node
// Mengisi ulang folder assets/ skill formulir-selam dari kode Dragonet Divers, sumber kebenarannya.
// Jalankan dari akar repo dragonetdivers setiap kali formulir selam di sana berubah:
//
//   node .claude/skills/formulir-selam/scripts/ekspor-aset.mjs
//
// Hasilnya:
// - assets/formulir-selam/waiver.js        logika murni (src/lib/waiver.js) tanpa impor modul Dragonet lain
// - assets/formulir-selam/waiver.test.js   uji logikanya (tests/waiver.test.js tanpa uji yang butuh modul lain)
// - assets/formulir-selam/teks.json        teks formulir en, id, zh, ko (nama dive center jadi {operator})
// - assets/formulir-selam/perjanjian.json  teks perjanjian en, id, zh, ko ({operator})
// - assets/formulir-selam/skema.sql        tabel waivers (migrasi 008)
// - assets/formulir-selam/SignaturePad.jsx kotak tanda tangan
// - assets/contoh-dragonet/...             berkas asli Dragonet untuk dibaca dan disesuaikan
// aset.test.js ditulis tangan dan tidak ditimpa.

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const skill = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = process.cwd();
const out = join(skill, "assets", "formulir-selam");
const contoh = join(skill, "assets", "contoh-dragonet");
const read = (path) => readFileSync(join(repo, path), "utf8");
const write = (path, text) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};

try {
  read("src/lib/waiver.js");
} catch {
  console.error("Jalankan dari akar repo dragonetdivers (src/lib/waiver.js tidak ditemukan).");
  process.exit(1);
}

// Nama dive center diganti {operator}; situs lain mengisinya dengan namanya sendiri.
const OPERATOR = [/Dragonet Divers Raja Ampat/g, /Dragonet Divers/g];
const neutral = (value) => {
  if (typeof value === "string") return OPERATOR.reduce((text, name) => text.replace(name, "{operator}"), value);
  if (Array.isArray(value)) return value.map(neutral);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, neutral(v)]));
  return value;
};

// 1. Logika murni. Satu-satunya impor Dragonet (isOrderCode dari checkout.js) diganti setelan per situs.
const IMPORT = 'import { isOrderCode } from "./checkout.js";';
let logic = read("src/lib/waiver.js");
if (!logic.includes(IMPORT)) throw new Error("Impor waiver.js berubah, perbarui ekspor-aset.mjs");
logic = logic.replace(
  IMPORT,
  [
    "// Setelan per situs (ubah saat memasang). Bawaan dari Dragonet Divers, kode pesanan DD-YYMMDD-XXXXX.",
    "// Situs tanpa pesanan online cukup membiarkannya, kolom order akan selalu kosong.",
    "const ORDER_CODE = /^DD-\\d{6}-[A-Z0-9]{5}$/;",
    "const isOrderCode = (value) => typeof value === \"string\" && ORDER_CODE.test(value);",
  ].join("\n"),
);
write(
  join(out, "waiver.js"),
  `// Disalin dari Dragonet Divers (src/lib/waiver.js) oleh .claude/skills/formulir-selam/scripts/ekspor-aset.mjs.\n${logic}`,
);

// 2. Uji logika. Uji yang memuat modul Dragonet lain (email, teks bawaan) dibuang, gantinya aset.test.js.
const tests = read("tests/waiver.test.js").replace('from "../src/lib/waiver.js"', 'from "./waiver.js"');
const [head, ...cases] = tests.split(/\n(?=test\()/);
const kept = cases.filter((block) => !block.includes("await import("));
write(
  join(out, "waiver.test.js"),
  `// Disalin dari Dragonet Divers (tests/waiver.test.js) oleh scripts/ekspor-aset.mjs. Jalankan: node --test waiver.test.js\n${[head, ...kept].join("\n").trimEnd()}\n`,
);

// 3. Teks formulir empat bahasa.
const { uiText } = await import(pathToFileURL(join(repo, "src/content/ui.js")));
const { orderMailText } = await import(pathToFileURL(join(repo, "src/content/order-mail.js")));
const teks = {};
for (const lang of ["en", "id", "zh", "ko"]) {
  const ui = uiText(lang);
  const mail = orderMailText[lang];
  const footer = ui.footer.planLinks.find((link) => link.href === "/waiver");
  teks[lang] = neutral({
    waiver: ui.waiver,
    order: {
      waiverTitle: ui.order.waiverTitle,
      waiverText: ui.order.waiverText,
      waiverDone: ui.order.waiverDone,
      waiverButton: ui.order.waiverButton,
    },
    orderMail: { waiver: mail.waiver, waiverButton: mail.waiverButton },
    footerLink: footer?.label ?? "",
  });
}
write(join(out, "teks.json"), `${JSON.stringify(teks, null, 2)}\n`);

// 4. Teks perjanjian empat bahasa (tamu membaca dan menyetujui teks bahasa halaman).
const { defaultAgreements } = await import(pathToFileURL(join(repo, "src/content/waiver-agreement.js")));
write(join(out, "perjanjian.json"), `${JSON.stringify(neutral(defaultAgreements), null, 2)}\n`);

// 5. Skema dan kotak tanda tangan.
copyFileSync(join(repo, "database/migrations/008_waivers.sql"), join(out, "skema.sql"));
copyFileSync(join(repo, "src/components/waiver/SignaturePad.jsx"), join(out, "SignaturePad.jsx"));

// 6. Berkas asli Dragonet, dengan jalur yang sama, sebagai contoh lengkap.
const ORIGINALS = [
  "src/components/waiver/WaiverForm.jsx",
  "src/components/DatePicker.jsx",
  "src/lib/date-picker.js",
  "tests/date-picker.test.js",
  "src/admin/WaiverPhotoPicker.jsx",
  "src/components/waiver/SignaturePad.jsx",
  "app/[lang]/waiver/page.jsx",
  "app/api/waiver/route.js",
  "src/server/waivers.js",
  "src/lib/waiver-mail.js",
  "src/content/waiver-agreement.js",
  "app/admin/formulir/page.jsx",
  "app/admin/formulir/[code]/page.jsx",
  "app/api/admin/waiver/route.js",
  "src/admin/WaiverAgreementForm.jsx",
  "src/admin/PrintButton.jsx",
  // Dokumen A4 bermerek untuk cetak atau PDF, nama file nomor_nama_negara.
  "src/admin/WaiverDocument.jsx",
  "src/lib/waiver-document.js",
  "tests/waiver-document.test.js",
  "src/admin/CopyText.jsx",
  "database/migrations/008_waivers.sql",
  // Spreadsheet: Google Sheets otomatis lewat Apps Script dan unduh Excel.
  "src/lib/waiver-sheet.js",
  "src/server/waiver-sheet.js",
  "src/admin/WaiverSheetPanel.jsx",
  "app/api/admin/waiver-sheet/route.js",
  "app/api/admin/export/route.js",
  "src/lib/xlsx.js",
  "database/migrations/010_waiver_sheet.sql",
  "tests/waiver-sheet.test.js",
  "tests/helpers/fake-sheets.js",
];
for (const path of ORIGINALS) {
  mkdirSync(dirname(join(contoh, path)), { recursive: true });
  copyFileSync(join(repo, path), join(contoh, path));
}

const left = JSON.stringify(teks) + readFileSync(join(out, "perjanjian.json"), "utf8");
if (/Dragonet/.test(left)) console.warn("Peringatan: masih ada kata Dragonet di teks.json atau perjanjian.json");
console.log(`Selesai. ${kept.length} uji logika disalin, ${ORIGINALS.length} berkas contoh.`);
