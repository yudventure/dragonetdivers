import { reservation } from "@/lib/modules/calendar";
import { categoryLabel, PAY_METHODS, yearReport } from "@/lib/modules/finance";
import { ATTENDANCE, EMPLOYMENT } from "@/lib/modules/hr";
import { ITEM_CATEGORIES, movement, REASONS } from "@/lib/modules/inventory";
import { METRICS, partner, post } from "@/lib/modules/pr";
import { isMonth, monthLabel, monthRange, optionLabel } from "@/lib/records";
import { workbook } from "@/lib/xlsx";
import { currentAdmin } from "@/server/admin-auth";
import { attendanceMonth, calendarMonth, financeRows, financeSettings, guestList, payrollMonth, refOptions, stockList } from "@/server/admin-data";
import { listRecords } from "@/server/records";

export const dynamic = "force-dynamic";

// Unduh Excel untuk modul admin: /api/admin/export?type=kas&bulan=2026-10 (lihat TYPES di bawah).
const field = (schema, key) => schema.fields.find((f) => f.key === key);
const label = (options, key) => options.find(([k]) => k === key)?.[1] ?? key ?? "";
const yesNo = (v) => (v ? "Ya" : "Tidak");

const file = (name, sheets) =>
  new Response(workbook(sheets), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="dragonet-${name}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });

const TYPES = {
  async reservasi({ month }) {
    const { orders, reservations, partners } = await calendarMonth(month);
    const names = Object.fromEntries(refOptions(partners));
    const f = (key, value) => optionLabel(field(reservation, key), value);
    return [
      {
        name: "Reservasi tim",
        widths: [12, 12, 24, 16, 8, 20, 14, 16, 14, 14, 18, 30],
        rows: [
          ["Mulai", "Selesai", "Tamu", "Layanan", "Orang", "Status", "Nilai", "Pembayaran", "Sumber", "Mitra", "WhatsApp", "Catatan"],
          ...reservations.map((r) => [r.startDate, r.endDate || r.startDate, r.guestName, f("service", r.service), r.participants || 1, f("status", r.status), r.amount ?? 0, f("payStatus", r.payStatus), f("source", r.source), names[r.partnerId] ?? "", r.phone, r.notes]),
        ],
      },
      {
        name: "Pesanan website",
        widths: [12, 18, 24, 26, 8, 14, 14, 18],
        rows: [["Tanggal", "Kode", "Tamu", "Paket", "Orang", "Total", "Status", "WhatsApp"], ...orders.map((o) => [o.date, o.code, o.name, o.packageName, o.guests, o.amount, o.status, `+${o.whatsapp}`])],
      },
    ];
  },
  async tamu() {
    const guests = await guestList();
    return [
      {
        name: "Tamu",
        widths: [26, 18, 28, 10, 12, 12, 14, 20],
        rows: [["Nama", "WhatsApp", "Email", "Reservasi", "Terakhir", "Berikutnya", "Nilai lunas", "Sumber"], ...guests.map((g) => [g.name, g.phone, g.email, g.bookings, g.last, g.next, g.paid, g.sources])],
      },
    ];
  },
  async kas({ month }) {
    const { from, to } = monthRange(month);
    const rows = await financeRows(from, to);
    return [
      {
        name: "Buku kas",
        widths: [12, 40, 26, 14, 14, 14, 16],
        rows: [
          ["Tanggal", "Keterangan", "Kategori", "Cara bayar", "Masuk", "Keluar", "Referensi"],
          ...[...rows].reverse().map((r) => [r.date, r.description, categoryLabel(r.flow, r.category), label(PAY_METHODS, r.method), r.flow === "in" ? r.amount : "", r.flow === "out" ? r.amount : "", r.reference ?? ""]),
        ],
      },
    ];
  },
  async laporan({ year }) {
    const [rows, tax] = await Promise.all([financeRows(`${year}-01-01`, `${year}-12-31`), financeSettings()]);
    const r = yearReport(rows, year, tax);
    return [
      {
        name: "Laba rugi",
        widths: [30, 16, 16, 16, 16],
        rows: [
          ["Bulan", "Pemasukan", "Pengeluaran", "Laba", "Pajak"],
          ...r.months.map((m) => [monthLabel(m.month), m.income, m.expense, m.net, m.tax]),
          ["Total", r.income, r.expense, r.net, r.tax],
          [],
          ["Pemasukan per kategori"],
          ...r.incomeByCategory.map((c) => [c.label, c.amount]),
          [],
          ["Pengeluaran per kategori"],
          ...r.expenseByCategory.map((c) => [c.label, c.amount]),
          [],
          [tax.taxLabel, r.tax],
        ],
      },
    ];
  },
  async stok() {
    const items = await stockList();
    return [
      {
        name: "Stok",
        widths: [28, 14, 22, 10, 10, 10, 14, 14, 18],
        rows: [["Barang", "Kode", "Kategori", "Stok", "Satuan", "Minimum", "Status", "Nilai", "Lokasi"], ...items.map((i) => [i.name, i.sku, label(ITEM_CATEGORIES, i.category), i.stock, i.unit, i.minStock ?? 0, i.status.label, i.value, i.location])],
      },
    ];
  },
  async mutasi({ month }) {
    const { from, to } = monthRange(month);
    const [items, moves] = await Promise.all([listRecords("item"), listRecords("movement", { from, to })]);
    const names = Object.fromEntries(refOptions(items));
    const reasons = [...REASONS.in, ...REASONS.out, ...REASONS.adjust];
    return [
      {
        name: "Mutasi",
        widths: [12, 28, 14, 10, 24, 30],
        rows: [["Tanggal", "Barang", "Jenis", "Jumlah", "Alasan", "Catatan"], ...moves.map((m) => [m.date, names[m.itemId] ?? "", optionLabel(field(movement, "flow"), m.flow), m.qty, label(reasons, m.reason), m.note])],
      },
    ];
  },
  async pegawai() {
    const employees = await listRecords("employee");
    return [
      {
        name: "Pegawai",
        widths: [24, 18, 16, 12, 12, 18, 24, 14, 14, 10, 10, 18, 20],
        rows: [
          ["Nama", "Jabatan", "Status kerja", "Mulai", "Kontrak berakhir", "WhatsApp", "Email", "Gaji pokok", "Upah harian", "BPJS Kes", "BPJS TK", "Bank", "Rekening", "Aktif"],
          ...employees.map((e) => [e.name, e.position, label(EMPLOYMENT, e.type), e.joinDate, e.contractEnd, e.phone, e.email, e.base ?? 0, e.dailyRate ?? 0, yesNo(e.bpjsKesehatan), yesNo(e.bpjsKetenagakerjaan), e.bankName, e.bankAccount, yesNo(e.active)]),
        ],
      },
    ];
  },
  async absensi({ month }) {
    const { employees, rows, recap } = await attendanceMonth(month);
    const names = Object.fromEntries(employees.map((e) => [e.id, e.name]));
    return [
      { name: "Rekap", widths: [24, ...ATTENDANCE.map(() => 12)], rows: [["Pegawai", ...ATTENDANCE.map(([, l]) => l)], ...employees.filter((e) => recap[e.id]).map((e) => [e.name, ...ATTENDANCE.map(([k]) => recap[e.id][k])])] },
      {
        name: "Harian",
        widths: [12, 24, 16, 10, 10, 30],
        rows: [["Tanggal", "Pegawai", "Status", "Masuk", "Pulang", "Catatan"], ...[...rows].reverse().map((r) => [r.date, names[r.employeeId] ?? "", label(ATTENDANCE, r.status), r.timeIn, r.timeOut, r.note])],
      },
    ];
  },
  async gaji({ month }) {
    const slips = await payrollMonth(month);
    return [
      {
        name: "Gaji",
        widths: [24, 18, 8, 8, 14, 14, 14, 14, 12],
        rows: [["Nama", "Jabatan", "Hadir", "Alpa", "Gaji pokok", "Tunjangan", "Potongan", "Bersih", "Status"], ...slips.map((s) => [s.name, s.position, s.hadir, s.alpa, s.basePay, s.allowance, s.deduction, s.net, s.lockedAt ? "Terkunci" : "Draf"])],
      },
    ];
  },
  async konten({ month }) {
    const { from, to } = monthRange(month);
    const posts = (await listRecords("post", { from, to })).reverse();
    const f = (key, value) => optionLabel(field(post, key), value);
    return [
      {
        name: "Konten",
        widths: [12, 8, 30, 12, 14, 12, 16, 30, ...METRICS.map(() => 11)],
        rows: [
          ["Tanggal", "Jam", "Judul", "Platform", "Format", "Status", "Penanggung jawab", "Tautan", ...METRICS.map(([, l]) => l)],
          ...posts.map((p) => [p.date, p.time, p.title, f("platform", p.platform), f("format", p.format), f("status", p.status), p.pic, p.link, ...METRICS.map(([k]) => p[k] ?? "")]),
        ],
      },
    ];
  },
  async mitra() {
    const partners = await listRecords("partner");
    const f = (key, value) => optionLabel(field(partner, key), value);
    return [
      {
        name: "Mitra",
        widths: [26, 24, 12, 20, 18, 24, 30, 10, 14, 30],
        rows: [
          ["Nama", "Jenis", "Status", "Kontak", "WhatsApp", "Email", "Situs", "Komisi %", "Terakhir dihubungi", "Catatan"],
          ...partners.map((p) => [p.name, f("type", p.type), f("status", p.status), p.contactName, p.phone, p.email, p.website, p.commission ?? "", p.lastContact, p.notes]),
        ],
      },
    ];
  },
};

export async function GET(request) {
  if (!(await currentAdmin())) return Response.json({ error: "Masuk dulu di /admin." }, { status: 401 });
  const params = new URL(request.url).searchParams;
  const type = params.get("type");
  const month = params.get("bulan") ?? "";
  const year = params.get("tahun") ?? "";
  if (!TYPES[type]) return Response.json({ error: "Jenis unduhan tidak dikenal." }, { status: 400 });
  if (["reservasi", "kas", "mutasi", "absensi", "gaji", "konten"].includes(type) && !isMonth(month)) return Response.json({ error: "Bulan tidak valid." }, { status: 400 });
  if (type === "laporan" && !/^20\d{2}$/.test(year)) return Response.json({ error: "Tahun tidak valid." }, { status: 400 });
  try {
    const sheets = await TYPES[type]({ month, year });
    return file(`${type}${month ? `-${month}` : year ? `-${year}` : ""}`, sheets);
  } catch (error) {
    console.error(`[admin/export] ${type}: ${error.code ?? error.message}`);
    return Response.json({ error: "Database belum bisa diakses. Coba lagi sebentar." }, { status: 503 });
  }
}
