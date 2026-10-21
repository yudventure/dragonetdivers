import AdminDashboard from "@/admin/AdminDashboard";
import AdminLogin from "@/admin/AdminLogin";
import { adminConfig, currentAdmin } from "@/server/admin-auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Dashboard tim Dragonet (dibuka dari "Operator sign in" di footer). Tanpa sesi yang sah, tampil form
// masuk; bila akun operator belum diatur di hPanel, form diganti petunjuk pengaturan.
export default async function AdminPage() {
  const admin = await currentAdmin();
  if (!admin) {
    const { issues } = adminConfig();
    return <AdminLogin configured={issues.length === 0} issues={issues} />;
  }
  return <AdminDashboard admin={admin} />;
}
