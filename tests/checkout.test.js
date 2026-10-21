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
  MAX_ITEMS,
  summarizeItems,
  validateCart,
  validatePackage,
  validatePayments,
  witToday,
} from "../src/lib/checkout.js";
import { keyEnding, keyIssues, productionOn } from "../src/lib/midtrans-key.js";

const NOW = new Date("2026-10-21T05:00:00Z"); // 14.00 WIT
const pkg = { id: 1, service: "fun-dives", price: 1_250_000, unit: "person", minGuests: 1, maxGuests: 6 };
const boat = { id: 7, service: "snorkeling", price: 2_000_000, unit: "group", minGuests: 1, maxGuests: 6 };
const packages = { 1: pkg, 7: boat };
const good = {
  items: [{ packageId: 1, guests: 2, date: "2026-11-02" }],
  name: "  Ana   Lopez ",
  email: "Ana@Example.com",
  whatsapp: "+34 612 345 678",
  certification: "advanced",
  notes: "Vegetarian",
  method: "transfer",
};
const withItem = (patch) => ({ ...good, items: [{ ...good.items[0], ...patch }] });
const fails = (input, field, opts = {}, index = undefined) =>
  assert.throws(
    () => validateCart(input, { packages, methods: ["midtrans", "transfer"], now: NOW, ...opts }),
    (e) => e instanceof CheckoutError && e.field === field && (index === undefined || e.index === index),
    field,
  );

test("checkout menghitung total di server dan membersihkan isian", () => {
  const value = validateCart(good, { packages, methods: ["midtrans", "transfer"], now: NOW });
  assert.deepEqual(value, {
    items: [{ pkg, guests: 2, date: "2026-11-02", amount: 2_500_000 }],
    name: "Ana Lopez",
    email: "ana@example.com",
    whatsapp: "34612345678",
    certification: "advanced",
    notes: "Vegetarian",
    method: "transfer",
    amount: 2_500_000,
  });
  assert.equal(orderTotal({ price: 4_000_000, unit: "group" }, 5), 4_000_000);
  // Beberapa paket: total dijumlahkan, harga per perahu tidak dikali tamu.
  const cart = validateCart(
    { ...good, items: [...good.items, { packageId: 7, guests: 5, date: "2026-11-03" }] },
    { packages, methods: ["transfer"], now: NOW },
  );
  assert.equal(cart.amount, 4_500_000);
  assert.deepEqual(cart.items.map((item) => item.amount), [2_500_000, 2_000_000]);
  // Sertifikasi hanya ditanyakan bila ada layanan selam di keranjang.
  const snorkel = validateCart({ ...good, items: [{ packageId: 7, guests: 2, date: "2026-11-02" }] }, { packages, methods: ["transfer"], now: NOW });
  assert.equal(snorkel.certification, null);
});

test("checkout menolak isian yang salah dengan nama isiannya dan urutan paketnya", () => {
  fails(withItem({ guests: 0 }), "guests", {}, 0);
  fails(withItem({ guests: 7 }), "guests");
  fails(withItem({ guests: "2.5" }), "guests");
  fails(withItem({ date: "2026-10-21" }), "date"); // hari ini (WIT) belum bisa
  fails(withItem({ date: "2027-10-23" }), "date"); // lebih dari setahun
  fails(withItem({ date: "2026-02-30x" }), "date");
  fails({ ...good, items: [...good.items, { packageId: 7, guests: 9, date: "2026-11-02" }] }, "guests", {}, 1);
  fails({ ...good, items: [...good.items, { packageId: 99, guests: 1, date: "2026-11-02" }] }, "package", {}, 1);
  fails({ ...good, items: [] }, "empty");
  fails({ ...good, items: "1" }, "empty");
  fails({ ...good, items: Array.from({ length: MAX_ITEMS + 1 }, () => good.items[0]) }, "form");
  fails({ ...good, name: "A" }, "name");
  fails({ ...good, email: "ana@" }, "email");
  fails({ ...good, whatsapp: "123" }, "whatsapp");
  fails({ ...good, notes: "x".repeat(1001) }, "notes");
  fails({ ...good, method: "paypal" }, "method");
  fails({ ...good, website: "http://spam" }, "form");
  fails(null, "form");
  assert.throws(() => validateCart(good, { packages, methods: [], now: NOW }), (e) => e.field === "method" && e.status === 409);
});

test("ringkasan pesanan dari isinya", () => {
  const items = [
    { packageId: 1, service: "fun-dives", packageName: "Two morning fun dives", unit: "person", unitPrice: 1_600_000, guests: 2, date: "2026-11-04" },
    { packageId: 7, service: "snorkeling", packageName: "Manta Point snorkeling", unit: "group", unitPrice: 2_000_000, guests: 5, date: "2026-11-02" },
  ];
  assert.deepEqual(summarizeItems(items, "en"), {
    packageId: 1,
    service: "fun-dives",
    packageName: "Two morning fun dives + 1 more",
    unit: "person",
    unitPrice: 1_600_000,
    guests: 5,
    date: "2026-11-02",
  });
  assert.equal(summarizeItems(items, "id").packageName, "Two morning fun dives + 1 lainnya");
  assert.equal(summarizeItems(items.slice(0, 1)).packageName, "Two morning fun dives");
  assert.equal(summarizeItems([{ ...items[0], packageName: "x".repeat(120) }, items[1]]).packageName.length, 120);
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
