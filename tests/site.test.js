import { test } from "node:test";
import assert from "node:assert/strict";
import { whatsappLink, whatsappNumber } from "../src/lib/site.js";

test("nomor WhatsApp hanya diterima dalam format kode negara + angka", () => {
  assert.equal(whatsappNumber("6281234567890"), "6281234567890");
  for (const bad of ["", undefined, "+6281234567890", "081234567890", "62 812 3456", "abc"]) {
    assert.equal(whatsappNumber(bad), null, String(bad));
  }
});

test("tautan WhatsApp dibuat hanya bila nomor valid", () => {
  assert.equal(whatsappLink("Hi there", "6281234567890"), "https://wa.me/6281234567890?text=Hi%20there");
  assert.equal(whatsappLink("Hi", null), null);
});
