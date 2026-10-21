import { test } from "node:test";
import assert from "node:assert/strict";
import { PRICE_LIST } from "../src/content/price-list.js";
import { validatePackage } from "../src/lib/checkout.js";
import { missingPackages } from "../src/lib/packages.js";
import { services } from "../src/lib/services.js";

const slugs = services.map((s) => s.slug);
const { packages } = PRICE_LIST;

test("setiap paket daftar harga lolos validasi admin tanpa berubah", () => {
  assert.ok(packages.length >= 30);
  for (const pkg of packages) {
    const clean = validatePackage(pkg, slugs);
    for (const key of Object.keys(clean)) assert.deepEqual(clean[key], pkg[key], `${pkg.nameEn}: ${key}`);
  }
  // Semua layanan kebagian paket.
  assert.deepEqual([...new Set(packages.map((p) => p.service))].sort(), [...slugs].sort());
});

test("nama paket unik per layanan dan teks mengikuti aturan tulisan pemilik", () => {
  for (const slug of slugs) {
    const list = packages.filter((p) => p.service === slug);
    for (const key of ["nameEn", "nameId"]) {
      const names = list.map((p) => p[key].toLowerCase());
      assert.equal(new Set(names).size, names.length, `${slug} ${key}`);
    }
  }
  for (const pkg of packages) {
    for (const key of ["nameEn", "nameId", "summaryEn", "summaryId", "includesEn", "includesId"]) {
      assert.doesNotMatch(pkg[key], /[:;—]/, `${pkg.nameEn}: ${key}`);
    }
    // Teks kedua bahasa sama lengkapnya.
    assert.equal(Boolean(pkg.summaryEn), Boolean(pkg.summaryId), pkg.nameEn);
    assert.equal(pkg.includesEn.split("\n").length, pkg.includesId.split("\n").length, pkg.nameEn);
  }
});

test("harga sesuai daftar harga 2026", () => {
  const price = (nameEn) => packages.find((p) => p.nameEn === nameEn);
  assert.equal(price("One fun dive").price, 900_000);
  assert.equal(price("Three dives in one day").price, 2_250_000);
  assert.equal(price("Piaynemo excursion boat, full capacity").price, 8_167_000);
  assert.equal(price("Manta Point snorkeling").unit, "group");
  assert.equal(price("Manta Point snorkeling").maxGuests, 6);
  assert.equal(price("Yenbuba jetty or Cape Mansuar (Tapor Dura)").price, 300_000);
  assert.equal(price("Night dive at Sawandarek").minGuests, 2);
  assert.equal(price("Try dive").price, 1_300_000);
});

test("paket yang sudah ada tidak ditambahkan lagi", () => {
  const existing = [
    { service: "fun-dives", nameEn: " ONE FUN DIVE ", nameId: "lain" },
    { service: "snorkeling", nameEn: "Lain", nameId: "Dermaga Sawandarek" },
    { service: "dive-courses", nameEn: "Night dive at Sawandarek", nameId: "x" },
  ];
  const missing = missingPackages(packages, existing);
  assert.equal(missing.length, packages.length - 2);
  assert.ok(!missing.some((p) => p.nameEn === "One fun dive" || p.nameEn === "Sawandarek jetty"));
  assert.ok(missing.some((p) => p.nameEn === "Night dive at Sawandarek")); // layanan lain
});
