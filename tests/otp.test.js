import { test } from "node:test";
import assert from "node:assert/strict";
import { checkOtp, dropOtp, issueOtp } from "../src/lib/otp.js";

const minute = 60_000;

test("kode OTP berlaku sekali dalam 10 menit", () => {
  const now = Date.now();
  const code = issueOtp("Operator@Dragonet.test", now);
  assert.match(code, /^\d{6}$/);
  const wrong = code === "000000" ? "111111" : "000000";
  assert.throws(() => checkOtp("operator@dragonet.test", wrong, now), /Kode salah\. Sisa 4 kali/);
  // Spasi di kode diabaikan; email dicocokkan tanpa membedakan huruf besar.
  assert.equal(checkOtp(" operator@dragonet.test ", `${code.slice(0, 3)} ${code.slice(3)}`, now), true);
  assert.throws(() => checkOtp("operator@dragonet.test", code, now), /sudah tidak berlaku/);
  const late = issueOtp("late@dragonet.test", now);
  assert.throws(() => checkOtp("late@dragonet.test", late, now + 10 * minute + 1), /sudah tidak berlaku/);
});

test("5 kali salah membatalkan kode; kode baru menunggu 1 menit, paling banyak 5 per jam", () => {
  const now = Date.now();
  const code = issueOtp("guess@dragonet.test", now);
  const wrong = code === "123456" ? "654321" : "123456";
  for (let i = 0; i < 4; i++) assert.throws(() => checkOtp("guess@dragonet.test", wrong, now), /salah/);
  assert.throws(() => checkOtp("guess@dragonet.test", wrong, now), /salah 5 kali dan sudah dibatalkan/);
  assert.throws(() => checkOtp("guess@dragonet.test", code, now), /sudah tidak berlaku/);
  assert.throws(
    () => issueOtp("guess@dragonet.test", now + 30_000),
    (error) => error.status === 429 && /1 menit/.test(error.message),
  );
  for (let n = 1; n < 5; n++) issueOtp("guess@dragonet.test", now + n * minute);
  assert.throws(() => issueOtp("guess@dragonet.test", now + 5 * minute), /5 kode dikirim dalam 1 jam/);
  assert.match(issueOtp("guess@dragonet.test", now + 61 * minute), /^\d{6}$/);
  // Kode yang gagal dikirim tidak menahan permintaan berikutnya.
  issueOtp("unsent@dragonet.test", now);
  dropOtp("unsent@dragonet.test");
  assert.match(issueOtp("unsent@dragonet.test", now + 1000), /^\d{6}$/);
});
