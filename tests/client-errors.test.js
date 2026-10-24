import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanClientError, MAX_ERRORS, pushError, RELOAD_GAP_MS, shouldAutoReload } from "../src/lib/client-errors.js";

test("laporan galat peramban dirapikan dan dipotong", () => {
  const now = new Date("2026-10-24T15:00:00Z");
  const entry = cleanClientError(
    { message: "  Loading chunk 3341 failed.\n(error: /_next/static/chunks/3341.js)  ", digest: "", stack: "ChunkLoadError: x\n at a\n at b\n at c\n at d\n at e", url: "/admin/situs?x=1", agent: "Chrome" },
    now,
  );
  assert.equal(entry.at, "2026-10-24T15:00:00.000Z");
  assert.equal(entry.message, "Loading chunk 3341 failed. (error: /_next/static/chunks/3341.js)");
  assert.equal(entry.stack.split(" | ").length, 4);
  assert.equal(entry.url, "/admin/situs?x=1");
  assert.equal(cleanClientError({ message: "x", url: "https://evil.test/" }).url, "", "hanya alamat admin");
  assert.equal(cleanClientError({ message: "   " }), null);
  assert.equal(cleanClientError(null), null);
  assert.equal(cleanClientError({ message: "a".repeat(999) }).message.length, 300);
});

test("catatan terbaru di depan, paling banyak 20", () => {
  let list = [];
  for (let i = 0; i < 25; i++) list = pushError(list, { message: String(i) });
  assert.equal(list.length, MAX_ERRORS);
  assert.equal(list[0].message, "24");
  assert.deepEqual(pushError(undefined, { message: "a" }), [{ message: "a" }]);
});

test("muat ulang otomatis sekali per menit, tidak bila penyimpanan peramban tidak ada", () => {
  const now = 1_000_000_000;
  assert.equal(shouldAutoReload(0, now), true);
  assert.equal(shouldAutoReload(now - RELOAD_GAP_MS - 1, now), true);
  assert.equal(shouldAutoReload(now - 5_000, now), false, "baru saja dimuat ulang: tampilkan pesan");
  assert.equal(shouldAutoReload(null, now), false);
});
