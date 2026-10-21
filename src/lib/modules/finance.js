// Keuangan (mengikuti Zanclus finance-model): buku kas pemasukan/pengeluaran, pesanan website yang lunas
// otomatis jadi pemasukan, dan laporan laba rugi per tahun dengan rekap pajak.
import { RecordError } from "../records.js";

export const INCOME_CATEGORIES = [
  ["fun-dives", "Fun dive"],
  ["dive-courses", "Kursus selam"],
  ["snorkeling", "Snorkeling"],
  ["island-trips", "Trip pulau"],
  ["dusk-dives", "Dusk dive"],
  ["rental", "Sewa alat"],
  ["other", "Lainnya"],
];
export const EXPENSE_CATEGORIES = [
  ["gaji", "Gaji & honor"],
  ["operasional", "Operasional: BBM, perahu, tabung"],
  ["perlengkapan", "Perlengkapan & suku cadang"],
  ["sewa", "Sewa, listrik, internet"],
  ["pemasaran", "Pemasaran"],
  ["konsumsi", "Konsumsi"],
  ["pajak", "Pajak & retribusi"],
  ["refund", "Refund tamu"],
  ["lainnya", "Lainnya"],
];
export const FLOWS = [
  ["in", "Pemasukan"],
  ["out", "Pengeluaran"],
];
export const PAY_METHODS = [
  ["tunai", "Tunai"],
  ["transfer", "Transfer bank"],
  ["qris", "QRIS"],
  ["midtrans", "Midtrans"],
  ["paypal", "PayPal"],
  ["lainnya", "Lainnya"],
];

export const categoriesOf = (flow) => (flow === "out" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES);
export const categoryLabel = (flow, key) => categoriesOf(flow).find(([k]) => k === key)?.[1] ?? key;

export const transaction = {
  kind: "transaction",
  prefix: "trx",
  noun: "transaksi",
  dateField: "date",
  fields: [
    { key: "date", label: "Tanggal", type: "date", required: true, list: true },
    { key: "description", label: "Keterangan", type: "text", required: true, max: 120, list: true },
    { key: "flow", label: "Jenis", type: "select", required: true, options: FLOWS, default: "out" },
    {
      key: "category",
      label: "Kategori",
      type: "select",
      required: true,
      options: [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES],
      optionsBy: { field: "flow", map: { in: INCOME_CATEGORIES, out: EXPENSE_CATEGORIES } },
      list: true,
    },
    { key: "method", label: "Cara bayar", type: "select", options: PAY_METHODS, default: "tunai", list: true },
    { key: "amount", label: "Jumlah (Rp)", short: "Jumlah", type: "money", required: true, min: 1, list: true },
    { key: "reference", label: "Referensi", type: "text", max: 60, hint: "Nomor nota, kode pesanan, dll." },
    { key: "note", label: "Catatan", type: "textarea", max: 300, wide: true },
  ],
  check(r) {
    if (!categoriesOf(r.flow).some(([key]) => key === r.category)) {
      throw new RecordError(`Kategori ini untuk ${r.flow === "out" ? "pemasukan" : "pengeluaran"}. Pilih kategori ${r.flow === "out" ? "pengeluaran" : "pemasukan"}.`, "category");
    }
  },
};

export const DEFAULT_TAX = { taxRate: 0.5, taxLabel: "PPh final UMKM 0,5%" };

export function validateTax(input) {
  const rate = Number(String(input?.taxRate ?? "").replace(",", "."));
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw new RecordError("Tarif pajak berupa persen 0 sampai 100.", "taxRate");
  const label = String(input?.taxLabel ?? "").trim();
  if (!label || label.length > 60) throw new RecordError("Nama pajak wajib diisi, maksimal 60 karakter.", "taxLabel");
  return { taxRate: Math.round(rate * 100) / 100, taxLabel: label };
}

/**
 * Pesanan website lunas sebagai baris pemasukan otomatis (tidak disimpan, tidak bisa diubah).
 * Tanggalnya tanggal lunas di WIT, kategorinya layanan pesanan.
 */
export function orderIncome(orders) {
  return orders
    .filter((o) => o.status === "paid" && o.paidAt)
    .map((o) => ({
      id: o.item ? `auto:${o.code}:${o.item}` : `auto:${o.code}`, // satu baris per paket pesanan
      auto: true,
      date: new Date(new Date(o.paidAt).getTime() + 9 * 3600_000).toISOString().slice(0, 10),
      description: `Pesanan website ${o.code} · ${o.name}`,
      flow: "in",
      category: INCOME_CATEGORIES.some(([k]) => k === o.service) ? o.service : "other",
      method: o.method === "transfer" ? "transfer" : o.method,
      amount: o.amount,
      reference: o.code,
      note: o.packageName,
    }));
}

/** Total pemasukan, pengeluaran, dan bersih dari daftar transaksi. */
export function totals(rows) {
  const income = rows.filter((r) => r.flow === "in").reduce((s, r) => s + r.amount, 0);
  const expense = rows.filter((r) => r.flow === "out").reduce((s, r) => s + r.amount, 0);
  return { income, expense, net: income - expense };
}

/** Laporan satu tahun: 12 bulan (pemasukan, pengeluaran, laba, pajak), total, dan total per kategori. */
export function yearReport(rows, year, tax = DEFAULT_TAX) {
  const inYear = rows.filter((r) => r.date?.startsWith(`${year}-`));
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = `${year}-${String(i + 1).padStart(2, "0")}`;
    const t = totals(inYear.filter((r) => r.date.startsWith(month)));
    return { month, ...t, tax: Math.round((t.income * tax.taxRate) / 100) };
  });
  const byCategory = (flow) =>
    categoriesOf(flow)
      .map(([key, label]) => ({ key, label, amount: inYear.filter((r) => r.flow === flow && r.category === key).reduce((s, r) => s + r.amount, 0) }))
      .filter((c) => c.amount);
  const all = totals(inYear);
  return { year, months, ...all, incomeByCategory: byCategory("in"), expenseByCategory: byCategory("out"), tax: Math.round((all.income * tax.taxRate) / 100), taxSettings: tax };
}
