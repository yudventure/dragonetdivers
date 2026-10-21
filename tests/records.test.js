import { test } from "node:test";
import assert from "node:assert/strict";
import { availability, monthGrid, reservation, reservationDays, validateCapacity } from "../src/lib/modules/calendar.js";
import { orderIncome, totals, transaction, validateTax, yearReport } from "../src/lib/modules/finance.js";
import { attendanceRecap, computePayslip, employee, validateAttendance } from "../src/lib/modules/hr.js";
import { item, movement, stockLevels, stockStatus } from "../src/lib/modules/inventory.js";
import { SCHEMAS, schemaFor } from "../src/lib/modules/index.js";
import { contentSummary, partner, post } from "../src/lib/modules/pr.js";
import { activeGallery, galleryItem } from "../src/lib/modules/site.js";
import { cleanRecord, monthRange, parseNumber, recordDate, RecordError, shiftMonth } from "../src/lib/records.js";
import { workbook } from "../src/lib/xlsx.js";

const throwsOn = (fn, field) => assert.throws(fn, (e) => e instanceof RecordError && (!field || e.field === field));

test("angka rupiah dan desimal dibaca dari berbagai tulisan", () => {
  assert.equal(parseNumber("1.500.000"), 1500000);
  assert.equal(parseNumber("Rp 1,500,000"), 1500000);
  assert.equal(parseNumber("12,5", { decimals: true }), 12.5);
  assert.equal(parseNumber("1.250,75", { decimals: true }), 1250.75);
  assert.equal(parseNumber(""), null);
  assert.ok(Number.isNaN(parseNumber("dua")));
  assert.deepEqual(monthRange("2026-02"), { from: "2026-02-01", to: "2026-02-28" });
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
});

test("skema membersihkan isian dan menolak yang salah", () => {
  const tx = cleanRecord(transaction, { date: "2026-10-21", description: " Solar perahu ", flow: "out", category: "operasional", method: "tunai", amount: "750.000", extra: "x" });
  assert.equal(tx.description, "Solar perahu");
  assert.equal(tx.amount, 750000);
  assert.ok(!("extra" in tx), "kolom di luar skema dibuang");
  assert.equal(recordDate(transaction, tx), "2026-10-21");
  throwsOn(() => cleanRecord(transaction, { ...tx, category: "fun-dives" }), "category"); // kategori pemasukan untuk pengeluaran
  throwsOn(() => cleanRecord(transaction, { ...tx, amount: "0" }), "amount");
  throwsOn(() => cleanRecord(transaction, { ...tx, date: "2026-13-01" }), "date");
  throwsOn(() => cleanRecord(transaction, { ...tx, description: "" }), "description");
  throwsOn(() => cleanRecord(partner, { name: "Agen", type: "agent", status: "active", website: "javascript:alert(1)" }), "website");
  throwsOn(() => cleanRecord(partner, { name: "Agen", type: "bukan", status: "active" }), "type");
  throwsOn(() => cleanRecord(employee, { name: "Rudi", position: "Guide", type: "tetap", joinDate: "2026-01-01", nik: "123" }), "nik");
  throwsOn(() => cleanRecord(employee, { name: "Rudi", position: "Guide", type: "harian", joinDate: "2026-01-01" }), "dailyRate");
  const emp = cleanRecord(employee, { name: "Rudi", position: "Guide", type: "tetap", joinDate: "2026-01-01", active: true });
  assert.equal(emp.leaveDays, 12);
  assert.equal(emp.bpjsKesehatan, false);
});

test("registri skema: setiap jenis punya awalan id unik", () => {
  const prefixes = Object.values(SCHEMAS).map((s) => s.prefix);
  assert.equal(new Set(prefixes).size, prefixes.length);
  for (const s of Object.values(SCHEMAS)) assert.match(s.prefix, /^[a-z]{3}$/, s.kind);
  assert.equal(schemaFor("attendance"), null, "absensi hanya lewat API HRD");
  assert.equal(schemaFor("transaction"), transaction);
  assert.equal(schemaFor("__proto__"), null);
  for (const s of Object.values(SCHEMAS)) {
    for (const f of s.fields) {
      if (f.type === "select") assert.ok(f.options.some(([k]) => k === f.default) || f.default === undefined, `${s.kind}.${f.key}`);
      if (f.optionsBy) for (const list of Object.values(f.optionsBy.map)) for (const [k] of list) assert.ok(f.options.some(([o]) => o === k), `${s.kind}.${f.key} ${k}`);
    }
  }
});

test("reservasi, tanggal tutup, dan kapasitas harian", () => {
  const base = { startDate: "2026-11-02", status: "confirmed", service: "fun-dives", guestName: "Grup Ana", participants: "4", source: "whatsapp", lang: "en", payStatus: "unpaid" };
  const r = cleanRecord(reservation, base);
  assert.equal(r.participants, 4);
  throwsOn(() => cleanRecord(reservation, { ...base, guestName: "" }), "guestName");
  throwsOn(() => cleanRecord(reservation, { ...base, endDate: "2026-11-01" }), "endDate");
  const closed = cleanRecord(reservation, { startDate: "2026-11-05", endDate: "2026-11-06", status: "closed", service: "all" });
  assert.equal(closed.participants, null, "tanggal tutup tanpa jumlah tamu");
  assert.equal(closed.payStatus, "");
  assert.deepEqual(reservationDays(closed), ["2026-11-05", "2026-11-06"]);

  const now = new Date("2026-10-21T00:00:00Z");
  const orders = [
    { date: "2026-11-02", service: "dive-courses", guests: 2, status: "paid" },
    { date: "2026-11-02", service: "fun-dives", guests: 3, status: "pending", dueAt: "2026-10-20T00:00:00Z" }, // lewat batas, tidak dihitung
    { date: "2026-11-02", service: "snorkeling", guests: 5, status: "paid" }, // kelompok lain
  ];
  const a = availability({ date: "2026-11-02", service: "fun-dives", capacity: { diving: 8, snorkeling: 0 }, orders, reservations: [r], now });
  assert.deepEqual(a, { closed: false, capacity: 8, used: 6, left: 2 });
  assert.equal(availability({ date: "2026-11-02", service: "snorkeling", orders, reservations: [r], now }).left, null, "0 = tanpa batas");
  assert.equal(availability({ date: "2026-11-06", service: "snorkeling", reservations: [closed], now }).closed, true);
  assert.equal(availability({ date: "2026-11-07", service: "snorkeling", reservations: [closed], now }).closed, false);
  throwsOn(() => validateCapacity({ diving: -1 }));
  assert.deepEqual(validateCapacity({ diving: "12" }), { diving: 12, snorkeling: 0 });

  const grid = monthGrid("2026-11"); // 1 November 2026 hari Minggu
  assert.equal(grid.length % 7, 0);
  assert.equal(grid.indexOf("2026-11-01"), 6);
  assert.equal(grid.filter(Boolean).length, 30);
});

test("keuangan: pesanan lunas jadi pemasukan otomatis, laporan tahunan dan pajak", () => {
  const auto = orderIncome([
    { code: "DD-261031-AAAAA", name: "Ana", service: "fun-dives", method: "midtrans", amount: 3000000, status: "paid", paidAt: "2026-10-31T16:30:00Z", packageName: "2 dives" },
    { code: "DD-261031-BBBBB", name: "Ben", service: "snorkeling", method: "paypal", amount: 1000000, status: "pending", paidAt: null },
  ]);
  assert.equal(auto.length, 1);
  assert.equal(auto[0].date, "2026-11-01", "tanggal lunas mengikuti WIT");
  assert.equal(auto[0].category, "fun-dives");
  const rows = [
    ...auto,
    { date: "2026-11-03", flow: "out", category: "operasional", amount: 500000 },
    { date: "2026-12-01", flow: "in", category: "rental", amount: 200000 },
  ];
  assert.deepEqual(totals(rows), { income: 3200000, expense: 500000, net: 2700000 });
  const report = yearReport(rows, "2026", { taxRate: 0.5, taxLabel: "PPh" });
  assert.equal(report.months[10].income, 3000000);
  assert.equal(report.months[10].tax, 15000);
  assert.equal(report.tax, 16000);
  assert.deepEqual(
    report.incomeByCategory.map((c) => c.key),
    ["fun-dives", "rental"],
  );
  assert.deepEqual(validateTax({ taxRate: "0,5", taxLabel: "PPh final" }), { taxRate: 0.5, taxLabel: "PPh final" });
  throwsOn(() => validateTax({ taxRate: "200", taxLabel: "x" }));
});

test("gudang: stok dari gerakan, status menipis dan habis", () => {
  const it = cleanRecord(item, { name: "Regulator", category: "alat", minStock: "2", sku: "reg-01", active: true });
  assert.equal(it.sku, "REG-01");
  assert.equal(it.unit, "pcs");
  const moves = [
    cleanRecord(movement, { date: "2026-10-01", itemId: "brg:0123456789ab", flow: "in", qty: "5", reason: "beli" }),
    cleanRecord(movement, { date: "2026-10-02", itemId: "brg:0123456789ab", flow: "out", qty: "2", reason: "rusak" }),
    cleanRecord(movement, { date: "2026-10-03", itemId: "brg:0123456789ab", flow: "adjust", qty: "-1", reason: "opname" }),
  ];
  assert.equal(stockLevels(moves)["brg:0123456789ab"], 2);
  assert.equal(stockStatus(it, 2).key, "low");
  assert.equal(stockStatus(it, 3).key, "ok");
  assert.equal(stockStatus(it, 0).key, "empty");
  assert.equal(stockStatus({ ...it, active: false }, 9).key, "inactive");
  throwsOn(() => cleanRecord(movement, { date: "2026-10-01", itemId: "brg:0123456789ab", flow: "out", qty: "-2", reason: "pakai" }), "qty");
  throwsOn(() => cleanRecord(movement, { date: "2026-10-01", itemId: "brg:0123456789ab", flow: "in", qty: "2", reason: "jual" }), "reason");
  throwsOn(() => cleanRecord(movement, { date: "2026-10-01", itemId: "bukan-id", flow: "in", qty: "2", reason: "beli" }), "itemId");
});

test("HRD: absensi dan slip gaji", () => {
  const rows = validateAttendance(
    {
      date: "2026-10-21",
      rows: [
        { employeeId: "kry:aaaaaaaaaaaa", status: "hadir", timeIn: "07:30", timeOut: "16:00" },
        { employeeId: "kry:bbbbbbbbbbbb", status: "alpa", timeIn: "07:30" },
        { employeeId: "kry:cccccccccccc", status: "" },
      ],
    },
    ["kry:aaaaaaaaaaaa", "kry:bbbbbbbbbbbb", "kry:cccccccccccc"],
  ).rows;
  assert.equal(rows.length, 2, "baris tanpa status dilewati");
  assert.equal(rows[1].timeIn, "", "jam hanya untuk yang hadir");
  assert.throws(() => validateAttendance({ date: "2026-10-21", rows: [{ employeeId: "kry:dddddddddddd", status: "hadir" }] }, []), /dihapus/);
  const recap = attendanceRecap([...rows, { employeeId: "kry:aaaaaaaaaaaa", status: "hadir" }]);
  assert.equal(recap["kry:aaaaaaaaaaaa"].hadir, 2);

  const daily = computePayslip({ id: "kry:aaaaaaaaaaaa", name: "Udin", type: "harian", dailyRate: 150000, allowance: 100000, deduction: 50000 }, recap["kry:aaaaaaaaaaaa"]);
  assert.equal(daily.basePay, 300000);
  assert.equal(daily.net, 350000);
  const monthly = computePayslip({ id: "kry:bbbbbbbbbbbb", name: "Sari", type: "tetap", base: 4000000, absentDeduction: 150000 }, recap["kry:bbbbbbbbbbbb"]);
  assert.equal(monthly.alpa, 1);
  assert.equal(monthly.net, 3850000);
  assert.ok(monthly.lines.some((l) => l.label === "Alpa 1 hari" && l.amount === -150000));
});

test("kalender konten dan galeri situs", () => {
  const p = cleanRecord(post, { date: "2026-10-21", title: "Manta di Blue Magic", platform: "instagram", format: "reel", status: "published", link: "https://www.instagram.com/p/x/", views: "1.200" });
  assert.equal(p.views, 1200);
  throwsOn(() => cleanRecord(post, { ...p, link: "" }), "link");
  const s = contentSummary([p, { ...p, status: "idea", platform: "tiktok", views: 99 }]);
  assert.deepEqual(
    s.platforms.map((x) => [x.key, x.planned, x.live]),
    [
      ["instagram", 1, 1],
      ["tiktok", 1, 0],
    ],
  );
  assert.equal(s.metrics.find((m) => m.key === "views").total, 1200, "hanya konten yang tayang");

  throwsOn(() => cleanRecord(galleryItem, { type: "photo", captionId: "a", captionEn: "a" }), "mediaId");
  throwsOn(() => cleanRecord(galleryItem, { type: "embed", url: "https://example.com/video", captionId: "a", captionEn: "a" }), "url");
  const photo = { ...cleanRecord(galleryItem, { type: "photo", mediaId: "a".repeat(24), captionId: "Pari manta", captionEn: "Manta ray", size: "big", active: true }), width: 2000, height: 1500, blur: "data:x" };
  const video = { ...cleanRecord(galleryItem, { type: "embed", url: "https://www.youtube.com/shorts/abcdefghijk", captionId: "Video", captionEn: "Video", order: "-1", active: true }) };
  const hidden = { ...video, active: false };
  const items = activeGallery([photo, video, hidden]);
  assert.equal(items.length, 2);
  assert.equal(items[0].type, "embed", "urutan kecil dulu");
  assert.equal(items[0].size, undefined, "ukuran video otomatis dipilih galeri");
  assert.equal(items[1].size, "big");
  assert.deepEqual(items[1].image, { src: `/api/media/${"a".repeat(24)}`, width: 2000, height: 1500, blurDataURL: "data:x" });
  assert.deepEqual(items[1].alt, { en: "Manta ray", id: "Pari manta" });
});

test("unduhan Excel berupa berkas zip xlsx yang sah", () => {
  const file = workbook([{ name: "Buku kas", rows: [["Tanggal", "Jumlah"], ["2026-10-21", 750000], ["<script>", null]] }]);
  assert.equal(file.subarray(0, 2).toString(), "PK");
  const text = file.toString("latin1");
  assert.match(text, /xl\/worksheets\/sheet1\.xml/);
  assert.match(text, /<v>750000<\/v>/);
  assert.match(text, /&lt;script&gt;/);
});
