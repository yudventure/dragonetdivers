import "server-only";
import { query } from "./db";

// Pesanan di MySQL (tabel orders, database/migrations/003_orders.sql) dan isinya per paket (tabel
// order_items, migrasi 007). Kolom paket di orders adalah ringkasan; rincian ada di order.items.

const columns = (p = "") => `${p}id, ${p}code, ${p}token, ${p}package_id, ${p}service, ${p}package_name, ${p}unit, ${p}unit_price_idr, ${p}guests,
  ${p}amount_idr, ${p}amount_usd, ${p}usd_rate, ${p}method, ${p}status, ${p}provider_ref, ${p}payment_type, ${p}redirect_url, ${p}full_name,
  ${p}email, ${p}whatsapp, DATE_FORMAT(${p}dive_date, '%Y-%m-%d') AS dive_date, ${p}certification, ${p}notes, ${p}locale, ${p}due_at,
  ${p}paid_at, ${p}created_at`;
const COLUMNS = columns();
const ITEM_COLUMNS = `order_code, position, package_id, service, package_name, unit, unit_price_idr, guests,
  DATE_FORMAT(dive_date, '%Y-%m-%d') AS dive_date, amount_idr`;
// Satu baris per paket, dengan data pesanannya (kalender, buku kas).
const BOOKING_COLUMNS = `${columns("o.")}, i.position AS item_position, i.package_id AS item_package_id, i.service AS item_service,
  i.package_name AS item_name, i.unit AS item_unit, i.unit_price_idr AS item_price, i.guests AS item_guests,
  DATE_FORMAT(i.dive_date, '%Y-%m-%d') AS item_date, i.amount_idr AS item_amount`;

const iso = (value) => (value ? new Date(value).toISOString() : null);

export const orderFromRow = (row) => ({
  id: Number(row.id),
  code: row.code,
  token: row.token,
  packageId: row.package_id == null ? null : Number(row.package_id),
  service: row.service,
  packageName: row.package_name,
  unit: row.unit,
  unitPrice: Number(row.unit_price_idr),
  guests: Number(row.guests),
  amount: Number(row.amount_idr),
  amountUsd: row.amount_usd == null ? null : String(row.amount_usd),
  usdRate: row.usd_rate == null ? null : Number(row.usd_rate),
  method: row.method,
  status: row.status,
  providerRef: row.provider_ref,
  paymentType: row.payment_type,
  redirectUrl: row.redirect_url,
  name: row.full_name,
  email: row.email,
  whatsapp: row.whatsapp,
  date: row.dive_date,
  certification: row.certification,
  notes: row.notes,
  lang: row.locale === "id" ? "id" : "en",
  dueAt: iso(row.due_at),
  paidAt: iso(row.paid_at),
  createdAt: iso(row.created_at),
});

const itemFromRow = (row) => ({
  position: Number(row.position),
  packageId: row.package_id == null ? null : Number(row.package_id),
  service: row.service,
  packageName: row.package_name,
  unit: row.unit,
  unitPrice: Number(row.unit_price_idr),
  guests: Number(row.guests),
  date: row.dive_date,
  amount: Number(row.amount_idr),
});

/** Isi pesanan dari kolom ringkasannya, untuk pesanan yang (belum) punya baris di order_items. */
const itemsFromSummary = (order) => [
  { position: 0, packageId: order.packageId, service: order.service, packageName: order.packageName, unit: order.unit, unitPrice: order.unitPrice, guests: order.guests, date: order.date, amount: order.amount },
];

/** Pesanan beserta isinya per paket (order.items). */
async function withItems(orders) {
  if (!orders.length) return orders;
  const codes = orders.map((o) => o.code);
  const rows = await query(`SELECT ${ITEM_COLUMNS} FROM order_items WHERE order_code IN (${codes.map(() => "?").join(", ")}) ORDER BY order_code, position`, codes);
  const byCode = new Map();
  for (const row of rows) byCode.set(row.order_code, [...(byCode.get(row.order_code) ?? []), itemFromRow(row)]);
  return orders.map((o) => ({ ...o, items: byCode.get(o.code) ?? itemsFromSummary(o) }));
}

/** Satu paket dari sebuah pesanan sebagai "pesanan" sendiri (layanan, tamu, tanggal, dan jumlahnya sendiri). */
const bookingFromRow = (row) => ({
  ...orderFromRow(row),
  item: Number(row.item_position),
  packageId: row.item_package_id == null ? null : Number(row.item_package_id),
  service: row.item_service,
  packageName: row.item_name,
  unit: row.item_unit,
  unitPrice: Number(row.item_price),
  guests: Number(row.item_guests),
  date: row.item_date,
  amount: Number(row.item_amount),
});

/**
 * Simpan pesanan baru beserta isinya (o.items = [{ packageId, service, packageName, unit, unitPrice,
 * guests, date, amount }]). Bila isinya gagal tersimpan, pesanannya dihapus lagi.
 */
export async function createOrder(o) {
  await query(
    `INSERT INTO orders (code, token, package_id, service, package_name, unit, unit_price_idr, guests, amount_idr, amount_usd, usd_rate,
      method, status, full_name, email, whatsapp, dive_date, certification, notes, locale, due_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      o.code,
      o.token,
      o.packageId,
      o.service,
      o.packageName,
      o.unit,
      o.unitPrice,
      o.guests,
      o.amount,
      o.amountUsd,
      o.usdRate,
      o.method,
      o.name,
      o.email,
      o.whatsapp,
      o.date,
      o.certification,
      o.notes || null,
      o.lang,
      o.dueAt,
    ],
  );
  try {
    await query(
      `INSERT INTO order_items (order_code, position, package_id, service, package_name, unit, unit_price_idr, guests, dive_date, amount_idr)
       VALUES ${o.items.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ")}`,
      o.items.flatMap((it, position) => [o.code, position, it.packageId, it.service, it.packageName, it.unit, it.unitPrice, it.guests, it.date, it.amount]),
    );
  } catch (error) {
    await query("DELETE FROM orders WHERE code = ?", [o.code]).catch(() => {});
    throw error;
  }
  return orderByCode(o.code);
}

export async function orderByCode(code) {
  const [row] = await query(`SELECT ${COLUMNS} FROM orders WHERE code = ?`, [code]);
  return row ? (await withItems([orderFromRow(row)]))[0] : null;
}

/** Pesanan terbaru untuk /admin/pesanan, bisa disaring per status. */
export async function listOrders({ status } = {}) {
  const rows = status
    ? await query(`SELECT ${COLUMNS} FROM orders WHERE status = ? ORDER BY created_at DESC, id DESC LIMIT 200`, [status])
    : await query(`SELECT ${COLUMNS} FROM orders ORDER BY created_at DESC, id DESC LIMIT 200`);
  return withItems(rows.map(orderFromRow));
}

/**
 * Paket pesanan dengan tanggal di antara from dan to (YYYY-MM-DD), untuk kalender dan kapasitas harian:
 * satu baris per paket (pesanan berisi beberapa paket muncul di tanggal dan layanannya masing-masing).
 */
export async function ordersForDates(from, to) {
  const rows = await query(
    `SELECT ${BOOKING_COLUMNS} FROM order_items i JOIN orders o ON o.code = i.order_code
     WHERE i.dive_date BETWEEN ? AND ? ORDER BY i.dive_date, o.created_at, i.position`,
    [from, to],
  );
  return rows.map(bookingFromRow);
}

/** Paket pesanan lunas dengan waktu lunas di antara dua waktu (Date), untuk buku kas (per layanan). */
export async function paidOrdersBetween(start, end) {
  const rows = await query(
    `SELECT ${BOOKING_COLUMNS} FROM order_items i JOIN orders o ON o.code = i.order_code
     WHERE o.status = 'paid' AND o.paid_at >= ? AND o.paid_at < ? ORDER BY o.paid_at, i.position`,
    [start, end],
  );
  return rows.map(bookingFromRow);
}

/** Semua pesanan (terbatas), untuk daftar tamu. */
export async function allOrders(limit = 5000) {
  const rows = await query(`SELECT ${COLUMNS} FROM orders ORDER BY created_at DESC LIMIT ${Number(limit)}`);
  return rows.map(orderFromRow);
}

export async function orderCounts() {
  const rows = await query("SELECT status, COUNT(*) AS n, COALESCE(SUM(amount_idr), 0) AS amount FROM orders GROUP BY status");
  return Object.fromEntries(rows.map((r) => [r.status, { count: Number(r.n), amount: Number(r.amount) }]));
}

/** Data penyedia (link bayar, nomor transaksi) tanpa mengubah status. */
export async function setPaymentDetails(code, { redirectUrl, providerRef, paymentType }) {
  await query(
    "UPDATE orders SET redirect_url = COALESCE(?, redirect_url), provider_ref = COALESCE(?, provider_ref), payment_type = COALESCE(?, payment_type) WHERE code = ?",
    [redirectUrl ?? null, providerRef ?? null, paymentType ?? null, code],
  );
}

/**
 * Ubah status hanya bila status di database masih `from` (bandingkan-lalu-tulis), supaya notifikasi
 * yang datang berulang atau bersamaan tidak mengubah pesanan dua kali. true bila berubah.
 */
export async function changeStatus(code, from, to, { providerRef, paymentType } = {}) {
  const result = await query(
    `UPDATE orders SET status = ?, paid_at = ${to === "paid" ? "UTC_TIMESTAMP()" : "paid_at"},
       provider_ref = COALESCE(?, provider_ref), payment_type = COALESCE(?, payment_type)
     WHERE code = ? AND status = ?`,
    [to, providerRef ?? null, paymentType ?? null, code, from],
  );
  return result.affectedRows > 0;
}

/** Tutup pesanan menunggu yang lewat batas bayar (dipanggil saat /admin/pesanan dibuka). */
export async function expireOverdue() {
  await query("UPDATE orders SET status = 'expired' WHERE status = 'pending' AND due_at IS NOT NULL AND due_at < UTC_TIMESTAMP()");
}
