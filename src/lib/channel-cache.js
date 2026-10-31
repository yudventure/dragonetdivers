// Pengingat kanal YouTube pemilik video galeri (dipakai src/server/youtube-channel.js). Murni supaya bisa
// diuji (tests/youtube-channel.test.js): cara mengambil jawaban oEmbed, jam, dan tempat simpan disuntikkan.
// Berhasil diingat sehari, gagal dicoba lagi setelah retryMs (alamat lama yang pernah berhasil tetap dipakai).
// Pemanggil menunggu paling lama waitMs; pencarian yang belum selesai tetap jalan dan dipakai panggilan berikutnya.
import { channelFromOembed } from "./video-embed.js";

export function channelLookup({ fetchJson, store = { known: new Map(), pending: new Map() }, now = Date.now, waitMs = 1200, dayMs = 86_400_000, retryMs = 600_000, onError = () => {} }) {
  async function lookup(id) {
    try {
      const url = channelFromOembed(await fetchJson(id));
      store.known.set(id, { url, until: now() + (url ? dayMs : retryMs) });
    } catch (error) {
      onError(id, error);
      store.known.set(id, { url: store.known.get(id)?.url ?? null, until: now() + retryMs });
    } finally {
      store.pending.delete(id);
    }
  }

  /** Alamat kanal YouTube tiap video ({ id: url atau null }). */
  return async function channels(ids) {
    const unique = [...new Set(ids)];
    for (const id of unique) {
      if ((store.known.get(id)?.until ?? 0) > now() || store.pending.has(id)) continue;
      store.pending.set(id, lookup(id));
    }
    const waiting = unique.map((id) => store.pending.get(id)).filter(Boolean);
    if (waiting.length) {
      let timer;
      await Promise.race([Promise.all(waiting), new Promise((resolve) => (timer = setTimeout(resolve, waitMs)))]);
      clearTimeout(timer);
    }
    return Object.fromEntries(unique.map((id) => [id, store.known.get(id)?.url ?? null]));
  };
}
