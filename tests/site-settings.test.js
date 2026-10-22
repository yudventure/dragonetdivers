import { test } from "node:test";
import assert from "node:assert/strict";
import { contact, mapsLink, SITE_STATE, socialLinks, whatsappLink, whatsappNumber } from "../src/lib/site.js";
import { DEFAULT_SITE_SETTINGS, mapsUrlOf, normalizeSiteSettings, SiteSettingsError, validateSiteSettings } from "../src/lib/site-settings.js";

const fails = (input, field) => assert.throws(() => validateSiteSettings(input), (e) => e instanceof SiteSettingsError && e.field === field, field);

test("isian kontak dibersihkan", () => {
  const clean = validateSiteSettings({
    whatsapp: "0812-3456-7890",
    email: " Halo@DragonetDivers.com ",
    address: ["  Jl. Mayor,   Kurkapa ", "Meos Mansar"],
    mapsUrl: "https://maps.app.goo.gl/abc123",
    instagram: "@dragonetdivers",
    tiktok: "https://www.tiktok.com/@dragonetdivers",
    facebook: "",
    extra: "dibuang",
  });
  assert.deepEqual(clean, {
    whatsapp: "6281234567890",
    email: "halo@dragonetdivers.com",
    address: ["Jl. Mayor, Kurkapa", "Meos Mansar", ""],
    mapsUrl: "https://maps.app.goo.gl/abc123",
    instagram: "@dragonetdivers",
    tiktok: "https://www.tiktok.com/@dragonetdivers",
    facebook: "",
    youtube: "",
  });
  assert.deepEqual(validateSiteSettings({}), DEFAULT_SITE_SETTINGS);
});

test("isian kontak yang salah ditolak dengan nama kolomnya", () => {
  fails({ whatsapp: "123" }, "whatsapp");
  fails({ email: "halo@" }, "email");
  fails({ address: ["x".repeat(81)] }, "address0");
  fails({ address: ["", "<b>"] }, "address1");
  fails({ mapsUrl: "https://contoh.com/peta" }, "mapsUrl");
  fails({ mapsUrl: "http://maps.google.com/x" }, "mapsUrl");
  fails({ instagram: "https://facebook.com/dragonet" }, "instagram");
  fails({ youtube: "nama dengan spasi" }, "youtube");
  fails(null, "form");
  assert.equal(mapsUrlOf("https://www.google.com/maps/place/Kurkapa"), "https://www.google.com/maps/place/Kurkapa");
  assert.equal(mapsUrlOf("https://www.google.co.id/maps/@-0.5,130.6,15z"), "https://www.google.co.id/maps/@-0.5,130.6,15z");
  // Simpanan rusak tidak menggagalkan website.
  assert.deepEqual(normalizeSiteSettings({ whatsapp: "abc" }), DEFAULT_SITE_SETTINGS);
});

test("website memakai isian admin, lalu nilai bawaan", () => {
  const before = globalThis[SITE_STATE];
  try {
    globalThis[SITE_STATE] = { value: null };
    assert.equal(contact.email, "halo@dragonetdivers.com");
    assert.equal(contact.address.length, 3);
    assert.match(mapsLink(), /google\.com\/maps\/search/);
    globalThis[SITE_STATE] = {
      value: { ...DEFAULT_SITE_SETTINGS, whatsapp: "6281111111111", email: "info@contoh.id", address: ["Baris satu", "", ""], mapsUrl: "https://maps.app.goo.gl/x", tiktok: "@dragonet" },
    };
    assert.equal(contact.email, "info@contoh.id");
    assert.deepEqual(contact.address, ["Baris satu"]);
    assert.equal(mapsLink(), "https://maps.app.goo.gl/x");
    assert.equal(mapsLink({ lat: 1, lng: 2 }), "https://www.google.com/maps/search/?api=1&query=1,2");
    assert.equal(whatsappNumber(), "6281111111111");
    assert.equal(whatsappLink("Halo"), "https://wa.me/6281111111111?text=Halo");
    assert.ok(socialLinks().some((s) => s.id === "tiktok" && s.href === "https://www.tiktok.com/@dragonet"));
  } finally {
    globalThis[SITE_STATE] = before;
  }
});
