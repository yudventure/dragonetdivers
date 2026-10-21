import AdminGate from "@/admin/AdminGate";
import AdminShell, { DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import { ExportLink, monthParam, MonthNav } from "@/admin/parts";
import RecordManager from "@/admin/RecordManager";
import { monthRange, witDate } from "@/lib/records";
import { currentAdmin } from "@/server/admin-auth";
import { refOptions } from "@/server/admin-data";
import { databaseStatus } from "@/server/db";
import { listRecords } from "@/server/records";

export const dynamic = "force-dynamic";
export const metadata = { title: "Keluar masuk barang" };

// /admin/mutasi: catatan barang masuk, keluar, dan koreksi stok per bulan.
export default async function MovementsPage({ searchParams }) {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const month = monthParam((await searchParams).bulan);
  const { from, to } = monthRange(month);
  const database = await databaseStatus();
  let data = null;
  if (database.ok) {
    try {
      const [items, moves] = await Promise.all([listRecords("item"), listRecords("movement", { from, to })]);
      data = { items: refOptions(items), moves };
    } catch (error) {
      console.error(`[admin/mutasi] ${error.code ?? error.message}`);
    }
  }
  const today = witDate();
  return (
    <AdminShell admin={admin} active="mutasi">
      <ModuleTitle title="Keluar masuk barang">
        Catat barang yang dibeli, dipakai, disewakan, rusak, atau dihitung ulang (stock opname). Stok di Barang & stok mengikuti catatan ini.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {data && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MonthNav month={month} path="/admin/mutasi" />
            <ExportLink query={{ type: "mutasi", bulan: month }} />
          </div>
          {data.items.length === 0 ? (
            <p className="rounded-card bg-white p-5 text-sm text-slate ring-1 ring-mist">
              Tambahkan barang dulu di{" "}
              <a href="/admin/stok" className="font-semibold text-teal hover:underline">
                Barang & stok
              </a>
              .
            </p>
          ) : (
            <RecordManager
              kind="movement"
              records={data.moves}
              refs={{ itemId: data.items }}
              defaults={{ date: today.startsWith(month) ? today : from }}
              addLabel="Catat barang masuk / keluar"
              empty="Belum ada catatan bulan ini."
            />
          )}
        </>
      )}
    </AdminShell>
  );
}
