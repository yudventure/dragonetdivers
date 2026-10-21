import { readImage } from "@/server/media";

export const dynamic = "force-dynamic";

// Foto galeri dari database (/api/media/<id>). Id tidak pernah dipakai ulang, jadi boleh disimpan lama.
export async function GET(request, { params }) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/.test(id)) return new Response("Tidak ditemukan", { status: 404 });
  try {
    const image = await readImage(id);
    if (!image) return new Response("Tidak ditemukan", { status: 404 });
    return new Response(image.data, {
      headers: { "Content-Type": image.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch (e) {
    console.error(`[media] ${e.code ?? e.message}`);
    return new Response("Belum tersedia", { status: 503 });
  }
}
