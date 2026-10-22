import assert from "node:assert/strict";
import test from "node:test";
import { availability, DEFAULT_CAPACITY, slotCalendar } from "../src/lib/modules/calendar.js";
import { bookable, closedOn, dayState, lowAt, partySize, placesLeft } from "../src/lib/slots.js";

const now = new Date("2026-10-21T00:00:00Z");
const range = { min: "2026-10-22", max: "2027-10-21" };

test("kapasitas selam bawaan 30 orang sehari, snorkeling tanpa batas", () => {
  assert.deepEqual(DEFAULT_CAPACITY, { diving: 30, snorkeling: 0 });
});

test("paket satu pesanan di tanggal yang sama dihitung satu rombongan", () => {
  const orders = [
    { code: "DD-1", date: "2026-11-02", service: "fun-dives", guests: 4, status: "paid" }, // perahu ekskursi
    { code: "DD-1", date: "2026-11-02", service: "fun-dives", guests: 4, status: "paid" }, // fun dive-nya
    { code: "DD-1", date: "2026-11-03", service: "dive-courses", guests: 2, status: "paid" }, // hari lain
    { code: "DD-2", date: "2026-11-02", service: "dusk-dives", guests: 3, status: "pending", dueAt: "2026-10-22T00:00:00Z" },
  ];
  const a = availability({ date: "2026-11-02", service: "fun-dives", capacity: { diving: 30, snorkeling: 0 }, orders, now });
  assert.deepEqual(a, { closed: false, capacity: 30, used: 7, left: 23 });
});

test("data kalender tempat untuk tamu", () => {
  const orders = [
    { code: "DD-1", date: "2026-11-02", service: "fun-dives", guests: 6, status: "paid" },
    { code: "DD-1", date: "2026-11-02", service: "fun-dives", guests: 2, status: "paid" },
    { code: "DD-3", date: "2026-11-02", service: "snorkeling", guests: 9, status: "paid" }, // kelompok lain
    { code: "DD-4", date: "2026-11-04", service: "fun-dives", guests: 5, status: "expired" }, // tidak memakai tempat
    { code: "DD-5", date: "2028-01-01", service: "fun-dives", guests: 5, status: "paid" }, // di luar rentang
  ];
  const reservations = [
    { startDate: "2026-11-01", endDate: "2026-11-03", status: "confirmed", service: "dive-courses", participants: 4 },
    { startDate: "2026-11-02", status: "cancelled", service: "fun-dives", participants: 10 },
    { startDate: "2026-11-10", endDate: "2026-11-12", status: "closed", service: "all" },
    { startDate: "2026-11-20", status: "closed", service: "snorkeling" }, // layanan lain
    { startDate: "2026-09-01", status: "closed", service: "all" }, // sudah lewat
  ];
  const slots = slotCalendar({ service: "fun-dives", from: range.min, to: range.max, capacity: { diving: 30, snorkeling: 0 }, orders, reservations, now });
  assert.deepEqual(slots, {
    capacity: 30,
    used: { "2026-11-01": 4, "2026-11-02": 10, "2026-11-03": 4 },
    closed: [["2026-11-10", "2026-11-12"]],
  });
  const snorkel = slotCalendar({ service: "snorkeling", from: range.min, to: range.max, orders, reservations, now });
  assert.equal(snorkel.capacity, 0, "tanpa batas");
  assert.deepEqual(snorkel.used, { "2026-11-02": 9 });
  assert.equal(snorkel.closed.length, 2);
});

test("keadaan tanggal di kalender tempat", () => {
  const slots = { capacity: 30, used: { "2026-11-02": 26, "2026-11-03": 30, "2026-11-04": 12 }, closed: [["2026-11-10", "2026-11-12"]] };
  assert.equal(lowAt(30), 5);
  assert.equal(lowAt(8), 2);
  assert.equal(dayState(slots, "2026-10-21", range), "past");
  assert.equal(dayState(slots, "2027-10-22", range), "past");
  assert.equal(dayState(slots, "2026-11-02", range), "low");
  assert.equal(dayState(slots, "2026-11-03", range), "full");
  assert.equal(dayState(slots, "2026-11-04", range), "open");
  assert.equal(dayState(slots, "2026-11-11", range), "closed");
  assert.equal(placesLeft(slots, "2026-11-02"), 4);
  assert.equal(placesLeft(slots, "2026-11-05"), 30);
  assert.equal(placesLeft({ capacity: 0, used: {} }, "2026-11-05"), null);
  assert.equal(dayState({ capacity: 0, used: {}, closed: [] }, "2026-11-05", range), "open");
  assert.ok(closedOn(slots, "2026-11-12") && !closedOn(slots, "2026-11-13"));
  assert.ok(bookable("low") && bookable("open") && !bookable("full") && !bookable("closed") && !bookable("past"));
  assert.equal(partySize([{ guests: 2 }, { guests: 5 }, { guests: 1 }]), 5);
  assert.equal(partySize([]), 0);
});
