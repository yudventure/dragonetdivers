import { test } from "node:test";
import assert from "node:assert/strict";
import { rateFromEnv } from "../src/lib/currency.js";
import { envText } from "../src/lib/env.js";
import { cleanKey, keyIssues, productionOn } from "../src/lib/midtrans-key.js";
import { siteConfigWarnings, siteUrl, socialUrl, whatsappNumber } from "../src/lib/site.js";
import { databaseIssues, isDatabaseConfigured, mysqlSettings } from "../src/server/db-config.js";

// hPanel tidak menerima value kosong, jadi file impor .env memakai "-" untuk key yang belum diisi.
const IMPORTED = {
  NEXT_PUBLIC_SITE_URL: "https://dragonetdiversrajaampat.com",
  NEXT_PUBLIC_WHATSAPP_NUMBER: "-",
  NEXT_PUBLIC_INSTAGRAM: "-",
  NEXT_PUBLIC_TIKTOK: "-",
  NEXT_PUBLIC_FACEBOOK: "-",
  NEXT_PUBLIC_YOUTUBE: "-",
  MYSQL_HOST: "-",
  MYSQL_PORT: "3306",
  MYSQL_DATABASE: "-",
  MYSQL_USER: "-",
  MYSQL_PASSWORD: "-",
};

test('"-" dan kosong dibaca sebagai belum diisi', () => {
  for (const unset of ["-", " - ", "", "  ", undefined, null]) assert.equal(envText(unset), "", String(unset));
  assert.equal(envText(" abc "), "abc");
  assert.equal(envText("--"), "--");
});

test("situs: placeholder tidak memunculkan tombol, ikon, atau peringatan", (t) => {
  t.mock.method(console, "warn", () => {});
  assert.equal(whatsappNumber("-"), null);
  assert.equal(socialUrl("instagram", "-"), null, "bukan akun instagram.com/-/");
  assert.equal(siteUrl("-"), "https://dragonetdiversrajaampat.com");
  assert.deepEqual(siteConfigWarnings(IMPORTED), []);
  assert.equal(console.warn.mock.callCount(), 0);
});

test("database dengan placeholder dianggap belum diisi", () => {
  assert.equal(isDatabaseConfigured(IMPORTED), false);
  assert.deepEqual(
    databaseIssues(IMPORTED).map((i) => i.name),
    ["MYSQL_HOST", "MYSQL_DATABASE", "MYSQL_USER", "MYSQL_PASSWORD"],
  );
  assert.equal(mysqlSettings({ ...IMPORTED, MYSQL_PORT: "-" }).port, 3306);
  assert.equal(mysqlSettings({ MYSQL_PASSWORD: " rahasia " }).password, " rahasia ", "spasi bagian dari password");
});

test("Midtrans, PayPal sandbox, dan kurs dengan placeholder", () => {
  assert.equal(cleanKey("-"), "");
  assert.deepEqual(keyIssues("-", "-"), []);
  assert.deepEqual(keyIssues("-", "false"), []);
  assert.ok(!productionOn("-"));
  assert.equal(rateFromEnv("-"), null);
});
