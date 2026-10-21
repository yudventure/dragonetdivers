import AdminGate from "@/admin/AdminGate";
import AdminShell, { DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import { ExportLink, monthParam, MonthNav } from "@/admin/parts";
import PayrollTable from "@/admin/PayrollTable";
import { currentAdmin } from "@/server/admin-auth";
import { payrollMonth } from "@/server/admin-data";
import { databaseStatus } from "@/server/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Slip gaji" };

// /admin/gaji: slip gaji bulanan dari data pegawai dan absensi. Kunci slip setelah gaji dibayar, lalu
// catat pengeluarannya di Buku kas (kategori Gaji & honor).
export default async function PayrollPage({ searchParams }) {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const month = monthParam((await searchParams).bulan);
  const database = await databaseStatus();
  const slips = database.ok ? await payrollMonth(month).catch((error) => console.error(`[admin/gaji] ${error.code ?? error.message}`)) : null;
  return (
    <AdminShell admin={admin} active="gaji">
      <ModuleTitle title="Slip gaji">
        Dihitung dari gaji di data pegawai dan absensi bulan itu. Kunci slip setelah gaji dibayar supaya angkanya tidak berubah, lalu catat
        pengeluarannya di Buku kas dengan kategori Gaji & honor.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {slips && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MonthNav month={month} path="/admin/gaji" />
            <ExportLink query={{ type: "gaji", bulan: month }} />
          </div>
          <PayrollTable month={month} slips={slips} />
        </>
      )}
    </AdminShell>
  );
}
