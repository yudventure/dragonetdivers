import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { parseVideoUrl } from "../src/lib/video-embed.js";

// src/content/gallery.js mengimpor gambar .webp yang tidak bisa dibaca Node, jadi isinya diperiksa sebagai teks.
const source = readFileSync(new URL("../src/content/gallery.js", import.meta.url), "utf8")
  .split("\n")
  .filter((line) => !line.trim().startsWith("//"))
  .join("\n");
const values = (key) => [...source.matchAll(new RegExp(`${key}: "([^"]*)"`, "g"))].map((m) => m[1]);

test("setiap tautan video galeri dikenali", () => {
  for (const url of values("url")) assert.ok(parseVideoUrl(url), `tautan tidak dikenali: ${url}`);
});

test("jenis dan ukuran petak galeri valid, berkas yang dirujuk ada", () => {
  // Jenis item ditulis di awal baris; "type" di dalam sources ({ src, type: "video/webm" }) tidak dihitung.
  const types = [...source.matchAll(/^\s*type: "([^"]*)"/gm)].map((m) => m[1]);
  assert.ok(types.length > 0);
  for (const type of types) assert.ok(["photo", "video", "embed"].includes(type), type);
  for (const size of values("size")) assert.ok(["small", "wide", "tall", "big"].includes(size), size);
  for (const src of values("src")) assert.ok(existsSync(new URL(`../public${src}`, import.meta.url)), src);
  for (const [, file] of source.matchAll(/from "\.\.\/assets\/([^"]+)"/g)) {
    assert.ok(existsSync(new URL(`../src/assets/${file}`, import.meta.url)), file);
  }
  for (const alt of values("alt")) assert.ok(alt.length > 10, `alt terlalu pendek: ${alt}`);
});
