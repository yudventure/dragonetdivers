import { test } from "node:test";
import assert from "node:assert/strict";
import { isTikTokOrigin, isTikTokPlaying, parseVideoUrl, readTikTokEvent, tiktokCommand, tiktokReaction } from "../src/lib/video-embed.js";

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
});

test("TikTok memakai Embed Player v1 dengan autoplay dan loop, cadangannya dengan tombol", () => {
  const v = parseVideoUrl("https://www.tiktok.com/@dragonetdivers/video/7312345678901234567?is_from_webapp=1");
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
  assert.equal(v.href, "https://www.tiktok.com/@dragonetdivers/video/7312345678901234567");
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
    ["https://www.facebook.com/dragonetdivers/videos/1234567890123456/", "1234567890123456", false],
    ["https://www.facebook.com/dragonetdivers/videos/manta-dive/1234567890123456", "1234567890123456", false],
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
    "https://www.facebook.com/dragonetdivers",
    "https://example.com/watch?v=dQw4w9WgXcQ",
    "javascript:alert(1)",
  ]) {
    assert.equal(parseVideoUrl(bad), null, String(bad));
  }
});
