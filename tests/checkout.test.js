import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CheckoutError,
  cleanEmail,
  cleanWhatsApp,
  dateRange,
  isOrderCode,
  isOverdue,
  lines,
  newOrderCode,
  nextStatus,
  orderTotal,
  paymentOutcome,
  paypalUsd,
  validateCheckout,
  validatePackage,
  validatePayments,
  witToday,
} from "../src/lib/checkout.js";
import { keyEnding, keyIssues, productionOn } from "../src/lib/midtrans-key.js";

const NOW = new Date("2026-10-21T05:00:00Z"); // 14.00 WIT
const pkg = { id: 1, service: "fun-dives", price: 1_250_000, unit: "person", minGuests: 1, maxGuests: 6 };
const good = {
  guests: 2,
  date: "2026-11-02",
  name: "  Ana   Lopez ",
  email: "Ana@Example.com",
  whatsapp: "+34 612 345 678",
  certification: "advanced",
  notes: "Vegetarian",
  method: "transfer",
};
const fails = (input, field, opts = {}) =>
  assert.throws(
    () => validateCheckout(input, { pkg, methods: ["midtrans", "transfer"], now: NOW, ...opts }),
    (e) => e instanceof CheckoutError && e.field === field,
    field,
  );

test("checkout menghitung total di server dan membersihkan isian", () => {
  const value = validateCheckout(good, { pkg, methods: ["midtrans", "transfer"], now: NOW });
  assert.deepEqual(value, {
    guests: 2,
    date: "2026-11-02",
    name: "Ana Lopez",
    email: "ana@example.com",
    whatsapp: "34612345678",
    certification: "advanced",
    notes: "Vegetarian",
    method: "transfer",
    amount: 2_500_000,
  });
  assert.equal(orderTotal({ price: 4_000_000, unit: "group" }, 5), 4_000_000);
  // Sertifikasi hanya ditanyakan untuk layanan selam.
  const snorkel = validateCheckout(good, { pkg: { ...pkg, service: "snorkeling" }, methods: ["transfer"], now: NOW });
  assert.equal(snorkel.certification, null);
});

test("checkout menolak isian yang salah dengan nama isiannya", () => {
  fails({ ...good, guests: 0 }, "guests");
  fails({ ...good, guests: 7 }, "guests");
  fails({ ...good, guests: "2.5" }, "guests");
  fails({ ...good, date: "2026-10-21" }, "date"); // hari ini (WIT) belum bisa
  fails({ ...good, date: "2027-10-23" }, "date"); // lebih dari setahun
  fails({ ...good, date: "2026-02-30x" }, "date");
  fails({ ...good, name: "A" }, "name");
  fails({ ...good, email: "ana@" }, "email");
  fails({ ...good, whatsapp: "123" }, "whatsapp");
  fails({ ...good, notes: "x".repeat(1001) }, "notes");
  fails({ ...good, method: "paypal" }, "method");
  fails({ ...good, website: "http://spam" }, "form");
  fails(null, "form");
  fails(good, "package", { pkg: null });
  assert.throws(() => validateCheckout(good, { pkg, methods: [], now: NOW }), (e) => e.field === "method" && e.status === 409);
});

test("WhatsApp, email, tanggal WIT", () => {
  assert.equal(cleanWhatsApp("0812-3456-7890"), "6281234567890");
  assert.equal(cleanWhatsApp("0061 412 345 678"), "61412345678");
  assert.equal(cleanWhatsApp("(+62) 812 3456 7890"), "6281234567890");
  assert.equal(cleanWhatsApp("abc"), null);
  assert.equal(cleanEmail(" A@B.co "), "a@b.co");
  assert.equal(cleanEmail("a b@c.d"), null);
  assert.equal(witToday(new Date("2026-10-21T16:30:00Z")), "2026-10-22"); // 01.30 WIT keesokan harinya
  assert.deepEqual(dateRange(NOW), { min: "2026-10-22", max: "2027-10-21" });
});

test("PayPal ditagih dalam dolar, dibulatkan ke atas per sen", () => {
  assert.equal(paypalUsd(2_500_000, 16_250), "153.85");
  assert.equal(paypalUsd(1_600_000, 16_000), "100.00");
});

test("status Midtrans dan perubahan status pesanan", () => {
  assert.equal(paymentOutcome({ transaction_status: "settlement" }), "paid");
  assert.equal(paymentOutcome({ transaction_status: "capture", fraud_status: "accept" }), "paid");
  assert.equal(paymentOutcome({ transaction_status: "capture", fraud_status: "challenge" }), "pending");
  assert.equal(paymentOutcome({ transaction_status: "capture", fraud_status: "deny" }), "failed");
  assert.equal(paymentOutcome({ transaction_status: "expire" }), "expired");
  assert.equal(paymentOutcome({ transaction_status: "cancel" }), "failed");
  assert.equal(paymentOutcome({ transaction_status: "refund" }), "refunded");
  assert.equal(paymentOutcome({ transaction_status: "?" }), null);

  assert.equal(nextStatus("pending", "paid"), "paid");
  assert.equal(nextStatus("pending", "pending"), null);
  assert.equal(nextStatus("pending", "refunded"), null);
  assert.equal(nextStatus("paid", "expired"), null, "pesanan lunas tidak kembali menunggu atau batal");
  assert.equal(nextStatus("paid", "refunded"), "refunded");
  assert.equal(nextStatus("expired", "paid"), "paid", "uang yang masuk setelah batas waktu tetap dicatat");
  assert.equal(nextStatus("cancelled", "failed"), null);
  assert.equal(nextStatus("refunded", "paid"), null);
  assert.ok(isOverdue({ status: "pending", dueAt: "2026-10-21T04:00:00Z" }, NOW));
  assert.ok(!isOverdue({ status: "paid", dueAt: "2026-10-21T04:00:00Z" }, NOW));
});

test("kode pesanan: tanggal WIT dan karakter yang tidak membingungkan", () => {
  const code = newOrderCode(NOW, () => new Uint8Array([0, 1, 2, 30, 31]));
  assert.equal(code, "DD-261021-ABC89");
  assert.ok(isOrderCode(code));
  assert.ok(isOrderCode(newOrderCode()));
  assert.ok(!isOrderCode("DD-261021-abc89") && !isOrderCode("x"));
});

test("paket dari admin divalidasi dengan pesan Bahasa Indonesia", () => {
  const services = ["fun-dives", "snorkeling"];
  const value = validatePackage(
    {
      service: "fun-dives",
      nameEn: "Two fun dives",
      nameId: "Dua kali fun dive",
      price: "1.500.000",
      unit: "person",
      minGuests: "1",
      maxGuests: "6",
      includesEn: "- Guide\n\n• Tanks and weights\n",
      includesId: "Pemandu\nTabung dan pemberat",
    },
    services,
  );
  assert.equal(value.price, 1_500_000);
  assert.equal(value.includesEn, "Guide\nTanks and weights");
  assert.equal(value.active, true);
  assert.deepEqual(lines(value.includesId), ["Pemandu", "Tabung dan pemberat"]);
  const bad = (patch, message) => assert.throws(() => validatePackage({ ...value, ...patch }, services), message);
  bad({ service: "x" }, /layanan/);
  bad({ price: "5000" }, /Rp 10\.000/);
  bad({ nameId: "" }, /wajib/);
  bad({ minGuests: 4, maxGuests: 2 }, /Jumlah tamu/);
  bad({ nameEn: "<b>x</b>" }, /< atau >/);
});

test("pengaturan pembayaran: rekening lengkap, batas waktu dari pilihan", () => {
  assert.deepEqual(validatePayments(null), { midtrans: false, paypal: false, transfer: false, accounts: [], dueHours: 24 });
  const value = validatePayments({
    transfer: true,
    paypal: "yes",
    dueHours: 7,
    accounts: [{ bank: "BCA", number: "123 456 7890", holder: "Dragonet Divers" }, { bank: "", number: "", holder: "" }],
  });
  assert.deepEqual(value, { midtrans: false, paypal: false, transfer: true, accounts: [{ bank: "BCA", number: "123 456 7890", holder: "Dragonet Divers" }], dueHours: 24 });
  assert.throws(() => validatePayments({ accounts: [{ bank: "BCA", number: "", holder: "X" }] }), /Lengkapi/);
  assert.throws(() => validatePayments({ accounts: [{ bank: "BCA", number: "12ab45", holder: "X" }] }), /angka/);
});

test("server key Midtrans: salah tempel dijelaskan, mode cocok", () => {
  assert.deepEqual(keyIssues("SB-Mid-server-abcDEF123456", ""), []);
  assert.deepEqual(keyIssues(" 'Mid-server-abcDEF123456' ", "true"), []);
  assert.match(keyIssues("SB-Mid-client-abc", "")[0], /Client Key/);
  assert.match(keyIssues("Mid-server-abcDEF123456", "")[0], /MIDTRANS_PRODUCTION/);
  assert.match(keyIssues("SB-Mid-server-abcDEF123456", "true")[0], /sandbox/);
  assert.match(keyIssues("SB-Mid-server-abcDEF123456 true", "")[0], /teks tambahan/);
  assert.match(keyIssues("", "yes")[0], /MIDTRANS_PRODUCTION berisi/);
  assert.equal(keyEnding("SB-Mid-server-abcDEF123456"), "3456");
  assert.ok(productionOn('"True"') && !productionOn("1"));
});
