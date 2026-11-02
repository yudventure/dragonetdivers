// Uji teks bawaan formulir selam (teks.json dan perjanjian.json). Ditulis tangan, tidak ditimpa ekspor-aset.mjs.
// Jalankan bersama uji logika: node --test waiver.test.js aset.test.js
// Situs yang menambah bahasa (DAMPIER: ru) cukup menambahkannya ke teks.json, uji ini memeriksa bentuknya.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { agreementBlocks, BOXES, MEDICAL } from "./waiver.js";

const load = (name) => JSON.parse(readFileSync(new URL(name, import.meta.url), "utf8"));
const teks = load("./teks.json");
const perjanjian = load("./perjanjian.json");

const holes = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

/** Perbedaan bentuk antara teks English dan bahasa lain: kunci, panjang daftar, placeholder, teks kosong. */
function differences(en, other, path = "") {
  if (typeof en === "string") {
    if (typeof other !== "string" || !other.trim()) return [`${path} kosong`];
    return holes(en) === holes(other) ? [] : [`${path} placeholder {${holes(other)}} beda dengan {${holes(en)}}`];
  }
  if (Array.isArray(en)) {
    if (!Array.isArray(other) || other.length !== en.length) return [`${path} panjang daftar beda`];
    return en.flatMap((item, i) => differences(item, other[i], `${path}[${i}]`));
  }
  const keys = new Set([...Object.keys(en), ...Object.keys(other ?? {})]);
  return [...keys].flatMap((key) => (key in en && other && key in other ? differences(en[key], other[key], `${path}.${key}`) : [`${path}.${key} tidak ada di salah satu bahasa`]));
}

const strings = (value) => (typeof value === "string" ? [value] : Object.values(value ?? {}).flatMap(strings));

test("teks formulir: semua bahasa berbentuk sama dengan English", () => {
  assert.ok(teks.en && teks.id, "en dan id wajib ada");
  for (const lang of Object.keys(teks).filter((l) => l !== "en")) {
    assert.deepEqual(differences(teks.en, teks[lang]), [], lang);
  }
});

test("teks formulir: kuesioner medis cocok dengan logika (10 pertanyaan, kotak A sampai G)", () => {
  for (const [lang, t] of Object.entries(teks)) {
    const { questions, boxes, boxIntro } = t.waiver.medical;
    assert.equal(questions.length, MEDICAL.length, lang);
    for (const [box, count] of Object.entries(BOXES)) {
      assert.equal(boxes[box]?.length, count, `${lang} kotak ${box}`);
      assert.ok(boxIntro[box], `${lang} pembuka kotak ${box}`);
    }
  }
});

test("teks formulir: tanpa titik dua, titik koma, dan tanda pisah panjang (aturan pemilik)", () => {
  for (const [lang, t] of Object.entries(teks)) {
    for (const text of strings(t)) {
      const plain = text.replace(/\{\w+\}/g, "").replace(/https?:\/\/\S+/g, "");
      assert.ok(!/[:;：；—]/.test(plain), `${lang} "${text}"`);
    }
  }
});

test("perjanjian: bagian 1 sampai 7, semua bahasa berbentuk sama dengan English, nama operator sebagai {operator}", () => {
  const en = agreementBlocks(perjanjian.en);
  const numbers = (blocks) => blocks.filter((b) => b.heading).map((b) => b.text.split(".")[0]);
  assert.deepEqual(numbers(en), ["1", "2", "3", "4", "5", "6", "7"]);
  assert.ok(perjanjian.en.startsWith("{operator} hosts Activities"));
  for (const lang of Object.keys(perjanjian).filter((l) => l !== "en")) {
    const blocks = agreementBlocks(perjanjian[lang]);
    assert.deepEqual(blocks.map((b) => b.heading), en.map((b) => b.heading), lang);
    assert.ok(perjanjian[lang].startsWith("{operator}"), lang);
    assert.ok(!/[;:；：—]/.test(perjanjian[lang].replace(/"[^"]*"/g, "")), `${lang}: tanpa titik dua dan titik koma`);
  }
  assert.ok(!/Dragonet|Turtle/.test(Object.values(perjanjian).join("")));
});
