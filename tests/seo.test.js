import { test } from "node:test";
import assert from "node:assert/strict";
import { googleVerificationOf, googleVerificationsOf, isDnsVerification, robotsRules, sitemapEntries, sitemapPaths } from "../src/lib/seo.js";

const CODE = "Abc_DEF-1234567890abcdefGHIJKLmnopqrstuvwxy";

test("kode verifikasi Google dari tag HTML utuh atau kodenya saja", () => {
  assert.equal(googleVerificationOf(`<meta name="google-site-verification" content="${CODE}" />`), CODE);
  assert.equal(googleVerificationOf(`  <META content='${CODE}' NAME='google-site-verification'>  `), CODE);
  assert.equal(googleVerificationOf(` ${CODE} `), CODE);
  assert.equal(googleVerificationOf(""), "");
  assert.equal(googleVerificationOf("   "), "");
  assert.equal(googleVerificationOf(undefined), "");
});

test("beberapa kode verifikasi (properti domain lama dan baru), satu per baris atau dari simpanan", () => {
  const OTHER = "Zyx_DEF-1234567890abcdefGHIJKLmnopqrstuvwxy";
  const tag = (code) => `<meta name="google-site-verification" content="${code}" />`;
  assert.deepEqual(googleVerificationsOf(`${tag(CODE)}\n${tag(OTHER)}`), [CODE, OTHER]);
  assert.deepEqual(googleVerificationsOf(`${tag(CODE)}${tag(OTHER)}`), [CODE, OTHER], "tag ditempel berdempetan");
  assert.deepEqual(googleVerificationsOf(`${CODE} ${OTHER} ${CODE}`), [CODE, OTHER], "bentuk simpanan, kode ganda dibuang");
  assert.deepEqual(googleVerificationsOf(`${tag(CODE)}\n${OTHER}`), [CODE, OTHER]);
  assert.deepEqual(googleVerificationsOf(""), []);
  assert.deepEqual(googleVerificationsOf([CODE, OTHER]), [CODE, OTHER]);
  assert.equal(googleVerificationsOf(`${CODE}\nkode saya`), null);
  assert.equal(googleVerificationsOf(`${CODE}\ngoogle-site-verification=${OTHER}`), null);
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

test("sitemap: beranda dan layanan yang tampil dalam empat bahasa, dengan pasangan bahasanya", () => {
  assert.deepEqual(sitemapPaths(["fun-dives", "dusk-dives"]), ["/", "/services/fun-dives", "/services/dusk-dives"]);
  const entries = sitemapEntries("https://dragonetdiversrajaampat.com", ["fun-dives"]);
  assert.deepEqual(
    entries.map((e) => e.url),
    [
      "https://dragonetdiversrajaampat.com/",
      "https://dragonetdiversrajaampat.com/id",
      "https://dragonetdiversrajaampat.com/zh",
      "https://dragonetdiversrajaampat.com/ko",
      "https://dragonetdiversrajaampat.com/services/fun-dives",
      "https://dragonetdiversrajaampat.com/id/services/fun-dives",
      "https://dragonetdiversrajaampat.com/zh/services/fun-dives",
      "https://dragonetdiversrajaampat.com/ko/services/fun-dives",
    ],
  );
  assert.deepEqual(entries[7].alternates.languages, {
    en: "https://dragonetdiversrajaampat.com/services/fun-dives",
    id: "https://dragonetdiversrajaampat.com/id/services/fun-dives",
    "zh-Hans": "https://dragonetdiversrajaampat.com/zh/services/fun-dives",
    ko: "https://dragonetdiversrajaampat.com/ko/services/fun-dives",
    "x-default": "https://dragonetdiversrajaampat.com/services/fun-dives",
  });
  assert.equal(entries[0].priority, 1);
  assert.ok(entries.every((e) => !/checkout|order|admin/.test(e.url)));
});

test("robots.txt: dashboard tim diblokir, sitemap disebut", () => {
  const robots = robotsRules("https://dragonetdiversrajaampat.com");
  assert.equal(robots.sitemap, "https://dragonetdiversrajaampat.com/sitemap.xml");
  assert.deepEqual(robots.rules[0].disallow, ["/admin", "/api/admin"]);
  assert.equal(robots.rules[0].allow, "/");
});
