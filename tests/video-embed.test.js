import { test } from "node:test";
import assert from "node:assert/strict";
import {
  channelFromOembed,
  isTikTokOrigin,
  isTikTokPlaying,
  isYouTubeOrigin,
  isYouTubePlaying,
  parseVideoUrl,
  readTikTokEvent,
  readYouTubeEvent,
  tiktokCommand,
  tiktokReaction,
  youtubeCommand,
  youtubeEmbedFor,
  youtubeInfo,
  youtubeListening,
  youtubeOembedUrl,
  youtubeReaction,
} from "../src/lib/video-embed.js";

test("YouTube biasa, youtu.be, dan Shorts menjadi embed tanpa suara yang berulang", () => {
  for (const url of ["https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s", "https://youtu.be/dQw4w9WgXcQ", "https://m.youtube.com/watch?v=dQw4w9WgXcQ"]) {
    const v = parseVideoUrl(url);
    assert.equal(v.platform, "youtube", url);
    assert.equal(v.vertical, false);
    const embed = new URL(v.embed);
    assert.equal(embed.hostname, "www.youtube-nocookie.com");
    for (const [k, val] of [["autoplay", "1"], ["mute", "1"], ["loop", "1"], ["playlist", "dQw4w9WgXcQ"], ["playsinline", "1"]]) {
      assert.equal(embed.searchParams.get(k), val, k);
    }
    assert.equal(v.thumbnail, "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
  }
  const short = parseVideoUrl("https://youtube.com/shorts/abcDEF12345?si=xyz");
  assert.equal(short.vertical, true);
  assert.equal(short.href, "https://www.youtube.com/shorts/abcDEF12345");
  // Sampul tajam: Shorts tegak, video biasa 1280 px; gambar mini 4:3 tetap untuk cadangan dan admin.
  assert.equal(short.poster, "https://i.ytimg.com/vi/abcDEF12345/oardefault.jpg");
  assert.equal(short.thumbnail, "https://i.ytimg.com/vi/abcDEF12345/hqdefault.jpg");
  assert.equal(parseVideoUrl("https://youtu.be/dQw4w9WgXcQ").poster, "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg");
});

test("YouTube tanpa tombol: tanpa kendali, layar penuh, anotasi; kendali lewat postMessage dengan origin halaman", () => {
  const v = parseVideoUrl("https://www.youtube.com/shorts/abcDEF12345");
  const embed = new URL(v.embed);
  for (const [k, val] of [["controls", "0"], ["fs", "0"], ["iv_load_policy", "3"], ["disablekb", "1"], ["enablejsapi", "1"], ["rel", "0"]]) {
    assert.equal(embed.searchParams.get(k), val, k);
  }
  const withOrigin = new URL(youtubeEmbedFor(v.embed, "https://dragonetdiversrajaampat.com"));
  assert.equal(withOrigin.searchParams.get("origin"), "https://dragonetdiversrajaampat.com");
  assert.equal(withOrigin.searchParams.get("autoplay"), "1");
  assert.equal(new URL(youtubeEmbedFor(v.embed, "javascript:alert(1)")).searchParams.has("origin"), false);
  assert.equal(isYouTubeOrigin("https://www.youtube-nocookie.com"), true);
  assert.equal(isYouTubeOrigin("https://www.youtube.com"), true);
  for (const bad of ["http://www.youtube.com", "https://www.youtube.com.evil.example", "https://notyoutube.com", "null", undefined]) {
    assert.equal(isYouTubeOrigin(bad), false, String(bad));
  }
});

test("player YouTube: dibisukan dan diputar saat siap, berulang mulus sebelum habis, diputar lagi bila dijeda", () => {
  const mute = youtubeCommand("mute");
  const play = youtubeCommand("playVideo");
  const restart = youtubeCommand("seekTo", [0, true]);
  assert.deepEqual(JSON.parse(youtubeListening()), { event: "listening", id: 1, channel: "widget" });
  assert.deepEqual(JSON.parse(restart), { event: "command", func: "seekTo", args: [0, true], id: 1, channel: "widget" });
  assert.deepEqual(youtubeReaction({ event: "onReady", info: null }), [mute, play]);
  // Belum mulai (autoplay tertahan) atau hanya dimuat: bisukan lalu putar; keadaan yang sama tidak diulang.
  assert.deepEqual(youtubeReaction({ event: "initialDelivery", info: { playerState: -1, duration: 30 } }), [mute, play]);
  assert.deepEqual(youtubeReaction({ event: "onStateChange", info: 5 }), [mute, play]);
  assert.deepEqual(youtubeReaction({ event: "onStateChange", info: 5 }, { previous: 5 }), []);
  // Hampir habis: ulang dari awal tanpa menunggu layar akhir YouTube.
  assert.deepEqual(youtubeReaction({ event: "infoDelivery", info: { currentTime: 29.7 } }, { duration: 30 }), [restart]);
  assert.deepEqual(youtubeReaction({ event: "infoDelivery", info: { currentTime: 12 } }, { duration: 30 }), []);
  assert.deepEqual(youtubeReaction({ event: "infoDelivery", info: { currentTime: 9.8, duration: 10 } }), [restart]);
  assert.deepEqual(youtubeReaction({ event: "infoDelivery", info: { currentTime: 0.3 } }, { duration: 0.5 }), [], "video sangat pendek memakai loop bawaan");
  assert.deepEqual(youtubeReaction({ event: "infoDelivery", info: { currentTime: 29.9 } }), [], "durasi belum diketahui");
  // Habis tetap diulang (cadangan), dijeda diputar lagi, berjalan dan memuat dibiarkan.
  assert.deepEqual(youtubeReaction({ event: "onStateChange", info: 0 }), [restart, play]);
  assert.deepEqual(youtubeReaction({ event: "onStateChange", info: 2 }, { previous: 1 }), [play]);
  for (const state of [1, 3]) assert.deepEqual(youtubeReaction({ event: "onStateChange", info: state }), [], String(state));
  assert.deepEqual(youtubeReaction(null), []);
});

test("pesan player YouTube dibaca dari JSON, pesan lain diabaikan", () => {
  const event = readYouTubeEvent('{"event":"infoDelivery","info":{"playerState":1,"currentTime":2.5,"duration":30},"id":1,"channel":"widget"}');
  assert.deepEqual(event, { event: "infoDelivery", info: { playerState: 1, currentTime: 2.5, duration: 30 } });
  assert.deepEqual(youtubeInfo(event), { state: 1, currentTime: 2.5, duration: 30 });
  assert.deepEqual(youtubeInfo({ event: "onStateChange", info: 2 }), { state: 2, currentTime: null, duration: null });
  assert.equal(isYouTubePlaying(event), true);
  assert.equal(isYouTubePlaying({ event: "onStateChange", info: 3 }), false);
  assert.equal(isYouTubePlaying({ event: "infoDelivery", info: { currentTime: 0.4 } }), true);
  assert.equal(isYouTubePlaying({ event: "infoDelivery", info: { currentTime: 0 } }), false);
  for (const bad of [null, "", "bukan json", "{}", { info: 1 }, 42, '{"event":5}']) {
    assert.equal(readYouTubeEvent(bad), null, JSON.stringify(bad));
  }
});

test("kanal YouTube pemilik video dari oEmbed, alamat lain ditolak", () => {
  assert.equal(
    youtubeOembedUrl("abcDEF12345"),
    "https://www.youtube.com/oembed?format=json&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DabcDEF12345",
  );
  assert.equal(channelFromOembed({ author_url: "https://www.youtube.com/@thedampier" }), "https://www.youtube.com/@thedampier");
  assert.equal(channelFromOembed({ author_url: "http://youtube.com/channel/UCabcdefghijklmnopqrstuv/" }), "https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv");
  for (const bad of [null, {}, { author_url: "" }, { author_url: "https://evil.example/@x" }, { author_url: 'https://www.youtube.com/@x"><script>' }, { author_url: "https://www.youtube.com/watch?v=abcDEF12345" }]) {
    assert.equal(channelFromOembed(bad), null, JSON.stringify(bad));
  }
});

test("TikTok memakai Embed Player v1 dengan autoplay dan loop, cadangannya dengan tombol", () => {
  const v = parseVideoUrl("https://www.tiktok.com/@dragonetdiversrajaampat/video/7312345678901234567?is_from_webapp=1");
  assert.equal(v.platform, "tiktok");
  const embed = new URL(v.embed);
  assert.equal(embed.pathname, "/player/v1/7312345678901234567");
  for (const k of ["autoplay", "loop"]) assert.equal(embed.searchParams.get(k), "1", k);
  for (const k of ["controls", "play_button", "description", "music_info", "rel"]) assert.equal(embed.searchParams.get(k), "0", k);
  const backup = new URL(v.embedControls);
  assert.equal(backup.pathname, embed.pathname);
  assert.equal(backup.searchParams.get("controls"), "1");
  for (const k of ["autoplay", "loop"]) assert.equal(backup.searchParams.get(k), "1", k);
  assert.equal(backup.searchParams.get("description"), "0");
  assert.equal(v.href, "https://www.tiktok.com/@dragonetdiversrajaampat/video/7312345678901234567");
  assert.equal(v.vertical, true);
  assert.equal(parseVideoUrl("https://www.tiktok.com/player/v1/7312345678901234567").id, "7312345678901234567");
});

test("player TikTok dibisukan lalu diputar saat siap, diulang saat habis", () => {
  const mute = tiktokCommand("mute");
  const play = tiktokCommand("play");
  assert.deepEqual(mute, { "x-tiktok-player": true, type: "mute" });
  assert.deepEqual(tiktokCommand("seekTo", 0), { "x-tiktok-player": true, type: "seekTo", value: 0 });
  assert.deepEqual(tiktokReaction({ type: "onPlayerReady" }), [mute, play]);
  assert.deepEqual(tiktokReaction({ type: "onStateChange", value: 0 }), [tiktokCommand("seekTo", 0), play]);
  // Dijeda peramban di petak latar: putar lagi tanpa suara. Bila tamu memegang kendali: dibiarkan.
  assert.deepEqual(tiktokReaction({ type: "onStateChange", value: 2 }), [mute, play]);
  assert.deepEqual(tiktokReaction({ type: "onStateChange", value: 2 }, { interactive: true }), []);
  assert.deepEqual(tiktokReaction({ type: "onStateChange", value: 0 }, { interactive: true }), [tiktokCommand("seekTo", 0), play]);
  for (const value of [-1, 1, 3]) assert.deepEqual(tiktokReaction({ type: "onStateChange", value }), [], String(value));
  assert.deepEqual(tiktokReaction({ type: "onCurrentTime", value: { currentTime: 2, duration: 9 } }), []);
  assert.deepEqual(tiktokReaction(null), []);
});

test("pesan player TikTok dibaca dari objek atau JSON, pesan lain diabaikan", () => {
  assert.deepEqual(readTikTokEvent({ "x-tiktok-player": true, type: "onStateChange", value: 1 }), { type: "onStateChange", value: 1 });
  assert.deepEqual(readTikTokEvent('{"x-tiktok-player":true,"type":"onPlayerReady"}').type, "onPlayerReady");
  const time = readTikTokEvent({ "x-tiktok-player": true, type: "onCurrentTime", currentTime: 1.5, duration: 9 });
  assert.equal(isTikTokPlaying(time), true);
  assert.equal(isTikTokPlaying(readTikTokEvent({ "x-tiktok-player": true, type: "onCurrentTime", value: { currentTime: 3 } })), true);
  assert.equal(isTikTokPlaying({ type: "onStateChange", value: 1 }), true);
  assert.equal(isTikTokPlaying({ type: "onStateChange", value: 2 }), false);
  assert.equal(isTikTokPlaying({ type: "onCurrentTime", value: { currentTime: 0 } }), false);
  for (const bad of [null, "", "bukan json", { type: "play" }, { "x-tiktok-player": "ya", type: "onPlayerReady" }, { "x-tiktok-player": true }, 42]) {
    assert.equal(readTikTokEvent(bad), null, JSON.stringify(bad));
  }
  assert.equal(isTikTokOrigin("https://www.tiktok.com"), true);
  assert.equal(isTikTokOrigin("https://tiktok.com"), true);
  for (const bad of ["http://www.tiktok.com", "https://www.tiktok.com.evil.example", "https://eviltiktok.com", "null", undefined]) {
    assert.equal(isTikTokOrigin(bad), false, String(bad));
  }
});

test("Instagram reel dan post: embed resmi, diputar saat diketuk", () => {
  const reel = parseVideoUrl("https://www.instagram.com/reel/C1a2B3c4D5e/?igsh=abc");
  assert.equal(reel.embed, "https://www.instagram.com/reel/C1a2B3c4D5e/embed/");
  assert.equal(reel.autoplay, false);
  assert.equal(reel.vertical, true);
  assert.equal(parseVideoUrl("https://instagram.com/reels/C1a2B3c4D5e").embed, "https://www.instagram.com/reel/C1a2B3c4D5e/embed/");
  assert.equal(parseVideoUrl("https://www.instagram.com/p/C1a2B3c4D5e/").vertical, false);
});

test("Facebook video, reel, dan watch memakai plugin video", () => {
  for (const [url, id, vertical] of [
    ["https://www.facebook.com/dragonetdiversrajaampat/videos/1234567890123456/", "1234567890123456", false],
    ["https://www.facebook.com/dragonetdiversrajaampat/videos/manta-dive/1234567890123456", "1234567890123456", false],
    ["https://www.facebook.com/reel/987654321098765", "987654321098765", true],
    ["https://www.facebook.com/watch/?v=1234567890123456", "1234567890123456", false],
  ]) {
    const v = parseVideoUrl(url);
    assert.equal(v?.platform, "facebook", url);
    assert.equal(v.id, id);
    assert.equal(v.vertical, vertical);
    const embed = new URL(v.embed);
    assert.equal(embed.pathname, "/plugins/video.php");
    assert.equal(embed.searchParams.get("href"), v.href);
    assert.equal(v.loops, false);
  }
});

test("tautan yang tidak dikenali ditolak", () => {
  for (const bad of [
    "",
    null,
    "bukan url",
    "https://vt.tiktok.com/ZSabc123/",
    "https://www.youtube.com/watch?v=short",
    "https://www.facebook.com/dragonetdiversrajaampat",
    "https://example.com/watch?v=dQw4w9WgXcQ",
    "javascript:alert(1)",
  ]) {
    assert.equal(parseVideoUrl(bad), null, String(bad));
  }
});
