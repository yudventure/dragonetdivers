import AdminGate from "@/admin/AdminGate";
import AdminShell, { Card, DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import AttendanceSheet from "@/admin/AttendanceSheet";
import { ExportLink } from "@/admin/parts";
import { ATTENDANCE } from "@/lib/modules/hr";
import { isDate, monthLabel, witDate } from "@/lib/records";
import { currentAdmin } from "@/server/admin-auth";
import { attendanceMonth } from "@/server/admin-data";
import { databaseStatus } from "@/server/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Absensi" };

// /admin/absensi: absensi harian pegawai aktif dan rekap bulan dari tanggal yang dipilih.
export default async function AttendancePage({ searchParams }) {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const raw = (await searchParams).tanggal;
  const date = isDate(raw) ? raw : witDate();
  const month = date.slice(0, 7);
  const database = await databaseStatus();
  const data = database.ok ? await attendanceMonth(month).catch((error) => console.error(`[admin/absensi] ${error.code ?? error.message}`)) : null;
  const saved = data ? Object.fromEntries(data.rows.filter((r) => r.date === date).map((r) => [r.employeeId, { status: r.status, timeIn: r.timeIn, timeOut: r.timeOut, note: r.note }])) : {};
  const active = data?.employees.filter((e) => e.active) ?? [];
  return (
    <AdminShell admin={admin} active="absensi">
      <ModuleTitle title="Absensi">
        Isi absensi setiap hari. Hadir dan alpa dipakai menghitung slip gaji: pegawai harian dibayar per hari hadir, pegawai lain dipotong per hari
        tanpa keterangan.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {data && (
        <>
          <AttendanceSheet key={date} date={date} employees={active.map(({ id, name, position }) => ({ id, name, position }))} saved={saved} />
          <Card title={`Rekap ${monthLabel(month)}`} action={<ExportLink query={{ type: "absensi", bulan: month }} />}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-xs tracking-[0.08em] text-slate uppercase">
                  <tr>
                    <th className="py-2 pr-4 text-left font-bold">Pegawai</th>
                    {ATTENDANCE.map(([k, label]) => (
                      <th key={k} className="px-2 py-2 text-right font-bold">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.employees
                    .filter((e) => e.active || data.recap[e.id])
                    .map((e) => (
                      <tr key={e.id} className="border-t border-mist">
                        <td className="py-2 pr-4 font-semibold text-abyss">{e.name}</td>
                        {ATTENDANCE.map(([k]) => (
                          <td key={k} className="px-2 py-2 text-right tabular-nums">
                            {data.recap[e.id]?.[k] ?? 0}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </AdminShell>
  );
}
