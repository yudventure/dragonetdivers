import AdminGate from "@/admin/AdminGate";
import AdminShell, { DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import DeveloperSettings from "@/admin/DeveloperSettings";
import { currentAdmin } from "@/server/admin-auth";
import { databaseStatus } from "@/server/db";
import { getDeveloper } from "@/server/developer-state";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mode developer" };

// /admin/developer: tutup seluruh website, halaman tertentu, atau bagian beranda selama sedang diperbaiki.
export default async function DeveloperPage() {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const database = await databaseStatus();
  const developer = database.ok ? await getDeveloper({ fresh: true }) : null;
  return (
    <AdminShell admin={admin} active="developer">
      <ModuleTitle title="Mode developer">
        Tutup seluruh website atau sebagian saja selama sedang diperbaiki. Pengunjung melihat halaman &ldquo;sedang diperbarui&rdquo;, sedangkan kamu
        yang masuk di admin tetap melihat semuanya dengan bilah kecil di bawah layar. Halaman status pesanan tamu tidak pernah ditutup.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {developer && <DeveloperSettings initial={developer} />}
    </AdminShell>
  );
}
