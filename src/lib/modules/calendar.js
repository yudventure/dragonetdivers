// Kalender reservasi (mengikuti Zanclus): reservasi yang dicatat tim (WhatsApp, datang langsung, agen),
// tanggal tutup, dan kapasitas harian. Pesanan dari website (tabel orders) ikut tampil di kalender.
// Tanggal tutup dan kapasitas juga diperiksa checkout (src/server/checkout.js) dan tampil di kalender tempat
// halaman layanan (slotCalendar, src/lib/slots.js).
import { RecordError } from "../records.js";

export const SERVICE_OPTIONS = [
  ["fun-dives", "Fun dive"],
  ["dive-courses", "Kursus selam"],
  ["snorkeling", "Snorkeling"],
  ["island-trips", "Trip pulau"],
  ["dusk-dives", "Dusk dive"],
];

/** Kelompok kapasitas harian: tamu menyelam dan tamu snorkeling/trip dihitung terpisah. */
export const POOLS = { diving: ["fun-dives", "dive-courses", "dusk-dives"], snorkeling: ["snorkeling", "island-trips"] };
export const POOL_LABEL = { diving: "Menyelam (fun dive, kursus, dusk dive)", snorkeling: "Snorkeling & trip pulau" };
export const poolOf = (service) => Object.keys(POOLS).find((pool) => POOLS[pool].includes(service)) ?? null;
// 0 = tanpa batas. Bawaan 30 tamu selam sehari (contoh dari pemilik, sama dengan Zanclus); diubah tim di /admin/kalender.
export const DEFAULT_CAPACITY = { diving: 30, snorkeling: 0 };

export const RESERVATION_STATUS = [
  ["pending", "Belum dikonfirmasi"],
  ["confirmed", "Dikonfirmasi"],
  ["closed", "Tutup (tanggal tidak dijual)"],
  ["cancelled", "Dibatalkan"],
];

const MAX_DAYS = 366;
const dayNumber = (date) => Date.UTC(...date.split("-").map((n, i) => (i === 1 ? Number(n) - 1 : Number(n)))) / 86_400_000;

export const reservation = {
  kind: "reservation",
  prefix: "rsv",
  noun: "reservasi",
  dateField: "startDate",
  fields: [
    { key: "startDate", label: "Tanggal mulai", short: "Mulai", type: "date", required: true, list: true },
    { key: "endDate", label: "Tanggal selesai", short: "Selesai", type: "date", hint: "Kosongkan bila hanya satu hari." },
    { key: "status", label: "Status", type: "select", required: true, options: RESERVATION_STATUS, default: "confirmed", list: true },
    { key: "service", label: "Layanan", type: "select", options: [["all", "Semua layanan"], ...SERVICE_OPTIONS], default: "fun-dives", required: true, list: true },
    { key: "guestName", label: "Nama tamu atau grup", short: "Tamu", type: "text", max: 120, list: true, hint: "Boleh kosong untuk tanggal tutup." },
    { key: "participants", label: "Jumlah orang", short: "Orang", type: "number", min: 1, max: 100, default: 1, list: true },
    { key: "source", label: "Sumber", type: "select", default: "whatsapp", options: [["whatsapp", "WhatsApp"], ["walkin", "Datang langsung"], ["agent", "Agen / mitra"], ["email", "Email"], ["phone", "Telepon"], ["other", "Lainnya"]], list: true },
    { key: "partnerId", label: "Agen / mitra", type: "ref", refKind: "partner", hint: "Isi bila tamu datang lewat agen di PR & mitra." },
    { key: "phone", label: "WhatsApp / telepon", type: "phone" },
    { key: "email", label: "Email tamu", type: "email" },
    { key: "lang", label: "Bahasa tamu", type: "select", default: "id", options: [["id", "Indonesia"], ["en", "English"]] },
    { key: "amount", label: "Nilai (Rp)", short: "Nilai", type: "money", list: true },
    { key: "payStatus", label: "Pembayaran", type: "select", default: "unpaid", options: [["unpaid", "Belum dibayar"], ["dp", "Uang muka"], ["paid", "Lunas"]], list: true },
    { key: "payMethod", label: "Cara bayar", type: "select", options: [["tunai", "Tunai"], ["transfer", "Transfer bank"], ["qris", "QRIS"], ["card", "Kartu di lokasi (EDC)"], ["other", "Lainnya"]] },
    { key: "notes", label: "Catatan", type: "textarea", max: 2000, wide: true },
  ],
  check(r) {
    if (r.endDate && r.endDate < r.startDate) throw new RecordError("Tanggal selesai tidak boleh sebelum tanggal mulai.", "endDate");
    if (r.endDate && dayNumber(r.endDate) - dayNumber(r.startDate) > MAX_DAYS) throw new RecordError("Paling lama satu tahun.", "endDate");
    if (r.status !== "closed" && !r.guestName) throw new RecordError("Nama tamu atau grup wajib diisi.", "guestName");
    if (r.status !== "closed" && r.service === "all") throw new RecordError("Pilih layanan reservasinya.", "service");
    if (r.status === "closed") Object.assign(r, { participants: null, payStatus: "", payMethod: "", source: "", amount: null }); // tanggal tutup tanpa tamu
    else if (!r.participants) r.participants = 1;
  },
};

/** Semua tanggal "YYYY-MM-DD" yang dicakup reservasi. */
export function reservationDays(r) {
  const days = [];
  const end = r.endDate || r.startDate;
  for (let d = dayNumber(r.startDate); d <= dayNumber(end) && days.length <= MAX_DAYS; d++) days.push(new Date(d * 86_400_000).toISOString().slice(0, 10));
  return days;
}

export const covers = (r, date) => r.startDate <= date && (r.endDate || r.startDate) >= date;

/** Reservasi yang memakai tempat: dikonfirmasi atau belum dikonfirmasi (bukan tutup/batal). */
export const holdsPlaces = (r) => r.status === "confirmed" || r.status === "pending";

/** Pesanan website yang memakai tempat: lunas, atau menunggu bayar dan belum lewat batas waktu. */
export const orderHoldsPlaces = (o, now = new Date()) => o.status === "paid" || (o.status === "pending" && (!o.dueAt || new Date(o.dueAt) > now));

/**
 * Orang dari pesanan website yang lolos keep(o). Baris pesanan per paket; paket-paket satu pesanan di tanggal
 * dan kelompok yang sama dianggap satu rombongan (jumlah tamu terbesarnya), misalnya perahu ekskursi dan
 * fun dive-nya. Hasilnya { "YYYY-MM-DD": orang }.
 */
function orderPeople(orders, keep) {
  const groups = new Map();
  orders.forEach((o, i) => {
    if (!keep(o)) return;
    const key = `${o.code ?? `#${i}`}|${o.date}|${poolOf(o.service)}`;
    groups.set(key, { date: o.date, people: Math.max(groups.get(key)?.people ?? 0, Number(o.guests) || 0) });
  });
  const days = {};
  for (const { date, people } of groups.values()) days[date] = (days[date] ?? 0) + people;
  return days;
}

/**
 * Ketersediaan satu tanggal untuk satu layanan. { closed, capacity, used, left } (left null = tanpa batas).
 * orders = pesanan website pada tanggal itu, reservations = reservasi yang mencakup tanggal itu.
 */
export function availability({ date, service, capacity = DEFAULT_CAPACITY, orders = [], reservations = [], now = new Date() }) {
  const pool = poolOf(service);
  const closed = reservations.some((r) => r.status === "closed" && covers(r, date) && (r.service === "all" || r.service === service));
  const limit = pool ? Number(capacity[pool]) || 0 : 0;
  const inPool = (s) => poolOf(s) === pool;
  const used =
    (orderPeople(orders, (o) => o.date === date && inPool(o.service) && orderHoldsPlaces(o, now))[date] ?? 0) +
    reservations.filter((r) => holdsPlaces(r) && covers(r, date) && inPool(r.service)).reduce((sum, r) => sum + (r.participants || 1), 0);
  return { closed, capacity: limit, used, left: limit ? Math.max(0, limit - used) : null };
}

/**
 * Data kalender tempat untuk tamu (halaman layanan dan checkout, mengikuti Zanclus) di rentang { from, to }:
 * { capacity, used: { "YYYY-MM-DD": orang }, closed: [[mulai, selesai]] }. Hanya angka, tanpa nama atau kontak.
 */
export function slotCalendar({ service, from, to, capacity = DEFAULT_CAPACITY, orders = [], reservations = [], now = new Date() }) {
  const pool = poolOf(service);
  const inPool = (s) => pool !== null && poolOf(s) === pool;
  const used = orderPeople(orders, (o) => o.date >= from && o.date <= to && inPool(o.service) && orderHoldsPlaces(o, now));
  for (const r of reservations.filter((r) => holdsPlaces(r) && inPool(r.service))) {
    for (const day of reservationDays(r)) if (day >= from && day <= to) used[day] = (used[day] ?? 0) + (r.participants || 1);
  }
  const closed = reservations
    .filter((r) => r.status === "closed" && (r.service === "all" || r.service === service) && (r.endDate || r.startDate) >= from)
    .map((r) => [r.startDate, r.endDate || r.startDate]);
  return { capacity: pool ? Number(capacity[pool]) || 0 : 0, used, closed };
}

/** Isian kapasitas dari /admin/kalender: angka 0–500 per kelompok. */
export function validateCapacity(input) {
  const out = {};
  for (const pool of Object.keys(DEFAULT_CAPACITY)) {
    const n = Number(input?.[pool] ?? 0);
    if (!Number.isInteger(n) || n < 0 || n > 500) throw new RecordError("Kapasitas berupa angka 0 sampai 500 (0 = tanpa batas).", pool);
    out[pool] = n;
  }
  return out;
}

/** Hari-hari kotak kalender bulan "YYYY-MM", mulai Senin; null untuk kotak kosong. */
export function monthGrid(month) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7;
  const cells = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= days; d++) cells.push(`${month}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}
