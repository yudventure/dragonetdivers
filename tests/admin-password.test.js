import { test } from "node:test";
import assert from "node:assert/strict";
import {
  envPasswordForms,
  envPasswordMatches,
  hashPassword,
  maskEmail,
  passwordProblem,
  replacementActive,
  replacementRecord,
  typedPasswordMatches,
  verifyPassword,
} from "../src/lib/admin-password.js";

test("ADMIN_PASSWORD dengan spasi atau tanda kutip tersalin tetap cocok", () => {
  assert.deepEqual(envPasswordForms(' "Laut-Biru-2026" '), [' "Laut-Biru-2026" ', '"Laut-Biru-2026"', "Laut-Biru-2026"]);
  for (const raw of ["Laut-Biru-2026", "Laut-Biru-2026 ", " 'Laut-Biru-2026'", '"Laut-Biru-2026"\n']) {
    assert.ok(envPasswordMatches(raw, "Laut-Biru-2026"), JSON.stringify(raw));
  }
  // Spasi tempelan di ketikan dimaafkan, password lain tidak.
  assert.ok(envPasswordMatches("Laut-Biru-2026", " Laut-Biru-2026 "));
  assert.ok(!envPasswordMatches("Laut-Biru-2026", "laut-biru-2026"));
  assert.ok(!envPasswordMatches("Laut-Biru-2026", "Laut-Biru-202"));
  // Password yang memang diawali kutip juga tetap bisa dipakai apa adanya.
  assert.ok(envPasswordMatches('"Laut-Biru-2026"', '"Laut-Biru-2026"'));
});

test("password pengganti disimpan sebagai hash dan berlaku sampai ADMIN_PASSWORD diganti", () => {
  const record = replacementRecord({ email: "halo@dragonetdivers.com", password: "Ombak-Tenang-77", envPassword: "Lama-Sekali-1" });
  assert.ok(!JSON.stringify(record).includes("Ombak-Tenang-77"), "password tidak tersimpan apa adanya");
  assert.ok(!JSON.stringify(record).includes("Lama-Sekali-1"));
  assert.ok(verifyPassword(record, "Ombak-Tenang-77"));
  assert.ok(!verifyPassword(record, "Ombak-Tenang-78"));
  assert.ok(typedPasswordMatches(record, " Ombak-Tenang-77 "));
  assert.ok(replacementActive(record, { email: "halo@dragonetdivers.com", envPassword: "Lama-Sekali-1" }));
  assert.ok(!replacementActive(record, { email: "halo@dragonetdivers.com", envPassword: "Baru-Diganti-2" }), "ADMIN_PASSWORD baru menang");
  assert.ok(!replacementActive(record, { email: "lain@dragonetdivers.com", envPassword: "Lama-Sekali-1" }));
  assert.ok(!replacementActive(null, { email: "halo@dragonetdivers.com", envPassword: "Lama-Sekali-1" }));
  assert.ok(!verifyPassword({ salt: 1 }, "x"));
  const a = hashPassword("sama-saja-123");
  const b = hashPassword("sama-saja-123");
  assert.notEqual(a.hash, b.hash, "salt acak");
});

test("syarat password baru dan email tersamar", () => {
  assert.match(passwordProblem("halo@dragonetdivers.com", "pendek"), /minimal 10/);
  assert.match(passwordProblem("halo@dragonetdivers.com", " ada-spasi-di-awal"), /spasi/);
  assert.match(passwordProblem("halo@dragonetdivers.com", "HALO@dragonetdivers.com"), /email/);
  assert.match(passwordProblem("halo@dragonetdivers.com", "x".repeat(201)), /maksimal/);
  assert.equal(passwordProblem("halo@dragonetdivers.com", "Ombak-Tenang-77"), "");
  assert.equal(maskEmail("halo@dragonetdivers.com"), "ha•••@dragonetdivers.com");
  assert.equal(maskEmail("bukan-email"), "••••");
});
