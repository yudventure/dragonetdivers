import { services } from "@/lib/services";
import { serviceImageOf } from "@/lib/site-settings";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { deleteImage, imageInfo, isMediaId } from "@/server/media";
import { saveHiddenServices, saveServiceImage } from "@/server/site-settings";

export const dynamic = "force-dynamic";

// Panel "Layanan di website" di /admin/paket.
// - Sakelar ({ hidden: ["snorkeling", ...] }): layanan yang disimpan tidak tampil di website dan paketnya
//   tidak bisa dipesan; paketnya tetap ada. Minimal satu layanan tampil.
// - Foto kartu ({ image: { slug, mediaId } }, mediaId null = kembali ke ilustrasi bawaan): foto sudah
//   diunggah lewat /api/admin/media; ukurannya dibaca dari tabel media, foto lama dihapus.
export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request);
  if (input && "image" in input) return setImage(input.image);
  if (!Array.isArray(input?.hidden) || !input.hidden.every((slug) => typeof slug === "string")) {
    return Response.json({ error: "Isian tidak valid." }, { status: 400 });
  }
  if (services.every((s) => input.hidden.includes(s.slug))) {
    return Response.json({ error: "Minimal satu layanan tetap tampil di website." }, { status: 400 });
  }
  try {
    return Response.json({ ok: true, hidden: await saveHiddenServices(input.hidden) });
  } catch (e) {
    console.error(`[admin/paket] layanan di website: ${e.code ?? e.message}`);
    return Response.json({ error: "Database belum bisa diakses. Coba lagi sebentar." }, { status: 503 });
  }
}

async function setImage(input) {
  const slug = input?.slug;
  const mediaId = input?.mediaId ?? null;
  if (!services.some((s) => s.slug === slug) || (mediaId !== null && !isMediaId(mediaId))) {
    return Response.json({ error: "Isian tidak valid." }, { status: 400 });
  }
  try {
    let image = null;
    if (mediaId) {
      const info = (await imageInfo([mediaId]))[mediaId];
      if (!info) return Response.json({ error: "Foto tidak ditemukan. Unggah lagi." }, { status: 400 });
      image = { id: mediaId, width: info.width, height: info.height, blur: info.blur ?? "" };
    }
    const old = await saveServiceImage(slug, image);
    if (old && old !== mediaId) await deleteImage(old).catch(() => {});
    return Response.json({ ok: true, image: serviceImageOf(image) });
  } catch (e) {
    console.error(`[admin/paket] foto layanan: ${e.code ?? e.message}`);
    return Response.json({ error: "Database belum bisa diakses. Coba lagi sebentar." }, { status: 503 });
  }
}
