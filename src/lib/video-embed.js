// Ubah tautan video YouTube (termasuk Shorts), TikTok, Instagram, dan Facebook menjadi alamat embed untuk
// galeri (src/components/EmbedVideo.jsx). Fungsi murni, diuji di tests/video-embed.test.js.
//
// Yang bisa diputar otomatis tanpa suara dan berulang: YouTube (parameter resmi autoplay, mute, loop) dan
// TikTok (parameter autoplay dan loop, ditambah perintah postMessage di bawah). Facebook bisa diputar
// otomatis tanpa suara tapi tidak berulang. Instagram tidak mendukung putar otomatis dari embed, jadi
// diputar saat diketuk. Untuk loop yang paling cepat dan pasti, unggah klip MP4/WebM sendiri (jenis
// "video" di src/content/gallery.js).

const YOUTUBE_HOSTS = ["youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com"];

function parse(raw) {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return { url, host: url.hostname.replace(/^www\./, ""), parts: url.pathname.split("/").filter(Boolean) };
  } catch {
    return null;
  }
}

function youtube({ url, host, parts }) {
  let id = null;
  let vertical = false;
  if (host === "youtu.be") id = parts[0];
  else if (YOUTUBE_HOSTS.includes(host)) {
    if (parts[0] === "watch") id = url.searchParams.get("v");
    else if (["shorts", "embed", "live"].includes(parts[0])) {
      id = parts[1];
      vertical = parts[0] === "shorts";
    }
  }
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: id, // loop pada satu video butuh playlist berisi video itu sendiri
    controls: "0",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    disablekb: "1",
  });
  return {
    platform: "youtube",
    label: "YouTube",
    id,
    href: vertical ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
    embed: `https://www.youtube-nocookie.com/embed/${id}?${params}`,
    thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    vertical,
    autoplay: true,
    loops: true,
  };
}

function tiktok({ host, parts }) {
  if (host !== "tiktok.com" && host !== "m.tiktok.com") return null;
  const at = parts.findIndex((p) => p === "video" || p === "v1" || p === "v2");
  const id = at >= 0 ? parts[at + 1] : null;
  if (!id || !/^\d{15,22}$/.test(id)) return null;
  // Parameter Embed Player v1 resmi (developers.tiktok.com/doc/embed-player): tanpa tombol dan teks.
  // Player ini tidak punya parameter tanpa suara, jadi suaranya dimatikan lewat tiktokReaction().
  const quiet = { music_info: "0", description: "0", rel: "0", native_context_menu: "0", closed_caption: "0" };
  const params = new URLSearchParams({
    autoplay: "1",
    loop: "1",
    controls: "0",
    progress_bar: "0",
    play_button: "0",
    volume_control: "0",
    fullscreen_button: "0",
    timestamp: "0",
    ...quiet,
  });
  // Cadangan bila peramban tetap menolak memutar otomatis: tombol putar dan suara TikTok tampil.
  const withControls = new URLSearchParams({ autoplay: "1", loop: "1", controls: "1", fullscreen_button: "0", ...quiet });
  const user = parts[0]?.startsWith("@") ? parts[0] : null;
  return {
    platform: "tiktok",
    label: "TikTok",
    id,
    href: user ? `https://www.tiktok.com/${user}/video/${id}` : `https://www.tiktok.com/player/v1/${id}`,
    embed: `https://www.tiktok.com/player/v1/${id}?${params}`,
    embedControls: `https://www.tiktok.com/player/v1/${id}?${withControls}`,
    thumbnail: null,
    vertical: true,
    autoplay: true,
    loops: true,
  };
}

function instagram({ host, parts }) {
  if (host !== "instagram.com") return null;
  const at = parts.findIndex((p) => ["reel", "reels", "p", "tv"].includes(p));
  const code = at >= 0 ? parts[at + 1] : null;
  if (!code || !/^[A-Za-z0-9_-]{5,40}$/.test(code)) return null;
  const kind = parts[at] === "reels" ? "reel" : parts[at];
  return {
    platform: "instagram",
    label: "Instagram",
    id: code,
    href: `https://www.instagram.com/${kind}/${code}/`,
    embed: `https://www.instagram.com/${kind}/${code}/embed/`,
    thumbnail: null,
    vertical: kind !== "p",
    autoplay: false,
    loops: false,
  };
}

function facebook({ url, host, parts }) {
  if (host !== "facebook.com" && host !== "m.facebook.com") return null;
  const isVideo = parts.includes("videos") || parts[0] === "reel" || (parts[0] === "watch" && url.searchParams.get("v"));
  if (!isVideo) return null;
  // /halaman/videos/ID, /halaman/videos/judul/ID, /reel/ID, atau /watch/?v=ID
  const after = parts.slice(parts.indexOf(parts[0] === "reel" ? "reel" : "videos") + 1);
  const id = parts[0] === "watch" ? url.searchParams.get("v") : after.find((p) => /^\d+$/.test(p));
  if (!id || !/^\d{5,25}$/.test(id)) return null;
  const href = `https://www.facebook.com${url.pathname}${parts[0] === "watch" ? `?v=${id}` : ""}`;
  const params = new URLSearchParams({ href, show_text: "false", autoplay: "true", mute: "1" });
  return {
    platform: "facebook",
    label: "Facebook",
    id,
    href,
    embed: `https://www.facebook.com/plugins/video.php?${params}`,
    thumbnail: null,
    vertical: parts[0] === "reel",
    autoplay: true,
    loops: false,
  };
}

/** Data embed untuk sebuah tautan video, atau null bila tautan tidak dikenali (mis. tautan pendek vt.tiktok.com). */
export function parseVideoUrl(raw) {
  const parsed = typeof raw === "string" ? parse(raw) : null;
  if (!parsed) return null;
  return youtube(parsed) ?? tiktok(parsed) ?? instagram(parsed) ?? facebook(parsed);
}

// Kendali Embed Player TikTok lewat postMessage (developers.tiktok.com/doc/embed-player). Perintah ke
// player berbentuk { "x-tiktok-player": true, type, value }, player mengabarkan onPlayerReady,
// onStateChange (value -1 mulai, 0 selesai, 1 diputar, 2 dijeda, 3 memuat), dan onCurrentTime.
// Peramban, terutama di iPhone, menolak memutar otomatis video bersuara, jadi begitu siap player
// dibisukan lalu diputar, dan bila videonya habis diulang dari awal.
export const TIKTOK_ORIGIN = "https://www.tiktok.com";
export const TIKTOK_STATE = { ended: 0, playing: 1, paused: 2 };

/** Pesan player hanya diterima dari tiktok.com (www.tiktok.com atau subdomain lain). */
export function isTikTokOrigin(origin) {
  return typeof origin === "string" && /^https:\/\/([a-z0-9-]+\.)*tiktok\.com$/.test(origin);
}

export function tiktokCommand(type, value) {
  return value === undefined ? { "x-tiktok-player": true, type } : { "x-tiktok-player": true, type, value };
}

/** Pesan dari player TikTok sebagai { type, value }, atau null bila bukan pesan player. */
export function readTikTokEvent(data) {
  let msg = data;
  if (typeof msg === "string") {
    try {
      msg = JSON.parse(msg);
    } catch {
      return null;
    }
  }
  if (!msg || typeof msg !== "object" || msg["x-tiktok-player"] !== true || typeof msg.type !== "string") return null;
  // Sebagian pesan membawa isinya di luar value (mis. currentTime), jadi pesan utuh dipakai sebagai cadangan.
  return { type: msg.type, value: "value" in msg ? msg.value : msg };
}

/**
 * Perintah untuk player TikTok setelah sebuah pesan darinya. Saat siap: bisukan lalu putar. Saat
 * selesai: ulang dari awal. Saat dijeda padahal tamu tidak bisa menyentuh player (petak latar):
 * putar lagi tanpa suara. Bila tamu bisa menyentuhnya (interactive), jedanya dibiarkan.
 */
export function tiktokReaction(event, { interactive = false } = {}) {
  const start = [tiktokCommand("mute"), tiktokCommand("play")];
  if (event?.type === "onPlayerReady") return start;
  if (event?.type !== "onStateChange") return [];
  const state = Number(event.value);
  if (state === TIKTOK_STATE.ended) return [tiktokCommand("seekTo", 0), tiktokCommand("play")];
  if (state === TIKTOK_STATE.paused && !interactive) return start;
  return [];
}

/** Apakah pesan ini tanda videonya sedang berjalan. */
export function isTikTokPlaying(event) {
  if (event?.type === "onStateChange") return Number(event.value) === TIKTOK_STATE.playing;
  return event?.type === "onCurrentTime" && Number(event.value?.currentTime ?? event.value) > 0;
}
