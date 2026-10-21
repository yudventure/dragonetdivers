import AdminGate from "@/admin/AdminGate";
import AdminShell, { Card, DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import { ExportLink, Stats } from "@/admin/parts";
import SettingsForm from "@/admin/SettingsForm";
import { yearReport } from "@/lib/modules/finance";
import { monthLabel, rupiah, witDate } from "@/lib/records";
import { currentAdmin } from "@/server/admin-auth";
import { financeRows, financeSettings } from "@/server/admin-data";
import { databaseStatus } from "@/server/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Laba rugi & pajak" };

function CategoryList({ title, rows, tone }) {
  return (
    <Card title={title}>
      {rows.length === 0 ? (
        <p className="text-sm text-slate">Belum ada.</p>
      ) : (
        <ul className="grid gap-1.5 text-sm">
          {rows.map((c) => (
            <li key={c.key} className="flex justify-between gap-3">
              <span className="text-abyss">{c.label}</span>
              <span className={`font-semibold tabular-nums ${tone}`}>{rupiah(c.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// /admin/laporan: laba rugi per bulan dalam setahun, total per kategori, dan rekap pajak dengan tarif
// yang bisa diatur (bawaan PPh final UMKM 0,5% dari pemasukan, seperti Zanclus).
export default async function ReportPage({ searchParams }) {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const raw = (await searchParams).tahun;
  const year = /^20\d{2}$/.test(raw ?? "") ? raw : witDate().slice(0, 4);
  const database = await databaseStatus();
  let report = null;
  if (database.ok) {
    try {
      const [rows, tax] = await Promise.all([financeRows(`${year}-01-01`, `${year}-12-31`), financeSettings()]);
      report = yearReport(rows, year, tax);
    } catch (error) {
      console.error(`[admin/laporan] ${error.code ?? error.message}`);
    }
  }
  const nav = (y) => `/admin/laporan?tahun=${y}`;
  return (
    <AdminShell admin={admin} active="laporan">
      <ModuleTitle title="Laba rugi & pajak">
        Ringkasan setahun dari buku kas dan pesanan website yang lunas. Pajak dihitung dari pemasukan dengan tarif di bawah. Pastikan tarifnya sesuai
        ketentuan pajak usahamu.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {report && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <a href={nav(Number(year) - 1)} aria-label="Tahun sebelumnya" className="grid size-10 place-items-center rounded-full bg-white text-lg font-bold ring-1 ring-mist hover:text-teal">
                ‹
              </a>
              <span className="min-w-[6rem] text-center font-display text-xl font-semibold text-abyss">Tahun {year}</span>
              <a href={nav(Number(year) + 1)} aria-label="Tahun berikutnya" className="grid size-10 place-items-center rounded-full bg-white text-lg font-bold ring-1 ring-mist hover:text-teal">
                ›
              </a>
            </div>
            <ExportLink query={{ type: "laporan", tahun: year }} />
          </div>
          <Stats
            items={[
              { label: "Pemasukan", value: rupiah(report.income), tone: "good" },
              { label: "Pengeluaran", value: rupiah(report.expense), tone: "bad" },
              { label: "Laba", value: rupiah(report.net), tone: report.net < 0 ? "bad" : undefined },
              { label: report.taxSettings.taxLabel, value: rupiah(report.tax), tone: "warn" },
            ]}
          />
          <div className="overflow-x-auto rounded-card bg-white ring-1 ring-mist">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-foam text-xs tracking-[0.08em] text-slate uppercase">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">Bulan</th>
                  <th className="px-4 py-3 text-right font-bold">Pemasukan</th>
                  <th className="px-4 py-3 text-right font-bold">Pengeluaran</th>
                  <th className="px-4 py-3 text-right font-bold">Laba</th>
                  <th className="px-4 py-3 text-right font-bold">Pajak</th>
                </tr>
              </thead>
              <tbody>
                {report.months.map((m) => (
                  <tr key={m.month} className="border-t border-mist">
                    <td className="px-4 py-2.5">
                      <a href={`/admin/kas?bulan=${m.month}`} className="font-semibold text-abyss hover:text-teal">
                        {monthLabel(m.month)}
                      </a>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{rupiah(m.income)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{rupiah(m.expense)}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${m.net < 0 ? "text-danger" : "text-abyss"}`}>{rupiah(m.net)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{rupiah(m.tax)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-abyss font-bold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right tabular-nums">{rupiah(report.income)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{rupiah(report.expense)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{rupiah(report.net)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{rupiah(report.tax)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <CategoryList title="Pemasukan per kategori" rows={report.incomeByCategory} tone="text-success" />
            <CategoryList title="Pengeluaran per kategori" rows={report.expenseByCategory} tone="text-danger" />
          </div>
          <Card title="Rekap pajak">
            <p className="text-sm text-slate">
              {report.taxSettings.taxLabel} dihitung {String(report.taxSettings.taxRate).replace(".", ",")}% dari pemasukan setiap bulan. Ubah bila ketentuan
              pajak usahamu berbeda.
            </p>
            <SettingsForm
              endpoint="/api/admin/finance"
              bodyKey="tax"
              initial={{ taxRate: String(report.taxSettings.taxRate).replace(".", ","), taxLabel: report.taxSettings.taxLabel }}
              fields={[
                { key: "taxRate", label: "Tarif pajak (% dari pemasukan)", type: "number" },
                { key: "taxLabel", label: "Nama pajak" },
              ]}
              submitLabel="Simpan pengaturan pajak"
            />
          </Card>
        </>
      )}
    </AdminShell>
  );
}
