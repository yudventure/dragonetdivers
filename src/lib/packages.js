// Bentuk paket di aplikasi (dari baris tabel packages) dan versi satu bahasanya untuk halaman.
// Murni supaya bisa dipakai server dan diuji.
import { lines } from "./checkout.js";

export const packageFromRow = (row) => ({
  id: Number(row.id),
  service: row.service,
  nameEn: row.name_en,
  nameId: row.name_id,
  summaryEn: row.summary_en ?? "",
  summaryId: row.summary_id ?? "",
  includesEn: row.includes_en ?? "",
  includesId: row.includes_id ?? "",
  price: Number(row.price_idr),
  unit: row.unit === "group" ? "group" : "person",
  minGuests: Number(row.min_guests),
  maxGuests: Number(row.max_guests),
  active: Boolean(Number(row.active)),
  sortOrder: Number(row.sort_order ?? 0),
});

/** Paket dalam satu bahasa: { id, service, name, summary, includes[], price, unit, minGuests, maxGuests }. */
export const localizePackage = (pkg, lang) => {
  const id = lang === "id";
  return {
    id: pkg.id,
    service: pkg.service,
    name: id ? pkg.nameId : pkg.nameEn,
    summary: id ? pkg.summaryId : pkg.summaryEn,
    includes: lines(id ? pkg.includesId : pkg.includesEn),
    price: pkg.price,
    unit: pkg.unit,
    minGuests: pkg.minGuests,
    maxGuests: pkg.maxGuests,
  };
};

const sameName = (a, b) => String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

/** Paket daftar harga yang belum ada (layanan sama dan nama English atau Indonesia sama dianggap sudah ada). */
export const missingPackages = (list, existing) =>
  list.filter((item) => !existing.some((pkg) => pkg.service === item.service && (sameName(pkg.nameEn, item.nameEn) || sameName(pkg.nameId, item.nameId))));

/**
 * Harga mulai tiap layanan untuk kartu layanan di beranda: paket aktif termurah per layanan,
 * { [service]: { price, unit } }. Harga per orang dan per grup dibandingkan apa adanya, lalu satuannya ikut
 * ditampilkan ("per person" atau "per group").
 */
export function startingPrices(packages) {
  const out = {};
  for (const pkg of packages) {
    if (pkg.active === false || !(pkg.price > 0)) continue;
    const current = out[pkg.service];
    if (!current || pkg.price < current.price) out[pkg.service] = { price: pkg.price, unit: pkg.unit === "group" ? "group" : "person" };
  }
  return out;
}
