// Disalin dari Dragonet Divers (tests/waiver.test.js) oleh scripts/ekspor-aset.mjs. Jalankan: node --test waiver.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ageOn,
  agreementBlocks,
  agreementTexts,
  BOXES,
  cleanAgreement,
  cleanWaiver,
  diversIn,
  firstDiveDate,
  isWaiverCode,
  MEDICAL,
  medicalQuestions,
  needsClearance,
  waiverCode,
  WaiverError,
} from "./waiver.js";

const TODAY = "2026-11-02";
const SIGNATURE = `data:image/png;base64,${"iVBORw0KGgo".padEnd(800, "A")}=`;
const allNo = Object.fromEntries(MEDICAL.map((q) => [q.id, false]));

const valid = (extra = {}) => ({
  fullName: "  Ana   Putri ",
  birthDate: "1990-05-20",
  address: "Jl. Mawar 1, Jakarta",
  nationality: "Indonesia",
  date: "2026-11-10",
  emergency: "Budi +62 812 3456 789",
  email: "Ana@Example.com",
  phone: "+62 812 3456 789",
  room: "Turtle Dive Homestay",
  certified: true,
  certAgency: "SSI",
  certLevel: "Open Water Diver",
  certNumber: "",
  lastDive: "2026-08-01",
  loggedDives: "24",
  insurance: "yes",
  insurer: "DAN",
  medical: { ...allNo },
  declaration: true,
  signature: SIGNATURE,
  confirmName: "ana putri",
  agree: true,
  ...extra,
});

const failsOn = (input, field, options = { today: TODAY }) =>
  assert.throws(() => cleanWaiver(input, options), (e) => e instanceof WaiverError && e.field === field, field);

test("formulir lengkap dibersihkan: nama dirapikan, umur dihitung, email huruf kecil", () => {
  const w = cleanWaiver(valid(), { today: TODAY, agreement: true });
  assert.equal(w.fullName, "Ana Putri");
  assert.equal(w.age, 36);
  assert.equal(w.email, "ana@example.com");
  assert.equal(w.loggedDives, 24);
  assert.equal(w.minor, false);
  assert.equal(w.guardian, "");
  assert.equal(w.clearance, false);
  assert.equal(w.agreement, true);
  assert.deepEqual(w.medical, allNo);
});

test("kolom wajib dan isian yang salah ditolak dengan nama kolomnya", () => {
  failsOn(valid({ fullName: "A" }), "fullName");
  failsOn(valid({ birthDate: "2026-02-30" }), "birthDate");
  failsOn(valid({ birthDate: "2020-01-01" }), "birthDate", { today: TODAY }); // di bawah 8 tahun
  failsOn(valid({ nationality: "" }), "nationality");
  failsOn(valid({ date: "2026-10-01" }), "date"); // sudah lewat
  failsOn(valid({ emergency: "Budi" }), "emergency");
  failsOn(valid({ email: "bukan email" }), "email");
  failsOn(valid({ phone: "telepon saya" }), "phone");
  failsOn(valid({ certAgency: "" }), "certAgency");
  failsOn(valid({ certLevel: "" }), "certLevel");
  failsOn(valid({ lastDive: "2027-01-01" }), "lastDive"); // masa depan
  failsOn(valid({ loggedDives: "-3" }), "loggedDives");
  failsOn(valid({ loggedDives: "2.5" }), "loggedDives");
  failsOn(valid({ declaration: false }), "declaration");
  failsOn(valid({ signature: "" }), "signature");
  failsOn(valid({ signature: "data:image/svg+xml;base64,PHN2Zz4=" }), "signature");
  failsOn(valid({ confirmName: "Orang Lain" }), "confirmName");
  failsOn(valid({ agree: false }), "agree");
  assert.throws(() => cleanWaiver(null, { today: TODAY }), (e) => e.field === "server");
});

test("belum bersertifikat (ikut kursus): agensi dan tingkat boleh kosong; kolom opsional boleh kosong", () => {
  const w = cleanWaiver(valid({ certified: false, certAgency: "", certLevel: "", email: "", phone: "", lastDive: "", loggedDives: "", insurance: "", address: "" }), {
    today: TODAY,
  });
  assert.equal(w.certified, false);
  assert.equal(w.loggedDives, null);
  assert.equal(w.insurance, "");
  assert.equal(w.insurer, "");
});

test("peserta di bawah 18 tahun: nama wali wajib dan wali yang mengetik nama konfirmasi", () => {
  failsOn(valid({ birthDate: "2012-01-15" }), "guardian");
  failsOn(valid({ birthDate: "2012-01-15", guardian: "Budi Santoso" }), "confirmName");
  const w = cleanWaiver(valid({ birthDate: "2012-01-15", guardian: "Budi Santoso", confirmName: "BUDI SANTOSO" }), { today: TODAY });
  assert.equal(w.minor, true);
  assert.equal(w.age, 14);
  assert.equal(w.guardian, "Budi Santoso");
});

test("kuesioner medis: semua pertanyaan wajib, kotak lanjutan wajib bila Ya", () => {
  const { q4, ...missing } = allNo;
  failsOn(valid({ medical: missing }), "medical.q4");
  failsOn(valid({ medical: { ...allNo, q1: true } }), "medical.A1");
  failsOn(valid({ medical: { ...allNo, q2: "yes" } }), "medical.q2");
  assert.deepEqual(medicalQuestions({ q1: true }).slice(0, 6), ["q1", "A1", "A2", "A3", "A4", "A5"]);
  assert.equal(medicalQuestions(allNo).length, 10);
  assert.equal(
    Object.values(BOXES).reduce((a, b) => a + b, 0),
    33,
  );
});

test("perlu persetujuan dokter: Ya di 3, 5, 10, atau Ya di isi kotak lanjutan", () => {
  assert.equal(needsClearance(allNo), false);
  for (const id of ["q3", "q5", "q10"]) assert.equal(needsClearance({ ...allNo, [id]: true }), true, id);
  // Ya di pertanyaan berkotak, Tidak di semua isi kotaknya: tidak perlu dokter.
  const boxNo = { ...allNo, q2: true, B1: false, B2: false, B3: false, B4: false };
  assert.equal(needsClearance(boxNo), false);
  assert.equal(needsClearance({ ...boxNo, B3: true }), true);
  // Jawaban kotak tanpa Ya di pertanyaan utamanya diabaikan.
  assert.equal(needsClearance({ ...allNo, A1: true }), false);
  const w = cleanWaiver(valid({ medical: { ...allNo, q9: true, G1: false, G2: true, G3: false, G4: false, G5: false, G6: false } }), { today: TODAY });
  assert.equal(w.clearance, true);
  assert.equal(w.medical.G2, true);
});

test("umur, kode formulir, dan pesanan selam", () => {
  assert.equal(ageOn("2000-11-03", "2026-11-02"), 25);
  assert.equal(ageOn("2000-11-02", "2026-11-02"), 26);
  assert.equal(ageOn("bukan", "2026-11-02"), null);
  const code = waiverCode(new Date("2026-11-01T20:00:00Z"), () => 0);
  assert.equal(code, "DW-261102-AAAAA"); // 05.00 WIT tanggal 2
  assert.equal(isWaiverCode(code), true);
  assert.equal(isWaiverCode("DW-261102-AAAA0"), false);
  const items = [
    { service: "island-trips", guests: 6, date: "2026-11-09" },
    { service: "fun-dives", guests: 2, date: "2026-11-12" },
    { service: "dusk-dives", guests: 3, date: "2026-11-11" },
  ];
  assert.equal(diversIn(items), 3);
  assert.equal(firstDiveDate(items), "2026-11-11");
  assert.equal(diversIn([{ service: "snorkeling", guests: 4 }]), 0);
  const linked = cleanWaiver(valid({ order: "DD-261021-K7Q2M" }), { today: TODAY });
  assert.equal(linked.order, "DD-261021-K7Q2M");
  assert.equal(cleanWaiver(valid({ order: "bukan kode" }), { today: TODAY }).order, "");
});

test("teks perjanjian: paragraf dan judul bernomor, English wajib bila ada terjemahan", () => {
  const blocks = agreementBlocks(
    "Dragonet Divers hosts Activities, including\nscuba diving.\n\n1. Agreement Parties\n\nI, on behalf of myself.\n\n# Risks\n\n2. I understand the risks.",
  );
  assert.deepEqual(blocks, [
    { heading: false, text: "Dragonet Divers hosts Activities, including scuba diving." },
    { heading: true, text: "1. Agreement Parties" },
    { heading: false, text: "I, on behalf of myself." },
    { heading: true, text: "Risks" },
    { heading: false, text: "2. I understand the risks." },
  ]);
  assert.deepEqual(agreementBlocks(""), []);
  assert.deepEqual(cleanAgreement({ en: " Terms \r\n\r\nMore ", id: "" }), { en: "Terms\n\nMore", id: "" });
  assert.throws(() => cleanAgreement({ en: "", id: "Syarat" }), (e) => e.field === "english");
  assert.throws(() => cleanAgreement({ en: "x".repeat(40_001) }), (e) => e.field === "length");
});
