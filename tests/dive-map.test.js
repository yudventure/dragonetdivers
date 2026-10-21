import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { keSatuan } from "../src/components/peta-raja-ampat/logika.js";
import { SITE_KIND, SITE_LINK, areasWithSites, mapText, pickDiveSites } from "../src/lib/dive-map.js";
import { serviceBySlug } from "../src/lib/services.js";

const data = (name) => JSON.parse(readFileSync(new URL(`../src/components/peta-raja-ampat/data/${name}.json`, import.meta.url), "utf8"));
const sites = pickDiveSites(data("tanda"));
const { bingkai } = data("garis-pantai");
const areas = areasWithSites(data("wilayah"), sites, bingkai);

test("peta beranda hanya memuat titik selam & snorkel", () => {
  assert.ok(sites.length >= 10, `${sites.length} titik`);
  for (const site of sites) assert.equal(site.jenis, SITE_KIND, site.id);
  const kind = data("tata").jenis.find((j) => j.id === SITE_KIND);
  assert.equal(kind.nama.en, "Dive & snorkel site");
  assert.equal(kind.warna, "#EB7817", "titik selam memakai Oranye Mandarin brand");
});

test("setiap wilayah yang tampil punya titik, setiap titik punya wilayahnya", () => {
  for (const area of areas) assert.ok(sites.some((x) => x.wilayah === area.id), area.id);
  for (const site of sites) assert.ok(areas.some((w) => w.id === site.wilayah), site.id);
  assert.ok(!areas.some((w) => w.id === "waisai"), "keterangan Waisai menyebut tim DAMPIER");
});

test("kotak kamera tiap wilayah memuat semua titiknya", () => {
  const original = new Map(data("wilayah").map((w) => [w.id, w.kotak]));
  for (const area of areas) {
    const [x, y, w, h] = area.kotak;
    const [ox, oy, ow, oh] = original.get(area.id);
    assert.ok(x <= ox && y <= oy && x + w >= ox + ow && y + h >= oy + oh, `${area.id} tidak menyempit`);
    for (const site of sites.filter((s) => s.wilayah === area.id)) {
      const [sx, sy] = keSatuan(bingkai, site.lat, site.lng);
      assert.ok(sx > x && sx < x + w && sy > y && sy < y + h, `${site.id} di dalam kotak ${area.id}`);
    }
  }
  const arborek = areas.find((w) => w.id === "arborek");
  assert.notDeepEqual(arborek.kotak, original.get("arborek"), "Manta Sandy dan Manta Ridge ikut terlihat");
});

test("teks peta bersih dari titik dua, titik koma, tanda pisah panjang, dan harga", () => {
  assert.deepEqual(Object.keys(mapText.id), Object.keys(mapText.en));
  for (const [lang, text] of Object.entries(mapText)) {
    for (const [key, value] of Object.entries(text)) {
      assert.doesNotMatch(value, /[:;—]| – /, `${lang}.${key}`);
      assert.doesNotMatch(value, /\$|USD|IDR|Rp|price|harga/i, `${lang}.${key}`);
    }
  }
});

test("tombol di kartu titik menuju halaman layanan yang ada", () => {
  const slug = SITE_LINK.replace("/services/", "");
  assert.ok(serviceBySlug(slug), SITE_LINK);
});
