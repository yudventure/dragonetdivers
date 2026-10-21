import AdminGate from "@/admin/AdminGate";
import AdminShell, { DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import { ExportLink, Stats } from "@/admin/parts";
import RecordManager from "@/admin/RecordManager";
import { witDate } from "@/lib/records";
import { currentAdmin } from "@/server/admin-auth";
import { databaseStatus } from "@/server/db";
import { listRecords } from "@/server/records";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pegawai" };

const addDays = (date, days) => new Date(new Date(`${date}T00:00:00Z`).getTime() + days * 86_400_000).toISOString().slice(0, 10);

// /admin/pegawai: data pegawai (jabatan, status kerja, gaji, BPJS, rekening, sertifikasi selam).
export default async function EmployeesPage() {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const database = await databaseStatus();
  const employees = database.ok ? await listRecords("employee").catch((error) => console.error(`[admin/pegawai] ${error.code ?? error.message}`)) : null;
  const today = witDate();
  const active = employees?.filter((e) => e.active) ?? [];
  const ending = active.filter((e) => e.contractEnd && e.contractEnd >= today && e.contractEnd <= addDays(today, 30));
  return (
    <AdminShell admin={admin} active="pegawai">
      <ModuleTitle title="Pegawai">
        Data tim Dragonet: jabatan, status kerja, gaji, BPJS, rekening, dan sertifikasi selam. Gaji dan potongan di sini dipakai untuk menghitung slip
        gaji.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {employees && (
        <>
          <Stats
            items={[
              { label: "Pegawai aktif", value: active.length },
              { label: "Harian lepas", value: active.filter((e) => e.type === "harian").length },
              { label: "Kontrak habis 30 hari", value: ending.length, tone: ending.length ? "warn" : undefined, hint: ending.map((e) => e.name).join(", ") || undefined },
              { label: "Belum BPJS Kesehatan", value: active.filter((e) => !e.bpjsKesehatan).length },
            ]}
          />
          <div className="flex justify-end">
            <ExportLink query={{ type: "pegawai" }} />
          </div>
          <RecordManager
            kind="employee"
            records={employees.sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, "id"))}
            defaults={{ joinDate: today }}
            columns={["name", "position", "type", "phone", "active"]}
            empty="Belum ada pegawai."
          />
        </>
      )}
    </AdminShell>
  );
}
