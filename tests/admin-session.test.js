import { test } from "node:test";
import assert from "node:assert/strict";
import { createSessionToken, passwordFingerprint, readSessionToken, sameText } from "../src/lib/admin-session.js";
import { createThrottle } from "../src/lib/login-throttle.js";

const secret = "test-secret-yang-panjang";
const fingerprint = passwordFingerprint("rahasia-operator-123");
const fingerprintFor = (email) => (email === "operator@dragonetdiversrajaampat.com" ? fingerprint : null);

test("token sesi sah dibaca kembali, email dinormalkan", () => {
  const token = createSessionToken({ email: " Operator@DragonetDiversRajaAmpat.com ", fingerprint, secret, now: 1000 });
  assert.equal(readSessionToken(token, { secret, fingerprintFor, now: 2000 }), "operator@dragonetdiversrajaampat.com");
});

test("token kedaluwarsa, diubah, salah secret, atau password diganti ditolak", () => {
  const token = createSessionToken({ email: "operator@dragonetdiversrajaampat.com", fingerprint, secret, now: 0, hours: 1 });
  assert.equal(readSessionToken(token, { secret, fingerprintFor, now: 3600_000 + 1 }), null, "kedaluwarsa");
  const [payload, sig] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ e: "operator@dragonetdiversrajaampat.com", x: Date.now() * 2 })).toString("base64url");
  assert.equal(readSessionToken(`${forged}.${sig}`, { secret, fingerprintFor, now: 1 }), null, "payload diubah");
  assert.equal(readSessionToken(`${payload}.${sig}x`, { secret, fingerprintFor, now: 1 }), null, "tanda tangan diubah");
  assert.equal(readSessionToken(token, { secret: "secret-lain", fingerprintFor, now: 1 }), null, "secret lain");
  const changed = () => passwordFingerprint("password-baru-456");
  assert.equal(readSessionToken(token, { secret, fingerprintFor: changed, now: 1 }), null, "password diganti");
  for (const bad of [undefined, "", "a.b.c", "tanpa-titik", `${"x".repeat(3000)}.y`]) {
    assert.equal(readSessionToken(bad, { secret, fingerprintFor, now: 1 }), null, String(bad).slice(0, 20));
  }
});

test("pembanding teks", () => {
  assert.equal(sameText("abc", "abc"), true);
  assert.equal(sameText("abc", "abd"), false);
  assert.equal(sameText("abc", "abcd"), false);
});

test("batas percobaan login per IP", () => {
  const throttle = createThrottle({ limit: 3, windowMs: 1000 });
  for (let i = 0; i < 3; i++) {
    assert.equal(throttle.blocked("1.2.3.4", i), false);
    throttle.fail("1.2.3.4", i);
  }
  assert.equal(throttle.blocked("1.2.3.4", 10), true);
  assert.equal(throttle.blocked("5.6.7.8", 10), false, "IP lain tidak terpengaruh");
  assert.equal(throttle.blocked("1.2.3.4", 1500), false, "jendela waktu lewat");
  throttle.fail("1.2.3.4", 1600);
  throttle.clear("1.2.3.4");
  assert.equal(throttle.blocked("1.2.3.4", 1601), false);
});

test("sapaan dashboard mengikuti jam WIT", async () => {
  const { greeting } = await import("../src/lib/admin-overview.js");
  // WIT = UTC+9
  assert.equal(greeting(new Date("2026-10-21T22:30:00Z")), "Selamat pagi"); // 07.30 WIT
  assert.equal(greeting(new Date("2026-10-21T03:00:00Z")), "Selamat siang"); // 12.00 WIT
  assert.equal(greeting(new Date("2026-10-21T07:00:00Z")), "Selamat sore"); // 16.00 WIT
  assert.equal(greeting(new Date("2026-10-21T12:00:00Z")), "Selamat malam"); // 21.00 WIT
});

test("daftar periksa pengaturan situs", async () => {
  const { setupChecklist } = await import("../src/lib/admin-overview.js");
  const list = setupChecklist({ whatsapp: false, socials: 0, database: true, sessionSecret: true, galleryIllustrations: 4 });
  assert.deepEqual(list.filter((x) => !x.done).map((x) => x.id), ["whatsapp", "social", "gallery"]);
  assert.match(list.find((x) => x.id === "gallery").hint, /^4 item/);
});
