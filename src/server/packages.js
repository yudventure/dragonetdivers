import "server-only";
import { PRICE_LIST } from "@/content/price-list";
import { validatePackage } from "@/lib/checkout";
import { missingPackages, packageFromRow, startingPrices } from "@/lib/packages";
import { services } from "@/lib/services";
import { isDatabaseConfigured } from "./db-config.js";
import { query } from "./db";

// Paket di MySQL (tabel packages, database/migrations/002_packages.sql), diisi tim di /admin/paket.

const COLUMNS =
  "id, service, name_en, name_id, summary_en, summary_id, includes_en, includes_id, price_idr, unit, min_guests, max_guests, active, sort_order";
const ORDER = "ORDER BY sort_order, price_idr, id";

/**
 * Paket aktif sebuah layanan untuk halaman publik. Tanpa database (mis. build di CI) daftarnya kosong.
 * Saat build, database yang tidak bisa dihubungi juga dianggap kosong supaya build tetap jalan; saat
 * situs berjalan galatnya dilempar, jadi halaman ISR lama tetap tampil alih-alih daftar kosong.
 */
export async function activePackages(service) {
  if (!isDatabaseConfigured()) return [];
  try {
    await ensurePriceList();
    const rows = await query(`SELECT ${COLUMNS} FROM packages WHERE active = 1 AND service = ? ${ORDER}`, [service]);
    return rows.map(packageFromRow);
  } catch (error) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.warn(`[paket] database belum bisa dibaca saat build: ${error.code ?? error.message}`);
      return [];
    }
    throw error;
  }
}

/**
 * Harga mulai tiap layanan untuk kartu layanan di beranda ({ [service]: { price, unit } }, dari paket aktif di
 * /admin/paket). Tanpa database atau saat galat hasilnya kosong, jadi kartu tetap tampil tanpa harga.
 */
export async function servicePrices() {
  if (!isDatabaseConfigured()) return {};
  try {
    await ensurePriceList();
    return startingPrices((await query(`SELECT ${COLUMNS} FROM packages WHERE active = 1`)).map(packageFromRow));
  } catch (error) {
    console.error(`[paket] harga mulai tidak terbaca: ${error.code ?? error.message}`);
    return {};
  }
}

export async function allPackages() {
  return (await query(`SELECT ${COLUMNS} FROM packages ORDER BY service, sort_order, price_idr, id`)).map(packageFromRow);
}

export async function packageById(id, { activeOnly = false } = {}) {
  if (!Number.isSafeInteger(id) || id < 1) return null;
  const [row] = await query(`SELECT ${COLUMNS} FROM packages WHERE id = ?${activeOnly ? " AND active = 1" : ""}`, [id]);
  return row ? packageFromRow(row) : null;
}

/** Paket aktif untuk daftar id (keranjang dan checkout): { [id]: paket }. */
export async function packagesByIds(ids) {
  const clean = [...new Set(ids.map(Number).filter((id) => Number.isSafeInteger(id) && id > 0))].slice(0, 20);
  if (!clean.length) return {};
  const rows = await query(`SELECT ${COLUMNS} FROM packages WHERE active = 1 AND id IN (${clean.map(() => "?").join(", ")})`, clean);
  return Object.fromEntries(rows.map((row) => [Number(row.id), packageFromRow(row)]));
}

const values = (p) => [
  p.service,
  p.nameEn,
  p.nameId,
  p.summaryEn,
  p.summaryId,
  p.includesEn,
  p.includesId,
  p.price,
  p.unit,
  p.minGuests,
  p.maxGuests,
  p.active ? 1 : 0,
  p.sortOrder,
];

/** Simpan paket (hasil validatePackage); id null = paket baru. Mengembalikan id. */
export async function savePackage(id, pkg) {
  if (id) {
    const result = await query(
      "UPDATE packages SET service = ?, name_en = ?, name_id = ?, summary_en = ?, summary_id = ?, includes_en = ?, includes_id = ?, price_idr = ?, unit = ?, min_guests = ?, max_guests = ?, active = ?, sort_order = ? WHERE id = ?",
      [...values(pkg), id],
    );
    if (result.affectedRows === 0) throw new Error("Paket tidak ditemukan.");
    return id;
  }
  const result = await query(
    "INSERT INTO packages (service, name_en, name_id, summary_en, summary_id, includes_en, includes_id, price_idr, unit, min_guests, max_guests, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    values(pkg),
  );
  return Number(result.insertId);
}

/** Hapus paket. Pesanan lama tetap utuh karena menyimpan salinan nama dan harganya. */
export async function deletePackage(id) {
  const result = await query("DELETE FROM packages WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

/**
 * Tambahkan paket dari daftar harga (src/content/price-list.js, sudah lolos validatePackage) yang belum ada.
 * Paket yang sudah ada, termasuk yang harganya sudah diubah tim, tidak disentuh. { added, skipped }.
 */
export async function importPackages(list) {
  const missing = missingPackages(list, await allPackages());
  for (const pkg of missing) await savePackage(null, pkg);
  return { added: missing.length, skipped: list.length - missing.length };
}

const auto = (globalThis.__dragonetPriceList ??= { run: null });

/**
 * Daftar harga pemilik (src/content/price-list.js) dimasukkan sekali secara otomatis, tanpa menunggu tombol
 * di /admin/paket. Baris settings price_list_<version> menandainya (dan mencegah dua proses mengimpor
 * bersamaan), jadi paket yang sengaja dihapus tim tidak muncul lagi. Sekali per proses; bila gagal, dicoba
 * lagi pada pemanggilan berikutnya. Tidak berjalan saat build.
 */
export function ensurePriceList() {
  if (!isDatabaseConfigured() || process.env.NEXT_PHASE === "phase-production-build") return Promise.resolve(null);
  auto.run ??= (async () => {
    const name = `price_list_${PRICE_LIST.version}`;
    const claim = await query("INSERT IGNORE INTO settings (name, value) VALUES (?, ?)", [name, JSON.stringify({ state: "importing" })]);
    if (claim.affectedRows === 0) return null; // sudah dimasukkan (atau sedang dimasukkan proses lain)
    try {
      const slugs = services.map((s) => s.slug);
      const result = await importPackages(PRICE_LIST.packages.map((pkg) => validatePackage(pkg, slugs)));
      await query("UPDATE settings SET value = ? WHERE name = ?", [JSON.stringify({ state: "done", at: new Date().toISOString(), ...result }), name]);
      console.log(`[paket] daftar harga ${PRICE_LIST.version}: ${result.added} paket ditambahkan, ${result.skipped} sudah ada`);
      return result;
    } catch (error) {
      await query("DELETE FROM settings WHERE name = ?", [name]).catch(() => {});
      throw error;
    }
  })().catch((error) => {
    auto.run = null;
    console.error(`[paket] daftar harga belum bisa dimasukkan: ${error.code ?? error.message}`);
    return null;
  });
  return auto.run;
}
