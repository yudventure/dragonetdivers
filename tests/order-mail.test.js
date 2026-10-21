import { test } from "node:test";
import assert from "node:assert/strict";
import { orderMailText } from "../src/content/order-mail.js";
import { colors } from "../src/lib/email-layout.js";
import { ORDER_MAIL_KINDS, orderMail, orderUrl, sampleOrder } from "../src/lib/order-mail.js";
import { otpMail } from "../src/lib/otp-mail.js";

const base = "https://dragonetdivers.com";
const contact = { email: "halo@dragonetdivers.com", address: ["Jl. Mayor, Kurkapa"] };
const accounts = [{ bank: "BRI", number: "1234 5678 90", holder: "Dragonet Divers" }];
const now = new Date("2026-10-21T02:00:00Z");

function shape(value, path = "") {
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, item]) => shape(item, path ? `${path}.${key}` : key));
  return [path];
}
const strings = (value) => (typeof value === "string" ? [value] : Object.values(value ?? {}).flatMap(strings));

test("teks email en dan id berkunci sama, tanpa titik koma atau tanda pisah panjang", () => {
  assert.deepEqual(shape(orderMailText.id), shape(orderMailText.en));
  for (const lang of ["en", "id"]) {
    for (const text of strings(orderMailText[lang])) {
      assert.ok(text.trim(), lang);
      assert.doesNotMatch(text, /[;—]/, text);
    }
  }
});

test("setiap email untuk setiap cara bayar dan bahasa lengkap terisi", () => {
  for (const kind of ORDER_MAIL_KINDS) {
    for (const lang of ["en", "id"]) {
      for (const method of ["midtrans", "paypal", "transfer"]) {
        const order = sampleOrder({ kind, lang, method, now });
        const mail = orderMail(kind, { order, base, accounts, serviceTitles: { "fun-dives": "Fun dives" }, contact, whatsapp: "6281234567890" });
        const where = `${kind} ${lang} ${method}`;
        assert.ok(mail.subject.includes(order.code), where);
        for (const part of [mail.subject, mail.html, mail.text]) {
          assert.doesNotMatch(part, /undefined|NaN|null|\{\w+\}/, where);
        }
        assert.ok(mail.html.includes(orderUrl(base, order).replace(/&/g, "&amp;")), `${where}: link pesanan dengan token`);
        assert.ok(mail.text.includes(orderUrl(base, order)), where);
        // Satu tombol oranye per email, teksnya abyss (BRANDING: teks putih di atas oranye dilarang).
        assert.equal(mail.html.split(`background:${colors.mandarin};color:${colors.abyss}`).length - 1, 1, where);
        const showsAccount = mail.html.includes("1234 5678 90");
        assert.equal(showsAccount, method === "transfer" && kind !== "paid", `${where}: rekening hanya untuk transfer yang belum dibayar`);
        assert.equal(mail.html.includes(`lang="${lang}"`), true);
      }
    }
  }
});

test("isi email mengikuti jenisnya dan aman dari HTML tamu", () => {
  const order = { ...sampleOrder({ kind: "order", lang: "id", method: "midtrans", now }), name: '<script>alert("x")</script>' };
  const mail = orderMail("order", { order, base, contact });
  assert.ok(!mail.html.includes("<script>"));
  assert.ok(mail.html.includes("&lt;script&gt;"));
  assert.match(mail.html, /belum ada pembayaran yang masuk/);
  assert.match(mail.html, /Menunggu pembayaran/);
  assert.match(orderMail("reminder", { order, base, contact }).html, /Pembayaranmu belum kami terima/);
  const paid = orderMail("paid", { order: sampleOrder({ kind: "paid", lang: "en", method: "midtrans", now }), base, contact });
  assert.match(paid.subject, /Payment received/);
  assert.match(paid.html, /Card, e-wallet|QRIS/);
  assert.doesNotMatch(paid.html, /Pay before/);
  assert.equal(orderUrl(base, { lang: "id", code: "DD-261021-ABCDE", token: "a".repeat(32) }), `${base}/id/order/DD-261021-ABCDE?t=${"a".repeat(32)}`);
  assert.equal(orderUrl(base, { lang: "en", code: "DD-261021-ABCDE", token: "a".repeat(32) }), `${base}/order/DD-261021-ABCDE?t=${"a".repeat(32)}`);
  assert.throws(() => orderMail("other", { order, base }), /tidak dikenal/);
});

test("email kode OTP admin", () => {
  const mail = otpMail({ code: "048213", account: "halo@dragonetdivers.com", minutes: 10, base, now });
  assert.match(mail.subject, /^048213 /);
  assert.ok(mail.html.includes("048213") && mail.text.includes("048213"));
  assert.match(mail.text, /berlaku 10 menit/);
  assert.match(mail.html, /WIT/);
});
