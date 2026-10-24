import { revalidatePath } from "next/cache";
import { MAX_BATCH } from "@/lib/image-prep";
import { galleryItem } from "@/lib/modules/site";
import { cleanRecord, RecordError } from "@/lib/records";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { countReferences, saveRecord } from "@/server/records";

export const dynamic = "force-dynamic";

// Simpan banyak foto galeri sekaligus dari panel unggah /admin/situs ({ items: [{ type, mediaId, captionId,
// captionEn, size, order, active }] }). Semua item diperiksa dulu, baru disimpan; beranda diperbarui sekali.
// Foto yang sudah ada di galeri dilewati, jadi menekan Simpan lagi setelah koneksi putus tidak membuat ganda.
export async function POST(request) {
  const { admin, error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request, 200_000);
  const items = Array.isArray(input?.items) ? input.items : [];
  if (!items.length || items.length > MAX_BATCH) return Response.json({ error: `Kirim 1 sampai ${MAX_BATCH} foto.` }, { status: 400 });
  try {
    items.forEach((item, index) => {
      try {
        cleanRecord(galleryItem, { ...item, type: "photo" });
      } catch (e) {
        if (e instanceof RecordError) throw Object.assign(e, { index });
        throw e;
      }
    });
    const saved = [];
    for (const item of items) {
      if (await countReferences("gallery", "mediaId", item.mediaId)) continue;
      saved.push((await saveRecord(galleryItem, null, { ...item, type: "photo" }, { by: admin.email })).id);
    }
    for (const path of galleryItem.revalidate ?? []) revalidatePath(path, "page");
    return Response.json({ ok: true, ids: saved });
  } catch (e) {
    if (e instanceof RecordError) return Response.json({ error: e.message, field: e.field, index: e.index }, { status: 400 });
    console.error(`[admin/galeri] ${e.code ?? e.message}`);
    return Response.json({ error: "Galeri belum tersimpan. Coba lagi sebentar." }, { status: 503 });
  }
}
