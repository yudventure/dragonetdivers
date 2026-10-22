import AdminGate from "@/admin/AdminGate";
import AdminShell, { DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import GalleryManager from "@/admin/GalleryManager";
import { currentAdmin } from "@/server/admin-auth";
import { databaseStatus } from "@/server/db";
import { imageInfo } from "@/server/media";
import { listRecords } from "@/server/records";

export const dynamic = "force-dynamic";
export const metadata = { title: "Galeri foto & video" };

// /admin/situs: isi galeri beranda dari admin. Begitu ada item yang tampil, galeri bawaan (ilustrasi AI)
// diganti; beranda diperbarui langsung setelah disimpan.
/** Item galeri urut seperti di beranda (urutan, lalu terbaru), foto dengan ukuran tersimpannya. */
async function galleryItems() {
  const records = (await listRecords("gallery")).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(b.createdAt).localeCompare(String(a.createdAt)));
  const info = await imageInfo(records.filter((r) => r.type === "photo" && r.mediaId).map((r) => r.mediaId));
  return records.map((r) => (r.type === "photo" ? { ...r, width: info[r.mediaId]?.width ?? null, height: info[r.mediaId]?.height ?? null } : r));
}

export default async function SitePage() {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const database = await databaseStatus();
  const items = database.ok ? await galleryItems().catch((error) => console.error(`[admin/situs] ${error.code ?? error.message}`)) : null;
  return (
    <AdminShell admin={admin} active="situs">
      <ModuleTitle title="Galeri foto & video">
        Foto dan video di bagian Galeri pada beranda. Unggah foto langsung dari ponsel atau komputer, atau tempel tautan video YouTube, TikTok,
        Instagram, atau Facebook. Urutan di sini sama dengan urutan di beranda.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {items && <GalleryManager items={items} />}
    </AdminShell>
  );
}
