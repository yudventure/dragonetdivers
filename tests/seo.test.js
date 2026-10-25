import { test } from "node:test";
import assert from "node:assert/strict";
import { googleVerificationOf, isDnsVerification, robotsRules, sitemapEntries, sitemapPaths } from "../src/lib/seo.js";

const CODE = "Abc_DEF-1234567890abcdefGHIJKLmnopqrstuvwxy";

test("kode verifikasi Google dari tag HTML utuh atau kodenya saja", () => {
  assert.equal(googleVerificationOf(`<meta name="google-site-verification" content="${CODE}" />`), CODE);
  assert.equal(googleVerificationOf(`  <META content='${CODE}' NAME='google-site-verification'>  `), CODE);
  assert.equal(googleVerificationOf(` ${CODE} `), CODE);
  assert.equal(googleVerificationOf(""), "");
  assert.equal(googleVerificationOf("   "), "");
  assert.equal(googleVerificationOf(undefined), "");
});

test("isian yang bukan kode tag HTML Google ditolak", () => {
  for (const bad of [
    "kode saya",
    "abc",
    `<meta name="description" content="${CODE}">`,
    `<meta name="google-site-verification" content="">`,
    `<script>alert(1)</script>`,
    `${CODE}"><script>`,
    "https://search.google.com/search-console",
    `google-site-verification=${CODE}`,
  ]) {
    assert.equal(googleVerificationOf(bad), null, bad);
  }
  assert.equal(isDnsVerification(`google-site-verification=${CODE}`), true);
  assert.equal(isDnsVerification(CODE), false);
});

test("sitemap: beranda dan layanan yang tampil dalam English dan Indonesia, dengan pasangan bahasanya", () => {
  assert.deepEqual(sitemapPaths(["fun-dives", "dusk-dives"]), ["/", "/services/fun-dives", "/services/dusk-dives"]);
  const entries = sitemapEntries("https://dragonetdivers.com", ["fun-dives"]);
  assert.deepEqual(
    entries.map((e) => e.url),
    ["https://dragonetdivers.com/", "https://dragonetdivers.com/id", "https://dragonetdivers.com/services/fun-dives", "https://dragonetdivers.com/id/services/fun-dives"],
  );
  assert.deepEqual(entries[3].alternates.languages, {
    en: "https://dragonetdivers.com/services/fun-dives",
    id: "https://dragonetdivers.com/id/services/fun-dives",
    "x-default": "https://dragonetdivers.com/services/fun-dives",
  });
  assert.equal(entries[0].priority, 1);
  assert.ok(entries.every((e) => !/checkout|order|admin/.test(e.url)));
});

test("robots.txt: dashboard tim diblokir, sitemap disebut", () => {
  const robots = robotsRules("https://dragonetdivers.com");
  assert.equal(robots.sitemap, "https://dragonetdivers.com/sitemap.xml");
  assert.deepEqual(robots.rules[0].disallow, ["/admin", "/api/admin"]);
  assert.equal(robots.rules[0].allow, "/");
});
