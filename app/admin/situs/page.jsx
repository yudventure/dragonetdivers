import AdminGate from "@/admin/AdminGate";
import AdminShell, { DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import GalleryManager from "@/admin/GalleryManager";
import { currentAdmin } from "@/server/admin-auth";
import { databaseStatus } from "@/server/db";
import { listRecords } from "@/server/records";

export const dynamic = "force-dynamic";
export const metadata = { title: "Galeri foto & video" };

// /admin/situs: isi galeri beranda dari admin. Begitu ada item yang tampil, galeri bawaan (ilustrasi AI)
// diganti; beranda diperbarui langsung setelah disimpan.
export default async function SitePage() {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const database = await databaseStatus();
  const items = database.ok ? await listRecords("gallery").catch((error) => console.error(`[admin/situs] ${error.code ?? error.message}`)) : null;
  return (
    <AdminShell admin={admin} active="situs">
      <ModuleTitle title="Galeri foto & video">
        Unggah foto asli dan tempel tautan video YouTube, Shorts, TikTok, Instagram, atau Facebook untuk galeri di beranda. Begitu ada satu item yang
        tampil, ilustrasi bawaan diganti. Keterangan ditulis dalam Bahasa Indonesia dan English.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {items && <GalleryManager items={items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))} />}
    </AdminShell>
  );
}
