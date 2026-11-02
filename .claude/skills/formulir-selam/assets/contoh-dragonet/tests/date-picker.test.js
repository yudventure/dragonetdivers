import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, allowed, clampDate, isIsoDate, monthDays, monthOptions, sameDayIn, shiftMonth, stepDate, viewFor, yearOptions } from "../src/lib/date-picker.js";

test("tanggal dan bulan: valid, digeser, tanggal sama di bulan lain", () => {
  assert.ok(isIsoDate("2024-02-29"));
  assert.ok(!isIsoDate("2026-02-29"));
  assert.ok(!isIsoDate("02/11/2026"));
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
  assert.equal(shiftMonth("2026-11", 14), "2028-01");
  assert.equal(sameDayIn("2026-03-31", "2026-04"), "2026-04-30");
  assert.equal(sameDayIn("2024-01-29", "2024-02"), "2024-02-29");
});

test("sel kalender: Senin lebih dulu, sel kosong di awal dan akhir, kelipatan tujuh", () => {
  const nov = monthDays("2026-11"); // 1 November 2026 hari Minggu
  assert.equal(nov.length % 7, 0);
  assert.deepEqual(nov.slice(0, 7), [null, null, null, null, null, null, "2026-11-01"]);
  assert.equal(nov.filter(Boolean).length, 30);
  const feb = monthDays("2027-02"); // 1 Februari 2027 hari Senin, 28 hari
  assert.equal(feb[0], "2027-02-01");
  assert.equal(feb.length, 28);
});

test("rentang: boleh dipilih, dijepit, bulan awal saat dibuka", () => {
  assert.ok(allowed("2026-11-02", "2026-11-02", null));
  assert.ok(!allowed("2026-11-01", "2026-11-02", null));
  assert.ok(!allowed("", null, null));
  assert.equal(clampDate("2030-01-01", null, "2026-11-02"), "2026-11-02");
  const today = "2026-11-02";
  assert.equal(viewFor("1990-05-20", { max: today, today }), "1990-05", "tanggal terpilih");
  assert.equal(viewFor("", { max: today, today, start: "1996-11-02" }), "1996-11", "tanggal lahir mulai 30 tahun lalu");
  assert.equal(viewFor("", { min: today, today }), "2026-11");
  assert.equal(viewFor("2020-01-01", { min: today, today }), "2026-11", "tanggal lama dijepit ke rentang");
});

test("pilihan tahun dan bulan mengikuti rentang", () => {
  const today = "2026-11-02";
  const birth = yearOptions({ min: "1926-01-01", max: today, today });
  assert.equal(birth[0], 2026);
  assert.equal(birth.at(-1), 1926);
  assert.deepEqual(yearOptions({ min: today, max: "2027-12-07", today }), [2027, 2026]);
  assert.equal(yearOptions({ today }).length, 106);
  assert.deepEqual(monthOptions(2026, { min: today }), [11, 12]);
  assert.deepEqual(monthOptions(2026, { max: today }), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  assert.equal(monthOptions(2025, {}).length, 12);
});

test("tombol panah: hari, minggu, bulan, awal dan akhir minggu, tidak keluar rentang", () => {
  const range = { min: "2026-11-02", max: "2026-12-31" };
  assert.equal(stepDate("2026-11-10", "ArrowRight", range), "2026-11-11");
  assert.equal(stepDate("2026-11-10", "ArrowDown", range), "2026-11-17");
  assert.equal(stepDate("2026-11-03", "ArrowLeft", range), "2026-11-02");
  assert.equal(stepDate("2026-11-02", "ArrowUp", range), "2026-11-02", "dijepit di min");
  assert.equal(stepDate("2026-11-30", "PageDown", range), "2026-12-30");
  assert.equal(stepDate("2026-12-31", "PageDown", range), "2026-12-31", "dijepit di max");
  assert.equal(stepDate("2026-11-12", "Home", {}), "2026-11-09", "Senin");
  assert.equal(stepDate("2026-11-12", "End", {}), "2026-11-15", "Minggu");
  assert.equal(stepDate("2026-11-12", "Enter", {}), "2026-11-12");
});
