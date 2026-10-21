import AdminDashboard from "@/admin/AdminDashboard";
import AdminGate from "@/admin/AdminGate";
import { currentAdmin } from "@/server/admin-auth";

export const dynamic = "force-dynamic";

// Dashboard tim Dragonet (dibuka dari "Operator sign in" di footer). Tanpa sesi yang sah, tampil form
// masuk; bila akun operator belum diatur di hPanel, form diganti petunjuk pengaturan.
export default async function AdminPage() {
  const admin = await currentAdmin();
  return admin ? <AdminDashboard admin={admin} /> : <AdminGate />;
}
