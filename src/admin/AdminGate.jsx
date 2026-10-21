import { adminConfig } from "@/server/admin-auth";
import AdminLogin from "./AdminLogin";

/** Form masuk untuk halaman admin mana pun saat belum ada sesi; petunjuk pengaturan bila akun belum diatur. */
export default function AdminGate() {
  const { issues } = adminConfig();
  return <AdminLogin configured={issues.length === 0} issues={issues} />;
}
