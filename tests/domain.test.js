import { test } from "node:test";
import assert from "node:assert/strict";
import { canonicalRedirect, oldOrigins, seoOrigin } from "../src/lib/domain.js";

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

test("sitemap dan robots: domain lama berisi alamat domain lama, selain itu domain utama", () => {
  const OLD = "https://dragonetdivers.com";
  assert.equal(seoOrigin([null, "dragonetdivers.com"], MAIN), OLD);
  assert.equal(seoOrigin(["www.dragonetdivers.com", "proxy.internal"], MAIN), OLD, "tanpa www");
  assert.equal(seoOrigin([null, "dragonetdiversrajaampat.com"], MAIN), MAIN);
  assert.equal(seoOrigin([null, "www.dragonetdiversrajaampat.com"], MAIN), MAIN);
  assert.equal(seoOrigin(["proxy.internal", "localhost:3100"], MAIN), MAIN, "alamat dalam atau localhost: domain utama");
  assert.equal(seoOrigin([null, null], `${MAIN}/`), MAIN, "tanpa garis miring akhir");
  assert.equal(seoOrigin([null, "dragonetdivers.com"], "http://localhost:3100"), "http://localhost:3100", "domain utama di luar daftar: tidak diubah");
});

test("domain lama untuk langkah pindah domain di /admin/google", () => {
  assert.deepEqual(oldOrigins(MAIN), ["https://dragonetdivers.com"]);
  assert.deepEqual(oldOrigins("https://www.dragonetdiversrajaampat.com"), ["https://dragonetdivers.com"]);
  assert.deepEqual(oldOrigins("http://localhost:3100"), []);
  assert.deepEqual(oldOrigins("bukan url"), []);
});
