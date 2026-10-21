import "server-only";
import { query } from "./db";

// Pesanan di MySQL (tabel orders, database/migrations/003_orders.sql).

const COLUMNS = `id, code, token, package_id, service, package_name, unit, unit_price_idr, guests, amount_idr, amount_usd, usd_rate,
  method, status, provider_ref, payment_type, redirect_url, full_name, email, whatsapp, DATE_FORMAT(dive_date, '%Y-%m-%d') AS dive_date,
  certification, notes, locale, due_at, paid_at, created_at`;

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
  return orderByCode(o.code);
}

export async function orderByCode(code) {
  const [row] = await query(`SELECT ${COLUMNS} FROM orders WHERE code = ?`, [code]);
  return row ? orderFromRow(row) : null;
}

/** Pesanan terbaru untuk /admin/pesanan, bisa disaring per status. */
export async function listOrders({ status } = {}) {
  const rows = status
    ? await query(`SELECT ${COLUMNS} FROM orders WHERE status = ? ORDER BY created_at DESC, id DESC LIMIT 200`, [status])
    : await query(`SELECT ${COLUMNS} FROM orders ORDER BY created_at DESC, id DESC LIMIT 200`);
  return rows.map(orderFromRow);
}

/** Pesanan dengan tanggal menyelam di antara from dan to (YYYY-MM-DD), untuk kalender dan tamu. */
export async function ordersForDates(from, to) {
  const rows = await query(`SELECT ${COLUMNS} FROM orders WHERE dive_date BETWEEN ? AND ? ORDER BY dive_date, created_at`, [from, to]);
  return rows.map(orderFromRow);
}

/** Pesanan lunas dengan waktu lunas di antara dua waktu (Date), untuk buku kas. */
export async function paidOrdersBetween(start, end) {
  const rows = await query(`SELECT ${COLUMNS} FROM orders WHERE status = 'paid' AND paid_at >= ? AND paid_at < ? ORDER BY paid_at`, [start, end]);
  return rows.map(orderFromRow);
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
