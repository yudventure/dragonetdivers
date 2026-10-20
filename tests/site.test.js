import { test } from "node:test";
import assert from "node:assert/strict";
import { siteConfigWarnings, siteUrl, whatsappLink, whatsappNumber } from "../src/lib/site.js";

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

test("URL situs: isian valid dipakai, isian salah jatuh ke alamat bawaan tanpa error", (t) => {
  t.mock.method(console, "warn", () => {});
  assert.equal(siteUrl("https://gold-walrus-261903.hostingersite.com/"), "https://gold-walrus-261903.hostingersite.com");
  assert.equal(siteUrl(" https://dragonetdiversrajaampat.com/path "), "https://dragonetdiversrajaampat.com");
  assert.equal(siteUrl(undefined), "https://dragonetdiversrajaampat.com");
  // Kasus nyata di Hostinger: teks contoh membuat build gagal (ERR_INVALID_URL).
  assert.equal(siteUrl("masih uji coba"), "https://dragonetdiversrajaampat.com");
  assert.equal(siteUrl("ftp://example.com"), "https://dragonetdiversrajaampat.com");
  assert.equal(console.warn.mock.callCount(), 2);
});

test("peringatan konfigurasi publik untuk /api/health", () => {
  assert.deepEqual(siteConfigWarnings({ NEXT_PUBLIC_SITE_URL: "https://dragonetdiversrajaampat.com", NEXT_PUBLIC_WHATSAPP_NUMBER: "6281234567890" }), []);
  assert.deepEqual(siteConfigWarnings({}), []);
  const warnings = siteConfigWarnings({ NEXT_PUBLIC_SITE_URL: "masih uji coba", NEXT_PUBLIC_WHATSAPP_NUMBER: "masih uji coba" });
  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /NEXT_PUBLIC_SITE_URL/);
  assert.match(warnings[1], /NEXT_PUBLIC_WHATSAPP_NUMBER/);
});
