import "server-only";
import { channelLookup } from "@/lib/channel-cache";
import { youtubeOembedUrl } from "@/lib/video-embed";

// Kanal YouTube pemilik video galeri (permintaan pemilik, Oktober 2026: video diketuk tetap menuju kanal
// YouTube-nya), dibaca dari oEmbed YouTube dan diingat per proses (src/lib/channel-cache.js). Render beranda
// menunggu paling lama 1,2 detik; selama kanalnya belum diketahui, petak menuju halaman videonya.
const store = (globalThis.__ddYouTubeChannels ??= { known: new Map(), pending: new Map() });

export const youtubeChannels = channelLookup({
  store,
  async fetchJson(id) {
    const response = await fetch(youtubeOembedUrl(id), { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  onError: (id, error) => console.warn(`[galeri] kanal YouTube untuk video ${id} belum terbaca: ${error?.message ?? error}`),
});
