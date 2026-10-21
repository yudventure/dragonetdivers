import { test } from "node:test";
import assert from "node:assert/strict";
import { contact, mapsLink, siteConfigWarnings, siteUrl, socialLinks, socialUrl, whatsappLink, whatsappNumber } from "../src/lib/site.js";

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
  assert.equal(siteUrl(" https://dragonetdivers.com/path "), "https://dragonetdivers.com");
  assert.equal(siteUrl(undefined), "https://dragonetdivers.com");
  // Kasus nyata di Hostinger: teks contoh membuat build gagal (ERR_INVALID_URL).
  assert.equal(siteUrl("masih uji coba"), "https://dragonetdivers.com");
  assert.equal(siteUrl("ftp://example.com"), "https://dragonetdivers.com");
  assert.equal(console.warn.mock.callCount(), 2);
});

test("peringatan konfigurasi publik untuk /api/health", () => {
  assert.deepEqual(siteConfigWarnings({ NEXT_PUBLIC_SITE_URL: "https://dragonetdivers.com", NEXT_PUBLIC_WHATSAPP_NUMBER: "6281234567890" }), []);
  assert.deepEqual(siteConfigWarnings({}), []);
  const warnings = siteConfigWarnings({ NEXT_PUBLIC_SITE_URL: "masih uji coba", NEXT_PUBLIC_WHATSAPP_NUMBER: "masih uji coba" });
  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /NEXT_PUBLIC_SITE_URL/);
  assert.match(warnings[1], /NEXT_PUBLIC_WHATSAPP_NUMBER/);
});

test("akun media sosial: handle atau URL di domain jaringannya, selain itu disembunyikan", () => {
  assert.equal(socialUrl("instagram", "@dragonetdivers"), "https://www.instagram.com/dragonetdivers/");
  assert.equal(socialUrl("tiktok", "dragonetdivers"), "https://www.tiktok.com/@dragonetdivers");
  assert.equal(socialUrl("facebook", "https://www.facebook.com/dragonetdivers"), "https://www.facebook.com/dragonetdivers");
  assert.equal(socialUrl("youtube", "https://m.youtube.com/@dragonetdivers"), "https://m.youtube.com/@dragonetdivers");
  for (const bad of ["", undefined, "masih uji coba", "http://instagram.com/x", "https://evil.example/instagram.com"]) {
    assert.equal(socialUrl("instagram", bad), null, String(bad));
  }
  assert.deepEqual(socialLinks({}), []);
  assert.deepEqual(
    socialLinks({ instagram: "@dragonetdivers", tiktok: "salah isi!" }).map((s) => s.id),
    ["instagram"],
  );
  const warnings = siteConfigWarnings({ NEXT_PUBLIC_TIKTOK: "salah isi!" });
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /NEXT_PUBLIC_TIKTOK/);
});

test("kontak dan base dari pemilik", () => {
  assert.equal(contact.email, "halo@dragonetdivers.com");
  assert.match(contact.address.join(" "), /Kurkapa/);
  assert.equal(mapsLink({ lat: -0.5, lng: 130.6 }), "https://www.google.com/maps/search/?api=1&query=-0.5,130.6");
});
