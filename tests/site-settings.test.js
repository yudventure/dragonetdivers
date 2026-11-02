import { test } from "node:test";
import assert from "node:assert/strict";
import { contact, mapsLink, SITE_STATE, socialLinks, whatsappLink, whatsappNumber } from "../src/lib/site.js";
import { DEFAULT_SITE_SETTINGS, mapsUrlOf, normalizeSiteSettings, SiteSettingsError, validateSiteSettings } from "../src/lib/site-settings.js";

const fails = (input, field) => assert.throws(() => validateSiteSettings(input), (e) => e instanceof SiteSettingsError && e.field === field, field);

test("isian kontak dibersihkan", () => {
  const clean = validateSiteSettings({
    whatsapp: "0812-3456-7890",
    email: " Halo@DragonetDiversRajaAmpat.com ",
    address: ["  Jl. Mayor,   Kurkapa ", "Meos Mansar"],
    mapsUrl: "https://maps.app.goo.gl/abc123",
    instagram: "@dragonetdiversrajaampat",
    tiktok: "https://www.tiktok.com/@dragonetdiversrajaampat",
    facebook: "",
    showUsd: true,
    extra: "dibuang",
  });
  assert.deepEqual(clean, {
    whatsapp: "6281234567890",
    email: "halo@dragonetdiversrajaampat.com",
    address: ["Jl. Mayor, Kurkapa", "Meos Mansar", ""],
    mapsUrl: "https://maps.app.goo.gl/abc123",
    instagram: "@dragonetdiversrajaampat",
    tiktok: "https://www.tiktok.com/@dragonetdiversrajaampat",
    facebook: "",
    youtube: "",
    showUsd: true,
    hiddenServices: ["dive-courses", "snorkeling"],
    serviceImages: {},
    googleVerification: "",
  });
  assert.deepEqual(validateSiteSettings({}), DEFAULT_SITE_SETTINGS);
  assert.equal(DEFAULT_SITE_SETTINGS.showUsd, false, "dolar mati sampai tim menyalakannya");
  assert.equal(validateSiteSettings({ showUsd: "ya" }).showUsd, false, "hanya true yang menyalakan");
});

test("kode verifikasi Google: tag HTML jadi kodenya, kode DNS dan isian asing ditolak dengan pesan", () => {
  const code = "Abc_DEF-1234567890abcdefGHIJKLmnopqrstuvwxy";
  assert.equal(validateSiteSettings({ googleVerification: `<meta name="google-site-verification" content="${code}" />` }).googleVerification, code);
  assert.equal(DEFAULT_SITE_SETTINGS.googleVerification, "");
  assert.throws(() => validateSiteSettings({ googleVerification: `google-site-verification=${code}` }), (e) => e.field === "googleVerification" && /DNS/.test(e.message));
  fails({ googleVerification: "kode saya" }, "googleVerification");
  // Pindah domain: kode properti lama dan baru tersimpan bersama, dipisah spasi.
  const other = code.split("").reverse().join("");
  const two = validateSiteSettings({ googleVerification: `<meta name="google-site-verification" content="${code}" />\n${other}` }).googleVerification;
  assert.equal(two, `${code} ${other}`);
  assert.equal(validateSiteSettings({ googleVerification: two }).googleVerification, two, "simpanan dibaca ulang apa adanya");
  assert.throws(() => validateSiteSettings({ googleVerification: `${code}\ngoogle-site-verification=${other}` }), (e) => /DNS/.test(e.message));
  fails({ googleVerification: Array.from({ length: 6 }, (_, i) => code.slice(0, -1) + "abcdef"[i]).join("\n") }, "googleVerification");
  // Simpanan lama tanpa kode tetap utuh.
  assert.equal(normalizeSiteSettings({ email: "info@contoh.id" }).email, "info@contoh.id");
});

test("layanan yang disimpan: bawaan snorkeling dan kursus selam, slug asing dibuang", () => {
  assert.deepEqual(DEFAULT_SITE_SETTINGS.hiddenServices, ["dive-courses", "snorkeling"]);
  // Simpanan lama tanpa daftar memakai bawaan; daftar kosong berarti semua layanan tampil.
  assert.deepEqual(normalizeSiteSettings({ email: "info@contoh.id" }).hiddenServices, ["dive-courses", "snorkeling"]);
  assert.deepEqual(normalizeSiteSettings({ hiddenServices: [] }).hiddenServices, []);
  assert.deepEqual(validateSiteSettings({ hiddenServices: ["snorkeling", "tidak-ada", "fun-dives", "snorkeling"] }).hiddenServices, ["fun-dives", "snorkeling"]);
  assert.deepEqual(validateSiteSettings({ hiddenServices: "snorkeling" }).hiddenServices, ["dive-courses", "snorkeling"]);
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
    assert.equal(contact.email, "halo@dragonetdiversrajaampat.com");
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

test("foto kartu layanan: hanya layanan dikenal dan id foto sah, bentuk gambar next/image", async () => {
  const { cleanServiceImages, serviceImageOf } = await import("../src/lib/site-settings.js");
  const id = "0123456789abcdef01234567";
  const clean = cleanServiceImages({
    "fun-dives": { id, width: 2400, height: "1600", blur: "data:image/webp;base64,AAAA" },
    "dusk-dives": { id: "../../etc", width: 10 },
    "island-trips": { id, width: -5, blur: "javascript:alert(1)" },
    "bukan-layanan": { id },
  });
  assert.deepEqual(clean, {
    "fun-dives": { id, width: 2400, height: 1600, blur: "data:image/webp;base64,AAAA" },
    "island-trips": { id, width: null, height: null, blur: "" },
  });
  assert.deepEqual(cleanServiceImages(null), {});
  assert.deepEqual(cleanServiceImages([1]), {});
  assert.deepEqual(serviceImageOf(clean["fun-dives"]), { src: `/api/media/${id}`, width: 2400, height: 1600, blurDataURL: "data:image/webp;base64,AAAA" });
  assert.deepEqual(serviceImageOf(clean["island-trips"]), { src: `/api/media/${id}`, width: 1600, height: 1067 });
  assert.equal(serviceImageOf(undefined), null);
  // Tersimpan bersama isian lain dan tidak hilang saat dinormalkan.
  assert.deepEqual(normalizeSiteSettings({ serviceImages: { "fun-dives": { id, width: 100, height: 80 } } }).serviceImages["fun-dives"].id, id);
  assert.deepEqual(DEFAULT_SITE_SETTINGS.serviceImages, {});
});
