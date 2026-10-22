// Kalender tempat di halaman layanan dan di jendela checkout (mengikuti SlotCalendar Zanclus): keadaan tiap
// tanggal dari data slotCalendar() (src/lib/modules/calendar.js). Fungsi murni, diuji tests/slots.test.js.

/** Sisa tempat yang dianggap "hampir penuh": 5 dari 30, lebih sedikit untuk kapasitas kecil. */
export const lowAt = (capacity) => Math.min(5, Math.ceil(capacity / 5));

export const closedOn = (slots, date) => (slots?.closed ?? []).some(([from, to]) => date >= from && date <= to);

/** Tempat yang masih kosong di sebuah tanggal, atau null bila tanpa batas harian. */
export const placesLeft = (slots, date) => (slots?.capacity ? Math.max(0, slots.capacity - (slots.used?.[date] ?? 0)) : null);

/** "past" (di luar rentang pesan) | "closed" | "full" | "low" | "open" untuk tanggal "YYYY-MM-DD". */
export function dayState(slots, date, range) {
  if (!date || date < range.min || date > range.max) return "past";
  if (closedOn(slots, date)) return "closed";
  const left = placesLeft(slots, date);
  if (left === null) return "open";
  return left === 0 ? "full" : left <= lowAt(slots.capacity) ? "low" : "open";
}

export const bookable = (state) => state === "open" || state === "low";

/** Tamu yang memakai tempat untuk satu pesanan: paket-paketnya satu rombongan (jumlah tamu terbesar). */
export const partySize = (items) => items.reduce((most, item) => Math.max(most, Number(item.guests) || 0), 0);
