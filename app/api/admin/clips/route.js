import { ClipError, isClipId } from "@/lib/clips";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { createClip, deleteClip } from "@/server/clips";
import { countReferences } from "@/server/records";

export const dynamic = "force-dynamic";

// Klip video galeri dari /admin/situs (src/lib/clips.js). POST { name, mime, bytes, width, height, duration }
// memulai unggahan dan mengembalikan { id, parts, partSize }; bagian-bagiannya dikirim ke
// /api/admin/clips/<id>?part=n. DELETE ?id= membuang klip yang batal dipakai.
export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request, 4_000);
  if (!input) return Response.json({ error: "Data video tidak valid." }, { status: 400 });
  try {
    return Response.json({ ok: true, ...(await createClip(input)) });
  } catch (e) {
    if (e instanceof ClipError) return Response.json({ error: e.message }, { status: 400 });
    console.error(`[admin/klip] ${e.code ?? e.message}`);
    return Response.json({ error: "Video belum bisa diunggah. Coba lagi sebentar." }, { status: 503 });
  }
}

export async function DELETE(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const id = new URL(request.url).searchParams.get("id");
  if (!isClipId(id)) return Response.json({ error: "Video tidak ditemukan." }, { status: 404 });
  try {
    if (await countReferences("gallery", "clipId", id)) return Response.json({ error: "Video ini dipakai di galeri." }, { status: 409 });
    await deleteClip(id);
    return Response.json({ ok: true });
  } catch (e) {
    console.error(`[admin/klip] hapus: ${e.code ?? e.message}`);
    return Response.json({ error: "Video belum terhapus." }, { status: 503 });
  }
}
