import { test } from "node:test";
import assert from "node:assert/strict";
import { channelLookup } from "../src/lib/channel-cache.js";

const CHANNEL = "https://www.youtube.com/@thedampier";

test("kanal YouTube dicari sekali, diingat sehari, dan dipakai semua video yang sama", async () => {
  let clock = 0;
  const asked = [];
  const channels = channelLookup({
    now: () => clock,
    fetchJson: async (id) => {
      asked.push(id);
      return { author_url: CHANNEL };
    },
  });
  assert.deepEqual(await channels(["abcDEF12345", "abcDEF12345", "xyzXYZ98765"]), { abcDEF12345: CHANNEL, xyzXYZ98765: CHANNEL });
  assert.deepEqual(asked, ["abcDEF12345", "xyzXYZ98765"]);
  clock += 60 * 60 * 1000;
  await channels(["abcDEF12345"]);
  assert.equal(asked.length, 2, "masih diingat");
  clock += 24 * 60 * 60 * 1000;
  await channels(["abcDEF12345"]);
  assert.equal(asked.length, 3, "setelah sehari dicari lagi");
});

test("oEmbed gagal: null (petak menuju halaman video), dicoba lagi 10 menit kemudian, kanal lama tetap dipakai", async () => {
  let clock = 0;
  let fail = true;
  const errors = [];
  const channels = channelLookup({
    now: () => clock,
    fetchJson: async () => {
      if (fail) throw new Error("HTTP 404");
      return { author_url: CHANNEL };
    },
    onError: (id) => errors.push(id),
  });
  assert.deepEqual(await channels(["abcDEF12345"]), { abcDEF12345: null });
  assert.deepEqual(errors, ["abcDEF12345"]);
  fail = false;
  assert.deepEqual(await channels(["abcDEF12345"]), { abcDEF12345: null }, "belum 10 menit");
  clock += 11 * 60 * 1000;
  assert.deepEqual(await channels(["abcDEF12345"]), { abcDEF12345: CHANNEL });
  fail = true;
  clock += 25 * 60 * 60 * 1000;
  assert.deepEqual(await channels(["abcDEF12345"]), { abcDEF12345: CHANNEL }, "kanal lama tetap dipakai saat gagal");
});

test("YouTube lambat: render tidak menunggu lebih dari waitMs, jawabannya dipakai permintaan berikutnya", async () => {
  let release;
  const channels = channelLookup({ waitMs: 20, fetchJson: () => new Promise((resolve) => (release = () => resolve({ author_url: CHANNEL }))) });
  const started = Date.now();
  assert.deepEqual(await channels(["abcDEF12345"]), { abcDEF12345: null });
  assert.ok(Date.now() - started < 500);
  release();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(await channels(["abcDEF12345"]), { abcDEF12345: CHANNEL });
});
