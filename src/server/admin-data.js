import "server-only";
import { covers, DEFAULT_CAPACITY, holdsPlaces } from "@/lib/modules/calendar";
import { DEFAULT_TAX, orderIncome } from "@/lib/modules/finance";
import { attendanceRecap, computePayslip } from "@/lib/modules/hr";
import { monthRange, shiftMonth } from "@/lib/records";
import { allOrders, ordersForDates, paidOrdersBetween } from "./orders";
import { listRecords } from "./records";
import { getSetting } from "./settings";

// Data gabungan untuk halaman modul admin (kalender, tamu, keuangan, HRD).

/** Pilihan [id, label] untuk kolom rujukan di form. */
export const refOptions = (records, label = (r) => r.name) =>
  records.map((r) => [r.id, label(r)]).sort((a, b) => a[1].localeCompare(b[1], "id"));

/** Awal hari WIT sebuah tanggal sebagai Date UTC. */
const witStart = (date) => new Date(`${date}T00:00:00+09:00`);
const nextDay = (date) => new Date(new Date(`${date}T00:00:00Z`).getTime() + 86_400_000).toISOString().slice(0, 10);

// --- Kalender ---------------------------------------------------------------------------------------

export const calendarCapacity = () => getSetting("calendar", DEFAULT_CAPACITY);

/** Pesanan website dan reservasi tim yang menyentuh bulan ini, plus kapasitas harian. */
export async function calendarMonth(month) {
  const { from, to } = monthRange(month);
  const [orders, reservations, capacity, partners] = await Promise.all([
    ordersForDates(from, to),
    listRecords("reservation", { from: `${shiftMonth(month, -12)}-01`, to }),
    calendarCapacity(),
    listRecords("partner"),
  ]);
  const inMonth = reservations.filter((r) => r.startDate <= to && (r.endDate || r.startDate) >= from);
  return { orders: orders.filter((o) => !["failed", "cancelled"].includes(o.status)), reservations: inMonth, capacity, partners };
}

/** Tanggal tutup dan pemakaian tempat untuk satu tanggal (dipakai checkout). */
export async function dayBookings(date) {
  const [orders, reservations, capacity] = await Promise.all([
    ordersForDates(date, date),
    listRecords("reservation", { from: `${shiftMonth(date.slice(0, 7), -12)}-01`, to: date }),
    calendarCapacity(),
  ]);
  return { orders, reservations: reservations.filter((r) => covers(r, date)), capacity };
}

// --- Tamu -------------------------------------------------------------------------------------------

const phoneKey = (p) => String(p ?? "").replace(/\D/g, "").replace(/^0/, "62");

/**
 * Daftar tamu dari pesanan website dan reservasi tim (seperti Zanclus: tanpa tabel tamu), dikelompokkan
 * per nomor WhatsApp, lalu email, lalu nama.
 */
export async function guestList() {
  const [orders, reservations] = await Promise.all([allOrders(), listRecords("reservation")]);
  const guests = new Map();
  const add = (entry) => {
    const key = phoneKey(entry.phone) || entry.email || entry.name.trim().toLowerCase();
    if (!key) return;
    const g = guests.get(key) ?? { key, name: entry.name, phone: "", email: "", lang: entry.lang, certification: "", bookings: 0, paid: 0, last: "", next: "", sources: new Set() };
    g.name ||= entry.name;
    g.phone ||= entry.phone ?? "";
    g.email ||= entry.email ?? "";
    g.certification ||= entry.certification ?? "";
    g.bookings += 1;
    g.paid += entry.paid;
    g.sources.add(entry.source);
    const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
    if (entry.date < today && entry.date > g.last) g.last = entry.date;
    if (entry.date >= today && (!g.next || entry.date < g.next)) g.next = entry.date;
    guests.set(key, g);
  };
  for (const o of orders.filter((o) => !["failed"].includes(o.status))) {
    add({ name: o.name, phone: o.whatsapp ? `+${o.whatsapp}` : "", email: o.email, lang: o.lang, certification: o.certification, date: o.date, paid: o.status === "paid" ? o.amount : 0, source: "Website" });
  }
  for (const r of reservations.filter((r) => r.status !== "closed" && r.guestName)) {
    add({ name: r.guestName, phone: r.phone, email: r.email, lang: r.lang, date: r.startDate, paid: r.payStatus === "paid" ? r.amount || 0 : 0, source: "Reservasi tim" });
  }
  return [...guests.values()]
    .map((g) => ({ ...g, sources: [...g.sources].join(", ") }))
    .sort((a, b) => (b.next || b.last).localeCompare(a.next || a.last));
}

// --- Keuangan ---------------------------------------------------------------------------------------

export const financeSettings = () => getSetting("finance", DEFAULT_TAX);

/** Transaksi buku kas dan pesanan lunas (otomatis) di antara dua tanggal WIT. */
export async function financeRows(from, to) {
  const [stored, orders] = await Promise.all([listRecords("transaction", { from, to }), paidOrdersBetween(witStart(from), witStart(nextDay(to)))]);
  return [...stored, ...orderIncome(orders)].sort((a, b) => b.date.localeCompare(a.date));
}

// --- Ringkasan --------------------------------------------------------------------------------------

/** Angka singkat untuk "Ringkasan cepat": tamu hari ini dan tanggal tutup. */
export async function todaySummary(today) {
  const { orders, reservations } = await dayBookings(today);
  const guests =
    orders.filter((o) => o.status === "paid" || o.status === "pending").reduce((s, o) => s + o.guests, 0) +
    reservations.filter(holdsPlaces).reduce((s, r) => s + (r.participants || 1), 0);
  const closed = reservations.some((r) => r.status === "closed");
  return { guests, closed };
}

// --- HRD --------------------------------------------------------------------------------------------

/** Absensi satu bulan dan rekap per pegawai. */
export async function attendanceMonth(month) {
  const { from, to } = monthRange(month);
  const [employees, rows] = await Promise.all([listRecords("employee"), listRecords("attendance", { from, to })]);
  return { employees: employees.sort((a, b) => a.name.localeCompare(b.name, "id")), rows, recap: attendanceRecap(rows) };
}

/** Slip gaji bulan ini: yang sudah dikunci memakai angka tersimpan, sisanya dihitung dari absensi. */
export async function payrollMonth(month) {
  const [{ employees, recap }, locked] = await Promise.all([attendanceMonth(month), listRecords("payslip", { from: `${month}-01`, to: `${month}-01` })]);
  const lockedBy = Object.fromEntries(locked.map((s) => [s.employeeId, s]));
  return employees
    .filter((e) => e.active || lockedBy[e.id])
    .map((e) => lockedBy[e.id] ?? computePayslip(e, recap[e.id]));
}
