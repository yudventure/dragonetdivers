import { CLIP_PART, ClipError, isClipId } from "@/lib/clips";
import { guardAdmin } from "@/server/admin-auth";
import { finishClip, savePart } from "@/server/clips";

export const dynamic = "force-dynamic";

const failure = (e, where) => {
  if (e instanceof ClipError) return Response.json({ error: e.message }, { status: 400 });
  console.error(`[admin/klip] ${where}: ${e.code ?? e.message}`);
  return Response.json({ error: "Video belum terunggah. Coba lagi sebentar." }, { status: 503 });
};

// PUT ?part=n: satu bagian klip (badan mentah, paling besar 1 MiB). POST: tandai klip selesai diunggah.
export async function PUT(request, { params }) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const { id } = await params;
  const part = Number(new URL(request.url).searchParams.get("part"));
  if (!isClipId(id) || !Number.isInteger(part) || part < 0) return Response.json({ error: "Potongan video tidak valid." }, { status: 400 });
  if (Number(request.headers.get("content-length") || 0) > CLIP_PART) return Response.json({ error: "Potongan video terlalu besar." }, { status: 413 });
  try {
    const data = Buffer.from(await request.arrayBuffer());
    if (data.length > CLIP_PART) return Response.json({ error: "Potongan video terlalu besar." }, { status: 413 });
    await savePart(id, part, data);
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e, `bagian ${part}`);
  }
}

export async function POST(request, { params }) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const { id } = await params;
  if (!isClipId(id)) return Response.json({ error: "Video tidak ditemukan." }, { status: 404 });
  try {
    return Response.json({ ok: true, ...(await finishClip(id)) });
  } catch (e) {
    return failure(e, "selesai");
  }
}
