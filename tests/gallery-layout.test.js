import { test } from "node:test";
import assert from "node:assert/strict";
import { arrangeGallery, MOSAIC, mosaicSize, tileOf } from "../src/lib/gallery-layout.js";
import { tileFor } from "../src/lib/media-guide.js";

const SPAN = { small: [1, 1], wide: [2, 1], tall: [1, 2], big: [2, 2] };

/** Penempatan grid-auto-flow: dense seperti di peramban: { cells: [[col,row]] per item, rows, holes }. */
function dense(sizes, columns) {
  const taken = new Set();
  const free = (c, r, w, h) => {
    if (c + w > columns) return false;
    for (let x = c; x < c + w; x++) for (let y = r; y < r + h; y++) if (taken.has(`${x},${y}`)) return false;
    return true;
  };
  const cells = sizes.map((size) => {
    const [w, h] = SPAN[size].map((n) => Math.min(n, columns));
    for (let r = 0; ; r++) {
      for (let c = 0; c < columns; c++) {
        if (!free(c, r, w, h)) continue;
        for (let x = c; x < c + w; x++) for (let y = r; y < r + h; y++) taken.add(`${x},${y}`);
        return [c, r];
      }
    }
  });
  const rows = Math.max(...[...taken].map((k) => Number(k.split(",")[1]))) + 1;
  return { cells, rows, holes: rows * columns - taken.size };
}

test("pola mosaik sama dengan contoh pemilik", () => {
  const photos = Array.from({ length: 15 }, () => ({ type: "photo" }));
  const sizes = arrangeGallery(photos).map((item) => item.size);
  assert.deepEqual(sizes.slice(0, 12), MOSAIC);
  // Contoh: besar kiri atas, dua kecil, tinggi di kolom 3, ... besar kiri, tinggi kolom 3, dua kecil kolom 4.
  const { cells } = dense(sizes, 4);
  assert.deepEqual(cells.slice(0, 12), [[0, 0], [2, 0], [3, 0], [2, 1], [3, 1], [0, 2], [1, 2], [3, 2], [0, 3], [2, 3], [3, 3], [3, 4]]);
  assert.deepEqual(cells.slice(12), [[0, 5], [2, 5], [3, 5]], "foto ke-13 sampai 15 mulai pola lagi");
});

test("setiap 12 foto mengisi persegi rapi tanpa lubang, di layar lebar dan ponsel", () => {
  for (const n of [12, 24, 36]) {
    const sizes = arrangeGallery(Array.from({ length: n }, () => ({ type: "photo" }))).map((i) => i.size);
    const wide = dense(sizes, 4);
    assert.equal(wide.holes, 0, `${n} foto, 4 kolom`);
    assert.equal(wide.rows, (n / 12) * 5);
    assert.equal(dense(sizes, 2).holes, 0, `${n} foto, 2 kolom`);
  }
});

test("ukuran pilihan tim dipakai, video menyesuaikan arah", () => {
  assert.equal(tileOf({ type: "photo", size: "wide" }, 0), "wide");
  assert.equal(tileOf({ type: "photo", size: "auto" }, 0), "big");
  assert.equal(tileOf({ type: "embed", vertical: true }, 1), "tall");
  assert.equal(tileOf({ type: "embed", vertical: false }, 0), "big");
  assert.equal(tileOf({ type: "embed", vertical: false }, 1), "wide");
  assert.equal(mosaicSize(12), "big");
  assert.equal(tileFor("auto", { position: 3 }), "tall", "admin melihat petak mosaiknya");
  assert.equal(tileFor("auto"), "small", "tanpa posisi tetap kecil");
});

test("keterangan tampil di foto hanya bila unik", () => {
  const items = arrangeGallery([
    { type: "photo", alt: "Hiu karang di Cape Kri" },
    { type: "photo", alt: "Raja Ampat bersama Dragonet Divers" },
    { type: "photo", alt: "Raja Ampat bersama Dragonet Divers" },
    { type: "embed", alt: "Video" },
  ]);
  assert.deepEqual(
    items.map((i) => i.caption),
    ["Hiu karang di Cape Kri", null, null, null],
  );
});
