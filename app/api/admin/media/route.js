import { guardAdmin } from "@/server/admin-auth";
import { deleteImage, isMediaId, MAX_UPLOAD, MediaError, saveImage } from "@/server/media";
import { countReferences } from "@/server/records";

export const dynamic = "force-dynamic";

// Unggah foto galeri dari /admin/situs (multipart, kolom "file"). Peramban sudah memperkecil fotonya
// (src/lib/image-prep.js) dan mencoba ulang bila jaringan putus (src/admin/upload.js). Mengembalikan
// { id, width, height }.
export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  if (Number(request.headers.get("content-length") || 0) > MAX_UPLOAD + 100_000) return Response.json({ error: "Foto maksimal 15 MB." }, { status: 413 });
  try {
    const form = await request.formData();
    const saved = await saveImage(form.get("file"));
    return Response.json({ ok: true, ...saved });
  } catch (e) {
    if (e instanceof MediaError) return Response.json({ error: e.message }, { status: 400 });
    console.error(`[admin/media] ${e.code ?? e.message}`);
    return Response.json({ error: "Foto belum tersimpan. Coba lagi sebentar." }, { status: 503 });
  }
}

// Hapus foto yang sudah terunggah tapi batal disimpan ke galeri (?id=). Foto yang dipakai item galeri
// tidak dihapus di sini (hapus item galerinya, fotonya ikut terhapus).
export async function DELETE(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const id = new URL(request.url).searchParams.get("id");
  if (!isMediaId(id)) return Response.json({ error: "Foto tidak ditemukan." }, { status: 404 });
  try {
    if (await countReferences("gallery", "mediaId", id)) return Response.json({ error: "Foto ini dipakai di galeri." }, { status: 409 });
    await deleteImage(id);
    return Response.json({ ok: true });
  } catch (e) {
    console.error(`[admin/media] hapus: ${e.code ?? e.message}`);
    return Response.json({ error: "Foto belum terhapus." }, { status: 503 });
  }
}
