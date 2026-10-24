import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanWhatsApp } from "../src/lib/checkout.js";
import { COUNTRIES, countryOptions, defaultCountry, dialOf, flagOf, joinPhone, splitPhone } from "../src/lib/phone.js";

test("daftar negara lengkap dengan kode telepon", () => {
  assert.ok(COUNTRIES.length > 240);
  assert.equal(new Set(COUNTRIES.map((c) => c.iso)).size, COUNTRIES.length);
  for (const c of COUNTRIES) assert.match(`${c.iso}${c.dial}`, /^[A-Z]{2}[1-9]\d{0,2}$/, c.iso);
  assert.equal(dialOf("ID"), "62");
  assert.equal(dialOf("AU"), "61");
  assert.equal(dialOf("US"), "1");
  assert.equal(flagOf("ID"), "🇮🇩");
});

test("nomor yang diketik digabung dengan kode negara, nol di depan dibuang", () => {
  assert.equal(joinPhone("ID", "0813-9204 4191"), "+62 813-9204 4191");
  assert.equal(joinPhone("AU", "0412 345 678"), "+61 412 345 678");
  assert.equal(joinPhone("IT", "06 1234 5678"), "+39 06 1234 5678", "Italia memakai 0 di nomor internasional");
  assert.equal(joinPhone("ID", "  "), "");
  assert.equal(cleanWhatsApp(joinPhone("ID", "081392044191")), "6281392044191");
  assert.equal(cleanWhatsApp(joinPhone("DE", "0151 2345 6789")), "4915123456789");
});

test("nomor lengkap yang ditempel memilih negaranya", () => {
  assert.deepEqual(splitPhone("+62 813 9204 4191"), { iso: "ID", national: "81392044191" });
  assert.deepEqual(splitPhone("0061 412 345 678"), { iso: "AU", national: "412345678" });
  assert.deepEqual(splitPhone("+1 416 555 0100"), { iso: "US", national: "4165550100" }, "kode bersama memakai negara utamanya");
  assert.deepEqual(splitPhone("+1 416 555 0100", "CA"), { iso: "CA", national: "4165550100" }, "kecuali negara yang sedang dipilih");
  assert.equal(splitPhone("0813 9204"), null);
  assert.equal(splitPhone("+"), null);
});

test("negara awal dan pencarian negara", () => {
  assert.equal(defaultCountry("id", ["en-AU"]), "ID");
  assert.equal(defaultCountry("en", ["en-AU", "en"]), "AU");
  assert.equal(defaultCountry("en", ["en"]), "ID");
  assert.equal(countryOptions("id", "jerman")[0].iso, "DE");
  assert.equal(countryOptions("id", "germany")[0].iso, "DE", "nama English juga dicari");
  assert.ok(countryOptions("en", "+62").some((c) => c.iso === "ID"));
  assert.deepEqual(countryOptions("en", "zzzz"), []);
  const names = countryOptions("en").map((c) => c.name);
  assert.deepEqual(names, [...names].sort(new Intl.Collator("en").compare));
});
