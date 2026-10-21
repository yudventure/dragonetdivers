import AdminGate from "@/admin/AdminGate";
import AdminShell, { Card, DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import { ExportLink, monthParam, MonthNav, SectionTitle, Stats } from "@/admin/parts";
import RecordManager from "@/admin/RecordManager";
import { categoryLabel, totals } from "@/lib/modules/finance";
import { monthRange, rupiah, shortDay, witDate } from "@/lib/records";
import { currentAdmin } from "@/server/admin-auth";
import { financeRows } from "@/server/admin-data";
import { databaseStatus } from "@/server/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Buku kas" };

// /admin/kas: buku kas bulanan (mengikuti Zanclus). Pemasukan dan pengeluaran dicatat tim; pesanan
// website yang lunas masuk otomatis sebagai pemasukan dan tidak perlu dicatat lagi.
export default async function CashbookPage({ searchParams }) {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const month = monthParam((await searchParams).bulan);
  const { from, to } = monthRange(month);
  const database = await databaseStatus();
  const rows = database.ok ? await financeRows(from, to).catch((error) => console.error(`[admin/kas] ${error.code ?? error.message}`)) : null;
  const sum = rows ? totals(rows) : null;
  const manual = rows?.filter((r) => !r.auto) ?? [];
  const auto = rows?.filter((r) => r.auto) ?? [];
  const today = witDate();
  return (
    <AdminShell admin={admin} active="kas">
      <ModuleTitle title="Buku kas">
        Catat setiap uang masuk dan keluar. Pesanan website yang sudah lunas masuk otomatis sebagai pemasukan, jadi tidak perlu dicatat lagi. Gaji
        dicatat di sini dengan kategori Gaji & honor setelah dibayar.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {rows && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MonthNav month={month} path="/admin/kas" />
            <ExportLink query={{ type: "kas", bulan: month }} />
          </div>
          <Stats
            items={[
              { label: "Pemasukan", value: rupiah(sum.income), tone: "good" },
              { label: "Pengeluaran", value: rupiah(sum.expense), tone: "bad" },
              { label: "Bersih", value: rupiah(sum.net), tone: sum.net < 0 ? "bad" : undefined },
              { label: "Pesanan website lunas", value: auto.length, hint: rupiah(totals(auto).income) },
            ]}
          />
          <RecordManager
            kind="transaction"
            records={manual}
            defaults={{ date: today.startsWith(month) ? today : from }}
            addLabel="Catat transaksi"
            columns={["date", "description", "flow", "category", "method", "amount"]}
            empty="Belum ada transaksi yang dicatat bulan ini."
          />
          {auto.length > 0 && (
            <Card title="Pesanan website lunas (otomatis)">
              <ul className="grid gap-2 text-sm">
                {auto.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-mist pt-2 first:border-0 first:pt-0">
                    <span>
                      <span className="mr-2 rounded-full bg-teal-wash px-2 py-0.5 text-[10px] font-bold tracking-wide text-teal uppercase">Otomatis</span>
                      <span className="font-semibold text-abyss">{r.description}</span>
                      <span className="block text-slate">
                        {shortDay(r.date)} · {categoryLabel("in", r.category)} · {r.note}
                      </span>
                    </span>
                    <span className="font-semibold text-success tabular-nums">{rupiah(r.amount)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <SectionTitle>
            <a href="/admin/laporan" className="text-base font-semibold text-teal hover:underline">
              Lihat laba rugi & pajak tahun {month.slice(0, 4)} →
            </a>
          </SectionTitle>
        </>
      )}
    </AdminShell>
  );
}
