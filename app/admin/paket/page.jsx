import AdminGate from "@/admin/AdminGate";
import AdminShell, { DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import PackageManager from "@/admin/PackageManager";
import { servicesIn } from "@/lib/services";
import { currentAdmin } from "@/server/admin-auth";
import { databaseStatus } from "@/server/db";
import { allPackages } from "@/server/packages";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paket & harga" };

// /admin/paket: paket per layanan yang tampil di halaman layanan dan bisa langsung dibayar.
export default async function PackagesPage() {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const database = await databaseStatus();
  const packages = database.ok ? await allPackages().catch(() => []) : [];
  const services = servicesIn("id").map(({ slug, title }) => ({ slug, title }));
  return (
    <AdminShell admin={admin} active="paket">
      <ModuleTitle title="Paket & harga">
        Paket yang aktif tampil di halaman layanannya (English dan Indonesia) dengan tombol Pesan sekarang. Harga dalam Rupiah; tamu yang memilih
        dolar melihat perkiraannya, dan PayPal menagih dalam dolar dengan kurs hari itu.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {database.ok && <PackageManager packages={packages} services={services} />}
    </AdminShell>
  );
}
