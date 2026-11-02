import { test } from "node:test";
import assert from "node:assert/strict";
import { byteRange, CLIP_CHUNK, CLIP_MAX, CLIP_PART, clipAdvice, ClipError, cleanClipInfo, isClipId, partCount, partSize, partsOf } from "../src/lib/clips.js";

test("bagian klip: 1 MiB per bagian, bagian terakhir sisanya", () => {
  assert.equal(partCount(1), 1);
  assert.equal(partCount(CLIP_PART), 1);
  assert.equal(partCount(CLIP_PART + 1), 2);
  const bytes = CLIP_PART * 3 + 123;
  assert.equal(partCount(bytes), 4);
  assert.deepEqual([0, 1, 2, 3].map((i) => partSize(bytes, i)), [CLIP_PART, CLIP_PART, CLIP_PART, 123]);
  assert.equal(partSize(bytes, 4), 0, "di luar jumlah bagian");
  assert.equal(partSize(bytes, -1), 0);
  assert.equal(partSize(bytes, 1.5), 0);
  assert.equal(partSize(CLIP_PART * 2, 1), CLIP_PART, "file pas kelipatan");
});

test("data klip dari admin: jenis, ukuran, dan angka dibersihkan", () => {
  const ok = cleanClipInfo({ name: "Dugong\u0007.mp4", mime: "video/MP4", bytes: 5_000_000, width: "1080", height: 1920.4, duration: 24.567 });
  assert.deepEqual(ok, { name: "Dugong.mp4", mime: "video/mp4", bytes: 5_000_000, width: 1080, height: 1920, duration: 24.57 });
  assert.equal(cleanClipInfo({ mime: "video/webm", bytes: 10, width: -1, duration: "x" }).width, null);
  assert.equal(cleanClipInfo({ mime: "video/quicktime", bytes: 10 }).name, "video");
  assert.throws(() => cleanClipInfo({ mime: "image/gif", bytes: 10 }), ClipError);
  assert.throws(() => cleanClipInfo({ mime: "video/mp4", bytes: 0 }), ClipError);
  assert.throws(() => cleanClipInfo({ mime: "video/mp4", bytes: CLIP_MAX + 1 }), /maksimal 40 MB/);
  assert.throws(() => cleanClipInfo(null), ClipError);
  assert.ok(isClipId("0123456789abcdef01234567"));
  assert.ok(!isClipId("0123456789abcdef0123456"));
  assert.ok(!isClipId("../../etc/passwd"));
});

test("saran klip: MOV, berat, panjang, buram, atau pas", () => {
  assert.deepEqual(clipAdvice({ mime: "video/mp4", bytes: 8 * CLIP_PART, duration: 20, width: 1080, height: 1920 }).map((n) => n.level), ["good"]);
  const heavy = clipAdvice({ mime: "video/quicktime", bytes: 30 * CLIP_PART, duration: 90, width: 480, height: 360 });
  assert.deepEqual(heavy.map((n) => n.level), ["fair", "fair", "fair", "bad"]);
  for (const note of heavy) assert.ok(!/[:;—]/.test(note.message), note.message);
});

test("Range: rentang biasa, terbuka (dibatasi), akhiran, dan di luar file", () => {
  const size = 10 * CLIP_PART;
  assert.deepEqual(byteRange(null, size), { start: 0, end: size - 1, partial: false });
  assert.deepEqual(byteRange("bytes=0-1", size), { start: 0, end: 1, partial: true }, "Safari meminta 2 byte dulu");
  assert.deepEqual(byteRange("bytes=0-", size), { start: 0, end: CLIP_CHUNK - 1, partial: true });
  assert.deepEqual(byteRange("bytes=100-", 500), { start: 100, end: 499, partial: true });
  assert.deepEqual(byteRange("bytes=5-999999", 500), { start: 5, end: 499, partial: true });
  assert.deepEqual(byteRange("bytes=-100", 500), { start: 400, end: 499, partial: true });
  assert.deepEqual(byteRange("bytes=-1000", 500), { start: 0, end: 499, partial: true });
  assert.equal(byteRange("bytes=500-", 500), null);
  assert.equal(byteRange("bytes=9-3", 500), null);
  assert.equal(byteRange("bytes=-0", 500), null);
  assert.deepEqual(byteRange("bytes=0-1,5-9", 500), { start: 0, end: 499, partial: false }, "beberapa rentang: kirim utuh");
  assert.deepEqual(byteRange("items=0-1", 500), { start: 0, end: 499, partial: false });
});

test("bagian yang dibaca untuk satu rentang", () => {
  assert.deepEqual(partsOf(0, 1), { first: 0, last: 0 });
  assert.deepEqual(partsOf(CLIP_PART - 1, CLIP_PART), { first: 0, last: 1 });
  assert.deepEqual(partsOf(3 * CLIP_PART + 5, 7 * CLIP_PART - 1), { first: 3, last: 6 });
});
