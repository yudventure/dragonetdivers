import { test } from "node:test";
import assert from "node:assert/strict";
import { fitSize, isHeic, isRetryable, MAX_SIDE, needsResize, renamed, retryDelay } from "../src/lib/image-prep.js";

test("foto diperkecil ke paling lebar 2400 px, perbandingan sisi tetap, tidak diperbesar", () => {
  assert.equal(MAX_SIDE, 2400);
  assert.deepEqual(fitSize(6000, 4000), { width: 2400, height: 1600 });
  assert.deepEqual(fitSize(3024, 4032), { width: 1800, height: 2400 });
  assert.deepEqual(fitSize(1080, 1350), { width: 1080, height: 1350 });
  assert.deepEqual(fitSize(9000, 100), { width: 2400, height: 27 });
});

test("foto kecil JPEG/WebP dikirim apa adanya, selain itu dikompres", () => {
  assert.equal(needsResize({ width: 1080, height: 1350, size: 400_000, type: "image/jpeg" }), false);
  assert.equal(needsResize({ width: 2400, height: 1600, size: 900_000, type: "image/webp" }), false);
  assert.equal(needsResize({ width: 4032, height: 3024, size: 900_000, type: "image/jpeg" }), true, "terlalu lebar");
  assert.equal(needsResize({ width: 2000, height: 1500, size: 6_000_000, type: "image/jpeg" }), true, "file terlalu besar");
  assert.equal(needsResize({ width: 1200, height: 900, size: 300_000, type: "image/png" }), true, "PNG dijadikan WebP");
  assert.equal(needsResize({ width: null, height: null, size: 300_000, type: "image/jpeg" }), false);
});

test("HEIC dikenali dari jenis atau nama, nama file hasil kompres", () => {
  assert.ok(isHeic({ type: "image/heic", name: "a" }));
  assert.ok(isHeic({ type: "", name: "IMG_1234.HEIC" }));
  assert.ok(!isHeic({ type: "image/jpeg", name: "manta.jpg" }));
  assert.equal(renamed("IMG_1234.HEIC", "image/webp"), "IMG_1234.webp");
  assert.equal(renamed("pantai.png", "image/jpeg"), "pantai.jpg");
  assert.equal(renamed("", "image/webp"), "foto.webp");
});

test("unggah dicoba lagi hanya untuk galat jaringan atau server, dengan jeda yang makin panjang", () => {
  for (const status of [0, 408, 429, 500, 502, 503, 504]) assert.ok(isRetryable(status), String(status));
  for (const status of [400, 401, 403, 404, 413]) assert.ok(!isRetryable(status), String(status));
  assert.deepEqual([0, 1, 2, 3].map(retryDelay), [1500, 4000, 10_000, 10_000]);
});
