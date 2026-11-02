import { byteRange, isClipId } from "@/lib/clips";
import { clipBytes, readyClip } from "@/server/clips";

export const dynamic = "force-dynamic";

// Klip video galeri (/api/clips/<id>) dengan dukungan Range: Safari dan Chrome meminta video sepotong demi
// sepotong, dan Safari tidak memutar video dari server yang tidak menjawab Range. Rentang terbuka dijawab
// paling banyak CLIP_CHUNK byte, peramban meminta sisanya sendiri. Id tidak pernah dipakai ulang, jadi boleh
// disimpan lama.
const CACHE = { "Cache-Control": "public, max-age=31536000, immutable", "Accept-Ranges": "bytes", "X-Content-Type-Options": "nosniff" };

async function answer(request, params, body) {
  const { id } = await params;
  if (!isClipId(id)) return new Response("Tidak ditemukan", { status: 404 });
  try {
    const clip = await readyClip(id);
    if (!clip) return new Response("Tidak ditemukan", { status: 404 });
    const range = byteRange(request.headers.get("range"), clip.bytes);
    if (!range) return new Response(null, { status: 416, headers: { ...CACHE, "Content-Range": `bytes */${clip.bytes}` } });
    const { start, end, partial } = range;
    const headers = { ...CACHE, "Content-Type": clip.mime, "Content-Length": String(end - start + 1) };
    if (partial) headers["Content-Range"] = `bytes ${start}-${end}/${clip.bytes}`;
    if (!body) return new Response(null, { status: partial ? 206 : 200, headers });
    if (partial) return new Response(await clipBytes(id, start, end), { status: 206, headers });
    // Tanpa Range: seluruh file, dibaca dan dikirim per 4 bagian supaya memori tetap kecil.
    let at = 0;
    const stream = new ReadableStream({
      async pull(controller) {
        if (at > end) return controller.close();
        const to = Math.min(end, at + 4 * 1024 * 1024 - 1);
        try {
          controller.enqueue(await clipBytes(id, at, to));
          at = to + 1;
        } catch (e) {
          controller.error(e);
        }
      },
    });
    return new Response(stream, { status: 200, headers });
  } catch (e) {
    console.error(`[klip] ${e.code ?? e.message}`);
    return new Response("Belum tersedia", { status: 503 });
  }
}

export const GET = (request, { params }) => answer(request, params, true);
export const HEAD = (request, { params }) => answer(request, params, false);
