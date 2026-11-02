// Logika pemilih tanggal bermerek (src/components/DatePicker.jsx), pengganti kalender bawaan peramban di
// formulir website dan admin (permintaan pemilik 2 November 2026: "jangan pake tanggalan default, percantik
// dan lebih profesional, demikian juga tampilan pilihan tanggal di seluruh website"). Tanggal selalu teks
// YYYY-MM-DD dan bulan YYYY-MM, dihitung di UTC supaya tidak bergeser karena zona waktu peramban.
// Fungsi murni, diuji tests/date-picker.test.js.

const DAY = 86_400_000;
const pad = (n) => String(n).padStart(2, "0");
const utc = (date) => Date.parse(`${date}T00:00:00Z`);
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

/** Tanggal YYYY-MM-DD yang benar-benar ada di kalender. */
export function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const ms = utc(value);
  return !Number.isNaN(ms) && iso(ms) === value;
}

export const addDays = (date, days) => iso(utc(date) + days * DAY);

/** Bulan YYYY-MM digeser delta bulan. */
export function shiftMonth(month, delta) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

/** Tanggal yang sama di bulan lain (dipotong ke akhir bulan, mis. 31 Maret → 30 April). */
export function sameDayIn(date, month) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${month}-${pad(Math.min(Number(date.slice(8, 10)), last))}`;
}

/** Sel kalender satu bulan, Senin lebih dulu: tanggal YYYY-MM-DD atau null untuk sel kosong. */
export function monthDays(month) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = Array.from({ length: (first + 6) % 7 }, () => null);
  for (let d = 1; d <= count; d++) cells.push(`${month}-${pad(d)}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** Apakah tanggal boleh dipilih (min dan max opsional, inklusif). */
export const allowed = (date, min, max) => Boolean(date) && (!min || date >= min) && (!max || date <= max);

/** Tanggal dijepit ke rentang min sampai max. */
export const clampDate = (date, min, max) => (min && date < min ? min : max && date > max ? max : date);

/**
 * Bulan yang ditampilkan saat kalender dibuka: bulan tanggal terpilih, atau bulan awal yang diminta
 * (mis. 30 tahun lalu untuk tanggal lahir), atau bulan ini; selalu di dalam rentang.
 */
export function viewFor(value, { min, max, today, start } = {}) {
  const base = isIsoDate(value) ? value : isIsoDate(start) ? start : today;
  return clampDate(base, min, max).slice(0, 7);
}

/** Tahun untuk pilihan tahun, terbaru lebih dulu. Tanpa min: 100 tahun ke belakang; tanpa max: 5 tahun ke depan. */
export function yearOptions({ min, max, today }) {
  const year = Number(today.slice(0, 4));
  const from = min ? Number(min.slice(0, 4)) : year - 100;
  const to = max ? Number(max.slice(0, 4)) : year + 5;
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => to - i);
}

/** Bulan (1 sampai 12) yang punya setidaknya satu tanggal di rentang, untuk tahun tertentu. */
export function monthOptions(year, { min, max }) {
  return Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => {
    const first = `${year}-${pad(m)}-01`;
    const last = `${year}-${pad(m)}-${pad(new Date(Date.UTC(year, m, 0)).getUTCDate())}`;
    return (!min || last >= min) && (!max || first <= max);
  });
}

/** Tanggal tujuan tombol panah di kalender (kiri/kanan sehari, atas/bawah seminggu, PageUp/PageDown sebulan). */
export function stepDate(date, key, { min, max } = {}) {
  const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  let next = date;
  if (key in moves) next = addDays(date, moves[key]);
  else if (key === "PageUp") next = sameDayIn(date, shiftMonth(date.slice(0, 7), -1));
  else if (key === "PageDown") next = sameDayIn(date, shiftMonth(date.slice(0, 7), 1));
  else if (key === "Home") next = addDays(date, -((new Date(utc(date)).getUTCDay() + 6) % 7));
  else if (key === "End") next = addDays(date, 6 - ((new Date(utc(date)).getUTCDay() + 6) % 7));
  return clampDate(next, min, max);
}
