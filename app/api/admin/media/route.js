import { guardAdmin } from "@/server/admin-auth";
import { MAX_UPLOAD, MediaError, saveImage } from "@/server/media";

export const dynamic = "force-dynamic";

// Unggah foto galeri dari /admin/situs (multipart, kolom "file"). Mengembalikan { id, width, height }.
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
