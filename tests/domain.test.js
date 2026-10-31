import { test } from "node:test";
import assert from "node:assert/strict";
import { canonicalRedirect } from "../src/lib/domain.js";

const MAIN = "https://dragonetdiversrajaampat.com";

test("domain lama dan www dialihkan ke domain utama", () => {
  assert.equal(canonicalRedirect("dragonetdivers.com", MAIN), MAIN);
  assert.equal(canonicalRedirect("www.dragonetdivers.com", MAIN), MAIN);
  assert.equal(canonicalRedirect("WWW.DragonetDivers.com:443", MAIN), MAIN);
  assert.equal(canonicalRedirect("www.dragonetdiversrajaampat.com", MAIN), MAIN);
  assert.equal(canonicalRedirect("dragonetdivers.com, proxy.internal", MAIN), MAIN, "x-forwarded-host berisi beberapa host");
});

test("x-forwarded-host dan host: yang dipakai domain milik situs, alamat dalam diabaikan", () => {
  assert.equal(canonicalRedirect(["127.0.0.1:3000", "dragonetdivers.com"], MAIN), MAIN);
  assert.equal(canonicalRedirect(["dragonetdivers.com", "localhost:3000"], MAIN), MAIN);
  assert.equal(canonicalRedirect([null, "dragonetdiversrajaampat.com"], MAIN), null);
  assert.equal(canonicalRedirect(["dragonetdiversrajaampat.com", "localhost:3000"], MAIN), null);
  assert.equal(canonicalRedirect([null, "localhost:3100"], MAIN), null);
});

test("domain utama sendiri tidak dialihkan", () => {
  assert.equal(canonicalRedirect("dragonetdiversrajaampat.com", MAIN), null);
  assert.equal(canonicalRedirect("dragonetdiversrajaampat.com.", MAIN), null);
});

test("selama domain utama masih dragonetdivers.com, domain baru dialihkan ke sana", () => {
  assert.equal(canonicalRedirect("dragonetdiversrajaampat.com", "https://dragonetdivers.com"), "https://dragonetdivers.com");
  assert.equal(canonicalRedirect("dragonetdivers.com", "https://dragonetdivers.com"), null);
});

test("domain di luar daftar tidak pernah dialihkan", () => {
  for (const host of ["localhost:3100", "127.0.0.1", "gold-walrus-261903.hostingersite.com", "evil-dragonetdivers.com", "dragonetdivers.com.evil.example", "", null, undefined]) {
    assert.equal(canonicalRedirect(host, MAIN), null, String(host));
  }
  // Domain utama yang bukan milik situs (uji lokal, domain sementara): tidak ada pengalihan.
  assert.equal(canonicalRedirect("dragonetdivers.com", "http://localhost:3100"), null);
  assert.equal(canonicalRedirect("dragonetdivers.com", "bukan url"), null);
});
