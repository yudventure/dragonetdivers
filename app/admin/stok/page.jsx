import AdminGate from "@/admin/AdminGate";
import AdminShell, { DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import { ExportLink, Stats } from "@/admin/parts";
import StockTable from "@/admin/StockTable";
import { rupiah } from "@/lib/records";
import { currentAdmin } from "@/server/admin-auth";
import { refOptions, stockList } from "@/server/admin-data";
import { databaseStatus } from "@/server/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Barang & stok" };

// /admin/stok: daftar barang gudang dengan stok terkini, batas minimum, dan nilai persediaan.
export default async function StockPage() {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const database = await databaseStatus();
  const items = database.ok ? await stockList().catch((error) => console.error(`[admin/stok] ${error.code ?? error.message}`)) : null;
  const active = items?.filter((it) => it.active) ?? [];
  const empty = active.filter((it) => it.status.key === "empty");
  const low = active.filter((it) => it.status.key === "low");
  return (
    <AdminShell admin={admin} active="stok">
      <ModuleTitle title="Barang & stok">
        Alat selam, tabung, suku cadang, dan bahan habis pakai. Stok dihitung dari catatan barang masuk dan keluar. Barang yang menyentuh stok minimum
        ditandai Menipis.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {items && (
        <>
          <Stats
            items={[
              { label: "Barang aktif", value: active.length },
              { label: "Habis", value: empty.length, tone: empty.length ? "bad" : undefined },
              { label: "Menipis", value: low.length, tone: low.length ? "warn" : undefined, hint: low.slice(0, 3).map((it) => it.name).join(", ") || undefined },
              { label: "Nilai persediaan", value: rupiah(active.reduce((s, it) => s + Math.max(0, it.value), 0)) },
            ]}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <a href="/admin/mutasi" className="inline-flex h-10 items-center px-2 text-sm font-semibold text-teal hover:underline">
              Lihat catatan keluar masuk →
            </a>
            <ExportLink query={{ type: "stok" }} />
          </div>
          <StockTable items={items} itemOptions={refOptions(items)} />
        </>
      )}
    </AdminShell>
  );
}
