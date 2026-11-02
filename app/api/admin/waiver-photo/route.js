import { revalidatePath } from "next/cache";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { imageInfo, isMediaId } from "@/server/media";
import { countReferences } from "@/server/records";
import { saveWaiverPhoto } from "@/server/waivers";

export const dynamic = "force-dynamic";

// Foto di panel kiri formulir selam (/admin/formulir): { mediaId } dari foto galeri, atau null untuk foto
// bawaan. Hanya foto yang dipakai galeri yang bisa dipilih; fotonya tetap milik galeri (tidak disalin).
export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request);
  const mediaId = input?.mediaId ?? null;
  if (mediaId !== null && !isMediaId(mediaId)) return Response.json({ error: "Foto tidak valid." }, { status: 400 });
  try {
    if (mediaId && (!(await imageInfo([mediaId]))[mediaId] || !(await countReferences("gallery", "mediaId", mediaId)))) {
      return Response.json({ error: "Foto ini tidak ada di galeri lagi. Muat ulang halaman." }, { status: 400 });
    }
    await saveWaiverPhoto(mediaId);
    revalidatePath("/[lang]/waiver", "page");
    return Response.json({ ok: true, mediaId });
  } catch (e) {
    console.error(`[admin/formulir] foto: ${e.code ?? e.message}`);
    return Response.json({ error: "Database belum bisa diakses. Coba lagi sebentar." }, { status: 503 });
  }
}
