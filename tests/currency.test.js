import { test } from "node:test";
import assert from "node:assert/strict";
import { convert, defaultCurrency, formatMoney, formatRateDate, parseRate, RATE_URL, rateFromEnv } from "../src/lib/currency.js";

const nbsp = (text) => text.replace(/ /g, " ");

test("kurs Frankfurter (ECB) dibaca, jawaban rusak ditolak", () => {
  assert.equal(new URL(RATE_URL).searchParams.get("base"), "USD");
  assert.deepEqual(parseRate({ amount: 1, base: "USD", date: "2026-10-20", rates: { IDR: 16312.5 } }), {
    idrPerUsd: 16312.5,
    date: "2026-10-20",
    source: "ecb",
  });
  assert.equal(parseRate({ base: "USD", date: "kemarin", rates: { IDR: 16000 } }).date, null);
  for (const bad of [null, {}, { base: "EUR", rates: { IDR: 17000 } }, { base: "USD", rates: { IDR: 0 } }, { base: "USD", rates: { IDR: "abc" } }, { base: "USD", rates: { IDR: 1.6 } }]) {
    assert.equal(parseRate(bad), null, JSON.stringify(bad));
  }
});

test("USD_IDR_RATE dari hPanel menerima pemisah ribuan", () => {
  for (const [raw, value] of [["16250", 16250], ["16.250", 16250], ["16,250", 16250], [" 16 250 ", 16250], ["16250.5", 16250.5], ["16.250,75", 16250.75]]) {
    assert.deepEqual(rateFromEnv(raw), { idrPerUsd: value, date: null, source: "manual" }, raw);
  }
  for (const bad of [undefined, "", "abc", "16", "0", "1000000"]) assert.equal(rateFromEnv(bad), null, String(bad));
});

test("pilihan awal mengikuti bahasa, konversi butuh kurs", () => {
  assert.equal(defaultCurrency("en"), "USD");
  assert.equal(defaultCurrency("id"), "IDR");
  const rate = { idrPerUsd: 16000 };
  assert.equal(convert(1_600_000, "USD", rate), 100);
  assert.equal(convert(1_600_000, "IDR", rate), 1_600_000);
  assert.equal(convert(1_600_000, "USD", null), null);
});

test("format uang mengikuti bahasa halaman", () => {
  assert.equal(nbsp(formatMoney(1_500_000, "IDR", "id")), "Rp 1.500.000");
  assert.equal(nbsp(formatMoney(1_500_000, "IDR", "en")), "IDR 1,500,000");
  assert.equal(formatMoney(93.75, "USD", "en"), "US$94");
  assert.equal(formatMoney(1234, "USD", "id"), "US$ 1.234");
  assert.equal(formatMoney(6.25, "USD", "en"), "US$6.25");
  assert.equal(formatRateDate("2026-10-20", "en"), "Oct 20, 2026");
  assert.equal(formatRateDate("2026-10-20", "id"), "20 Okt 2026");
  assert.equal(formatRateDate(null, "en"), null);
});
