import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BOAT_ROUTE, CROP, PLACES, ferryEntry, percentIn, steps } from "../src/lib/getting-here.js";

const inCrop = ([x, y], [x0, y0, w, h] = CROP) => x >= x0 && x <= x0 + w && y >= y0 && y <= y0 + h;

test("langkah perjalanan lengkap, tanpa harga dan jam keberangkatan", () => {
  assert.equal(steps.length, 4);
  for (const step of steps) {
    assert.ok(step.title && step.text, step.title);
    assert.doesNotMatch(step.text, /\$|USD|IDR|Rp\b|\d{1,2}[:.]\d{2}\s?(am|pm)?|\d+\s?(am|pm)\b/i, step.title);
  }
  assert.match(steps.at(-1).text, /Kurkapa/);
});

test("Waisai, base Kurkapa, dan jalur perahu ada di dalam potongan peta", () => {
  for (const point of [PLACES.waisai, PLACES.base, ...BOAT_ROUTE]) assert.ok(inCrop(point), point.join(","));
  assert.ok(!inCrop(PLACES.sorong), "Sorong di luar potongan, ditandai di tepi");
  const [ex, ey] = ferryEntry();
  assert.equal(ex, CROP[0] + CROP[2]);
  assert.ok(ey > CROP[1] && ey < CROP[1] + CROP[3]);
  assert.deepEqual(percentIn([CROP[0], CROP[1]]), { left: "0%", top: "0%" });
});

test("gambar peta rute sesuai potongan dan tetap kecil", () => {
  const svg = readFileSync(new URL("../public/media/getting-here-map.svg", import.meta.url), "utf8");
  assert.match(svg, new RegExp(`viewBox="${CROP.join(" ")}"`), "jalankan ulang node scripts/getting-here-map.mjs");
  assert.ok(svg.length < 60 * 1024, `${(svg.length / 1024).toFixed(1)} KB`);
});
