import { test } from "node:test";
import assert from "node:assert/strict";
import { photoAdvice, TILE_GUIDE, tileFor } from "../src/lib/media-guide.js";
import { SIZES } from "../src/lib/modules/site.js";

test("setiap ukuran petak galeri punya panduan", () => {
  for (const [key] of SIZES.filter(([k]) => k !== "auto")) assert.ok(TILE_GUIDE[key], key);
  assert.equal(tileFor("auto"), "small");
  assert.equal(tileFor("auto", { type: "embed", vertical: true }), "tall");
  assert.equal(tileFor("auto", { type: "embed" }), "wide");
  assert.equal(tileFor("big", { type: "embed" }), "big");
});

test("penilaian resolusi dan arah foto", () => {
  assert.equal(photoAdvice({ width: 2400, height: 1600 }, "auto").level, "good");
  assert.equal(photoAdvice({ width: 1600, height: 1200 }, "big").level, "fair");
  assert.equal(photoAdvice({ width: 800, height: 600 }).level, "small");
  assert.equal(photoAdvice({ width: 1080, height: 1920 }, "small").suggest, "tall");
  assert.equal(photoAdvice({ width: 3000, height: 1000 }, "auto").suggest, "wide");
  assert.equal(photoAdvice({ width: 1080, height: 1920 }, "tall").suggest, null);
  assert.equal(photoAdvice({}), null);
  // Pesan untuk tim tanpa titik dua dan titik koma.
  for (const advice of [photoAdvice({ width: 2400, height: 1600 }), photoAdvice({ width: 1300, height: 900 }, "big"), photoAdvice({ width: 300, height: 200 })]) {
    assert.doesNotMatch(advice.message, /[:;]/);
  }
});
