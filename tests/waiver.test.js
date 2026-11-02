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
} from "../src/lib/waiver.js";

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
  assert.deepEqual(cleanAgreement({ en: " Terms \r\n\r\nMore ", id: "" }), { en: "Terms\n\nMore", id: "", zh: "", ko: "" });
  assert.deepEqual(cleanAgreement({ en: "A", zh: " 条款 ", ko: 5 }), { en: "A", id: "", zh: "条款", ko: "" });
  assert.throws(() => cleanAgreement({ en: "", id: "Syarat" }), (e) => e.field === "english");
  assert.throws(() => cleanAgreement({ en: "", ko: "약관" }), (e) => e.field === "english");
  assert.throws(() => cleanAgreement({ en: "x".repeat(40_001) }), (e) => e.field === "length");
});

test("teks perjanjian bawaan (dari form Turtle Dive milik pemilik): bagian 1 sampai 7, nama Dragonet Divers", async () => {
  const { defaultAgreement } = await import("../src/content/waiver-agreement.js");
  const blocks = agreementBlocks(defaultAgreement);
  assert.deepEqual(
    blocks.filter((b) => b.heading).map((b) => b.text.split(".")[0]),
    ["1", "2", "3", "4", "5", "6", "7"],
  );
  assert.ok(defaultAgreement.startsWith("Dragonet Divers Raja Ampat hosts Activities"));
  assert.ok(!/Turtle/.test(defaultAgreement));
  assert.match(defaultAgreement, /\(hereafter referred to as "Released Parties"\)\./);
  assert.match(defaultAgreement, /RELATE TO ENFORCEMENT OF THIS AGREEMENT\./);
  assert.ok(!defaultAgreement.includes("…") && !defaultAgreement.includes("${"));
  assert.ok(blocks.at(-1).text.startsWith("I HAVE FULLY READ"));
  assert.equal(cleanAgreement({ en: defaultAgreement }).en, defaultAgreement.trim());
});

test("email salinan formulir dan tautan formulir di email pesanan selam", async () => {
  const { waiverMail } = await import("../src/lib/waiver-mail.js");
  const { orderMail, sampleOrder } = await import("../src/lib/order-mail.js");
  const base = "https://dragonetdiversrajaampat.com";
  for (const lang of ["en", "id", "zh", "ko"]) {
    const w = cleanWaiver(valid({ medical: { ...allNo, q3: true } }), { today: TODAY });
    const mail = waiverMail(w, { code: "DW-261102-AB2CD", lang, base, signedAt: "2026-11-02T03:00:00Z", contact: { email: "halo@dragonetdiversrajaampat.com", address: ["Kurkapa"] } });
    assert.match(mail.subject, /DW-261102-AB2CD/, lang);
    assert.ok(!/\{\w+\}/.test(mail.html + mail.text), `${lang}: placeholder tersisa`);
    assert.match(mail.text, /Ana Putri/);
  }
  const dive = { ...sampleOrder({ kind: "order", lang: "id" }), items: [{ service: "fun-dives", packageName: "Two fun dives", unit: "person", unitPrice: 1, guests: 2, date: "2026-11-10", amount: 2 }] };
  const link = `${base}/id/waiver?order=${dive.code}&amp;t=${dive.token}`;
  assert.ok(orderMail("order", { order: dive, base }).html.includes(link), "email pesanan");
  assert.ok(orderMail("paid", { order: { ...dive, status: "paid" }, base }).html.includes(link), "email lunas");
  assert.ok(!orderMail("reminder", { order: dive, base }).html.includes("/waiver"), "pengingat bayar tanpa formulir");
  const trip = { ...dive, items: [{ ...dive.items[0], service: "island-trips" }] };
  assert.ok(!orderMail("order", { order: trip, base }).html.includes("/waiver"), "trip pulau tanpa formulir");
});

test("perjanjian bawaan empat bahasa: susunan sama dengan English, tanpa titik dua dan titik koma", async () => {
  const { defaultAgreements } = await import("../src/content/waiver-agreement.js");
  const en = agreementBlocks(defaultAgreements.en);
  for (const lang of ["id", "zh", "ko"]) {
    const blocks = agreementBlocks(defaultAgreements[lang]);
    assert.equal(blocks.length, en.length, `${lang}: jumlah paragraf dan judul sama`);
    assert.deepEqual(blocks.map((b) => b.heading), en.map((b) => b.heading), lang);
    assert.deepEqual(blocks.filter((b) => b.heading).map((b) => b.text.split(".")[0]), ["1", "2", "3", "4", "5", "6", "7"], lang);
    assert.ok(defaultAgreements[lang].startsWith("Dragonet Divers Raja Ampat"), lang);
    assert.ok(!/[;:；：—]/.test(defaultAgreements[lang].replace(/"[^"]*"/g, "")), `${lang}: tanpa titik dua dan titik koma`);
    assert.ok(!/Turtle|\$\{/.test(defaultAgreements[lang]), lang);
  }
  assert.match(defaultAgreements.id, /"Pihak yang Dibebaskan"/);
  assert.match(defaultAgreements.zh, /"被免责方"/);
  assert.match(defaultAgreements.ko, /"면책 당사자"/);
});

test("perjanjian dalam bahasa halaman: terjemahan bawaan selama English bawaan, English bila belum ada", async () => {
  const { agreementFor } = await import("../src/lib/waiver.js");
  const defaults = { en: "EN", id: "ID", zh: "ZH", ko: "KO" };
  assert.deepEqual(agreementTexts({ en: "", id: "", zh: "", ko: "" }, defaults), defaults);
  assert.deepEqual(agreementTexts(null, defaults), defaults);
  assert.deepEqual(agreementTexts({ en: "", id: "Terjemahan tim" }, defaults), { ...defaults, id: "Terjemahan tim" });
  assert.deepEqual(agreementTexts({ en: "Custom", id: "" }, defaults), { en: "Custom", id: "", zh: "", ko: "" }, "English buatan tim tanpa terjemahan bawaan");
  assert.deepEqual(agreementTexts({ en: "Custom", ko: "커스텀" }, defaults), { en: "Custom", id: "", zh: "", ko: "커스텀" });
  const texts = { en: "EN", id: "ID", zh: "", ko: "KO" };
  assert.deepEqual(agreementFor(texts, "id"), { lang: "id", text: "ID" });
  assert.deepEqual(agreementFor(texts, "en"), { lang: "en", text: "EN" });
  assert.deepEqual(agreementFor(texts, "zh"), { lang: "en", text: "EN" }, "bahasa tanpa teks memakai English");
  assert.deepEqual(agreementFor(texts, "xx"), { lang: "en", text: "EN" });
});
