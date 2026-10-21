// Gudang (mengikuti Zanclus inventory-model): daftar barang dan catatan barang masuk/keluar. Stok =
// jumlah semua gerakan (masuk +, keluar −, koreksi ±). Barang menipis bila stok ≤ stok minimum.
import { RecordError } from "../records.js";

export const ITEM_CATEGORIES = [
  ["alat", "Alat selam"],
  ["tabung", "Tabung & kompresor"],
  ["sparepart", "Suku cadang"],
  ["consumable", "Bahan habis pakai"],
  ["perahu", "Perahu & mesin"],
  ["merch", "Merchandise"],
  ["lainnya", "Lainnya"],
];
export const UNITS = ["pcs", "set", "pasang", "botol", "liter", "kg", "lusin"];

export const item = {
  kind: "item",
  prefix: "brg",
  noun: "barang",
  fields: [
    { key: "name", label: "Nama barang", short: "Barang", type: "text", required: true, max: 80, list: true },
    { key: "sku", label: "Kode barang", type: "text", max: 30, hint: "Opsional, mis. BCD-M-01" },
    { key: "category", label: "Kategori", type: "select", required: true, options: ITEM_CATEGORIES, default: "alat", list: true },
    { key: "unit", label: "Satuan", type: "text", max: 12, default: "pcs", hint: UNITS.join(", ") },
    { key: "minStock", label: "Stok minimum", short: "Minimum", type: "number", min: 0, max: 1e6, default: 0, list: true },
    { key: "cost", label: "Harga beli per satuan (Rp)", type: "money" },
    { key: "location", label: "Lokasi simpan", type: "text", max: 60 },
    { key: "active", label: "Aktif", type: "boolean", default: true, checkLabel: "Barang masih dipakai" },
    { key: "note", label: "Catatan", type: "textarea", max: 300, wide: true },
  ],
  usedBy: [{ kind: "movement", key: "itemId", noun: "catatan keluar masuk" }],
  check(r) {
    if (r.sku && !/^[A-Za-z0-9-]+$/.test(r.sku)) throw new RecordError("Kode barang hanya huruf, angka, dan tanda hubung.", "sku");
    r.sku = r.sku.toUpperCase();
    r.unit ||= "pcs";
    r.minStock ??= 0;
  },
};

export const MOVE_FLOWS = [
  ["in", "Masuk"],
  ["out", "Keluar"],
  ["adjust", "Koreksi stok"],
];
export const REASONS = {
  in: [
    ["beli", "Pembelian"],
    ["kembali", "Kembali dari sewa atau perbaikan"],
    ["lainnya", "Lainnya"],
  ],
  out: [
    ["pakai", "Dipakai operasional"],
    ["jual", "Penjualan"],
    ["sewa", "Sewa keluar"],
    ["rusak", "Rusak atau hilang"],
    ["lainnya", "Lainnya"],
  ],
  adjust: [
    ["opname", "Stock opname"],
    ["koreksi", "Koreksi data"],
  ],
};

export const movement = {
  kind: "movement",
  prefix: "mts",
  noun: "catatan keluar masuk",
  dateField: "date",
  fields: [
    { key: "date", label: "Tanggal", type: "date", required: true, list: true },
    { key: "itemId", label: "Barang", type: "ref", refKind: "item", required: true, list: true },
    { key: "flow", label: "Jenis", type: "select", required: true, options: MOVE_FLOWS, default: "in", list: true },
    { key: "qty", label: "Jumlah", type: "number", required: true, min: -1e6, max: 1e6, list: true, hint: "Koreksi stok boleh minus, mis. -2." },
    { key: "reason", label: "Alasan", type: "select", required: true, options: [...REASONS.in, ...REASONS.out.filter(([k]) => k !== "lainnya"), ...REASONS.adjust], optionsBy: { field: "flow", map: REASONS }, list: true },
    { key: "note", label: "Catatan", type: "textarea", max: 300, wide: true, list: true },
  ],
  check(r) {
    if (r.qty === 0) throw new RecordError("Jumlah tidak boleh nol.", "qty");
    if (r.flow !== "adjust" && r.qty < 0) throw new RecordError("Jumlah masuk atau keluar ditulis positif. Pakai Koreksi stok untuk angka minus.", "qty");
    if (!REASONS[r.flow].some(([key]) => key === r.reason)) throw new RecordError("Pilih alasan yang sesuai jenisnya.", "reason");
  },
};

/** Perubahan stok dari satu gerakan: masuk +, keluar −, koreksi apa adanya. */
export const delta = (m) => (m.flow === "out" ? -m.qty : m.qty);

/** Stok per barang: { itemId: jumlah }. */
export function stockLevels(movements) {
  const levels = {};
  for (const m of movements) levels[m.itemId] = (levels[m.itemId] ?? 0) + delta(m);
  return levels;
}

/** Status stok: Nonaktif, Habis, Menipis, atau Cukup. */
export function stockStatus(it, stock) {
  if (!it.active) return { key: "inactive", label: "Nonaktif" };
  if (stock <= 0) return { key: "empty", label: "Habis" };
  if (stock <= (it.minStock ?? 0)) return { key: "low", label: "Menipis" };
  return { key: "ok", label: "Cukup" };
}
