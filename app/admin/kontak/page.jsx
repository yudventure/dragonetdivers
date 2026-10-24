import AdminGate from "@/admin/AdminGate";
import AdminShell, { DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import SiteSettingsForm from "@/admin/SiteSettingsForm";
import { envText } from "@/lib/env";
import { DEFAULT_CONTACT, mapsLink, NETWORKS, SOCIAL_ENV } from "@/lib/site";
import { currentAdmin } from "@/server/admin-auth";
import { databaseStatus } from "@/server/db";
import { getSiteSettings } from "@/server/site-settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kontak, sosial & mata uang" };

// /admin/kontak: WhatsApp, email, alamat, Google Maps, akun media sosial yang tampil di website, dan
// pilihan dolar AS (showUsd; mati = semua harga hanya dalam Rupiah).
// Isian kosong memakai isian lama dari hPanel atau nilai bawaan (ditampilkan sebagai contoh di form).
/** Isian form = nilai yang sedang dipakai website: isian admin, atau isian lama dan nilai bawaan. */
const current = (settings, fallback) => ({
  ...settings,
  whatsapp: settings.whatsapp || fallback.whatsapp,
  email: settings.email || fallback.email,
  address: settings.address.some(Boolean) ? settings.address : [...fallback.address],
  ...Object.fromEntries(NETWORKS.map((n) => [n.id, settings[n.id] || fallback[n.id]])),
});

export default async function ContactSettingsPage() {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const database = await databaseStatus();
  const settings = database.ok ? await getSiteSettings({ fresh: true }) : null;
  const fallback = {
    whatsapp: envText(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
    email: DEFAULT_CONTACT.email,
    address: DEFAULT_CONTACT.address,
    mapsUrl: mapsLink(DEFAULT_CONTACT.base),
    ...Object.fromEntries(NETWORKS.map((n) => [n.id, envText(SOCIAL_ENV[n.id])])),
  };
  return (
    <AdminShell admin={admin} active="kontak">
      <ModuleTitle title="Kontak, sosial & mata uang">
        Nomor WhatsApp, email, alamat, akun media sosial yang tampil di website, dan pilihan mata uang untuk tamu. Setelah disimpan, website
        langsung memakai isian baru, tanpa perlu membuka hPanel atau membangun ulang website.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {settings && <SiteSettingsForm initial={current(settings, fallback)} fallback={fallback} />}
    </AdminShell>
  );
}
