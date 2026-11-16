import { test } from "node:test";
import assert from "node:assert/strict";
import { ARRIVALS, canTrash, filterQuery, filterWaivers, fold, isArrival, isFiltered, reviewFilter, reviewOptions } from "../src/lib/waiver-review.js";

const TODAY = "2026-11-11";
const list = [
  { code: "DW-261111-HJG72", name: "DAMPIER's Team", nationality: "Indonesia", email: "rajaampat@thedampier.com", phone: "+6281311631335", date: "2026-11-11", clearance: true, arrival: "uji", data: { certified: false } },
  { code: "DW-261103-PXJDK", name: "Jean-Baptiste Févrière", nationality: "France", email: "jb@example.com", phone: "+33612345678", date: "2026-11-03", clearance: true, arrival: "datang", data: { certified: true, certAgency: "PADI", certLevel: "Open Water" } },
  { code: "DW-261102-MXQWX", name: "Li Wei", nationality: "china", email: "li@example.com", phone: "", date: "2026-11-20", clearance: false, data: { certified: true, certAgency: "SSI", certLevel: "Advanced Open Water" } },
  { code: "DW-261102-PVTM2", name: "Rina Kalender", nationality: "Indonesia ", email: "rina@example.com", phone: "081234567890", date: "2026-11-12", clearance: false, data: { certified: true, certAgency: "ssi", certLevel: "Open Water Diver" } },
  { code: "DW-261101-AAAAA", name: "Wang Fang", nationality: "China", email: "", phone: "", date: "2026-11-30", clearance: false, data: { certified: true, certAgency: "SSI" } },
];
const codes = (filter) => filterWaivers(list, { q: "", negara: "", sertifikat: "", medis: "", waktu: "", kedatangan: "", ...filter }, TODAY).map((w) => w.code);

test("cari berdasarkan nama, nomor formulir, email, nomor WhatsApp, atau tingkat sertifikat", () => {
  assert.deepEqual(codes({ q: "jean" }), ["DW-261103-PXJDK"]);
  assert.deepEqual(codes({ q: "fevriere" }), ["DW-261103-PXJDK"], "tanpa aksen");
  assert.deepEqual(codes({ q: "HJG72" }), ["DW-261111-HJG72"], "nomor formulir sebagian");
  assert.deepEqual(codes({ q: "dw-261102" }), ["DW-261102-MXQWX", "DW-261102-PVTM2"]);
  assert.deepEqual(codes({ q: "thedampier" }), ["DW-261111-HJG72"]);
  assert.deepEqual(codes({ q: "0813 1163" }), ["DW-261111-HJG72"], "nomor dengan 0 di depan");
  assert.deepEqual(codes({ q: "+62 812 3456" }), ["DW-261102-PVTM2"]);
  assert.deepEqual(codes({ q: "advanced" }), ["DW-261102-MXQWX"]);
  assert.deepEqual(codes({ q: "li wei" }), ["DW-261102-MXQWX"]);
  assert.deepEqual(codes({ q: "tidak ada" }), []);
});

test("filter negara, sertifikat, medis, dan waktu selam", () => {
  assert.deepEqual(codes({ negara: "indonesia" }), ["DW-261111-HJG72", "DW-261102-PVTM2"], "huruf besar dan spasi diabaikan");
  assert.deepEqual(codes({ negara: "China" }), ["DW-261102-MXQWX", "DW-261101-AAAAA"]);
  assert.deepEqual(codes({ sertifikat: "belum" }), ["DW-261111-HJG72"]);
  assert.deepEqual(codes({ sertifikat: "ada" }).length, 4);
  assert.deepEqual(codes({ sertifikat: "SSI" }), ["DW-261102-MXQWX", "DW-261102-PVTM2", "DW-261101-AAAAA"]);
  assert.deepEqual(codes({ medis: "dokter" }), ["DW-261111-HJG72", "DW-261103-PXJDK"]);
  assert.deepEqual(codes({ medis: "aman" }).length, 3);
  assert.deepEqual(codes({ waktu: "akan" }), ["DW-261111-HJG72", "DW-261102-MXQWX", "DW-261102-PVTM2", "DW-261101-AAAAA"], "hari ini ikut");
  assert.deepEqual(codes({ waktu: "lalu" }), ["DW-261103-PXJDK"]);
  assert.deepEqual(codes({ negara: "Indonesia", medis: "aman", waktu: "akan" }), ["DW-261102-PVTM2"], "filter digabung");
});

test("filter dari alamat halaman: nilai asing dibuang, tautan rekap memakai filter yang sama", () => {
  const f = reviewFilter(new URLSearchParams("q=+jean+&negara=France&medis=semua&waktu=akan&x=1"));
  assert.deepEqual(f, { q: "jean", negara: "France", sertifikat: "", medis: "", waktu: "akan", kedatangan: "" });
  assert.equal(filterQuery(f), "q=jean&negara=France&waktu=akan");
  assert.equal(isFiltered(f), true);
  assert.equal(isFiltered(reviewFilter({})), false);
  assert.equal(reviewFilter({ q: "x".repeat(300) }).q.length, 100);
});

test("pilihan negara dan agensi: unik, ejaan yang paling sering, urut abjad", () => {
  const { countries, agencies } = reviewOptions(list);
  assert.deepEqual(countries, ["China", "France", "Indonesia"]);
  assert.deepEqual(agencies, ["PADI", "SSI"]);
  assert.equal(fold("  Côte  d'Ivoire "), "cote d'ivoire");
});

test("konfirmasi kedatangan: filter, dan hanya uji coba atau tidak datang yang boleh ke sampah", () => {
  assert.deepEqual(codes({ kedatangan: "uji" }), ["DW-261111-HJG72"]);
  assert.deepEqual(codes({ kedatangan: "datang" }), ["DW-261103-PXJDK"]);
  assert.deepEqual(codes({ kedatangan: "belum" }), ["DW-261102-MXQWX", "DW-261102-PVTM2", "DW-261101-AAAAA"], "tanpa status = belum dikonfirmasi");
  assert.equal(reviewFilter({ kedatangan: "hilang" }).kedatangan, "");
  assert.equal(filterQuery(reviewFilter({ kedatangan: "tidak" })), "kedatangan=tidak");
  assert.deepEqual(Object.keys(ARRIVALS), ["", "datang", "tidak", "uji"]);
  for (const value of ["", "datang", "tidak", "uji"]) assert.equal(isArrival(value), true, value);
  for (const value of ["hadir", null, undefined, 1]) assert.equal(isArrival(value), false, String(value));
  assert.equal(canTrash({ arrival: "uji" }), true);
  assert.equal(canTrash({ arrival: "tidak" }), true);
  assert.equal(canTrash({ arrival: "datang" }), false, "yang datang tetap tersimpan sebagai catatan resmi");
  assert.equal(canTrash({ arrival: "" }), false);
  assert.equal(canTrash(null), false);
});
