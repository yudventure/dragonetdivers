import { test } from "node:test";
import assert from "node:assert/strict";
import { faqs } from "../src/content/faq.js";
import { maintenanceText } from "../src/content/maintenance.js";
import { orderMailText } from "../src/content/order-mail.js";
import { ui } from "../src/content/ui.js";
import { mapText } from "../src/lib/dive-map.js";
import { steps } from "../src/lib/getting-here.js";
import { arah, LABELS_ID, seaWords, translateLabel } from "../src/lib/sea-conditions.js";
import { services } from "../src/lib/services.js";

// Bahasa Mandarin (zh) dan Korea (ko) ada di src/content/locales/ dan disambungkan ke modul teks yang sama
// dengan English dan Indonesia. Bentuknya harus sama persis dengan English: kunci, urutan larik,
// placeholder {nama}, dan tautan; setiap teks terisi dan sungguh diterjemahkan.
const LANGS = ["zh", "ko"];
const holes = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

function same(en, other, path, problems) {
  if (typeof en === "string") {
    if (typeof other !== "string" || !other.trim()) problems.push(`${path} kosong`);
    else if (holes(en) !== holes(other)) problems.push(`${path} placeholder {${holes(other)}} ≠ {${holes(en)}}`);
    return;
  }
  if (Array.isArray(en)) {
    if (!Array.isArray(other) || other.length !== en.length) return problems.push(`${path} harus ${en.length} isi`);
    return en.forEach((item, i) => same(item, other[i], `${path}[${i}]`, problems));
  }
  if (en && typeof en === "object") {
    if (!other || typeof other !== "object") return problems.push(`${path} tidak ada`);
    for (const key of new Set([...Object.keys(en), ...Object.keys(other)])) {
      if (!(key in en)) problems.push(`${path}.${key} tidak dikenal`);
      else if (!(key in other)) problems.push(`${path}.${key} tidak ada`);
      else if (key === "href") {
        if (en.href !== other.href) problems.push(`${path}.href berbeda`);
      } else same(en[key], other[key], `${path}.${key}`, problems);
    }
    return;
  }
  if (en !== other) problems.push(`${path} harus ${JSON.stringify(en)}`);
}

const SOURCES = {
  ui: (lang) => [ui.en, ui[lang]],
  faq: (lang) => [faqs.en, faqs[lang]],
  steps: (lang) => [steps.en, steps[lang]],
  maintenance: (lang) => [{ ...maintenanceText.en, language: "English" }, maintenanceText[lang]],
  orderMail: (lang) => [orderMailText.en, orderMailText[lang]],
  diveMap: (lang) => [mapText.en, mapText[lang]],
  services: (lang) => [Object.fromEntries(services.map((s) => [s.slug, s.en])), Object.fromEntries(services.map((s) => [s.slug, s[lang]]))],
};

for (const lang of LANGS) {
  test(`${lang}: semua teks lengkap dan bentuknya sama dengan English`, () => {
    const problems = [];
    for (const [name, pick] of Object.entries(SOURCES)) {
      const [en, other] = pick(lang);
      same(en, other, `${lang}.${name}`, problems);
    }
    assert.deepEqual(problems, []);
  });

  test(`${lang}: teks benar-benar diterjemahkan, tanpa titik dua atau titik koma di kalimat`, () => {
    assert.notEqual(ui[lang].nav.book, ui.en.nav.book);
    assert.notEqual(ui[lang].meta.description, ui.en.meta.description);
    assert.equal(maintenanceText[lang].language, "English", "tautan halaman perawatan ke English");
    const texts = [];
    const walk = (v) => (typeof v === "string" ? texts.push(v) : v && typeof v === "object" && Object.values(v).forEach(walk));
    walk([ui[lang], faqs[lang], steps[lang], orderMailText[lang], mapText[lang], services.map((s) => s[lang])]);
    const local = texts.filter((t) => /[぀-ヿ㐀-鿿가-힯]/.test(t)).length / texts.length;
    assert.ok(local > 0.8, `sebagian besar teks memakai aksara ${lang} (${Math.round(local * 100)}%)`);
    const bad = texts.filter((t) => /[；：]|——/.test(t));
    assert.deepEqual(bad, []);
  });

  test(`${lang}: label cuaca, gelombang, dan arah angin`, () => {
    for (const label of Object.keys(LABELS_ID)) {
      const translated = translateLabel(label, lang);
      assert.ok(translated && translated !== label, `${lang} ${label}`);
    }
    const names = new Set([0, 45, 90, 135, 180, 225, 270, 315].map((d) => arah(d, lang)));
    assert.equal(names.size, 8);
    assert.equal(arah(359, lang), arah(0, lang));
    // Panel kondisi laut menerima kata-kata bahasanya saja dari server (seaWords).
    const words = seaWords(lang);
    assert.equal(words.labels.Calm, translateLabel("Calm", lang));
    assert.equal(words.compass[2], arah(90, lang));
  });
}

test("galeri bawaan punya teks alt atau judul dalam empat bahasa", async () => {
  // gallery.js mengimpor gambar (khusus bundler), jadi bentuknya dicek dari sumbernya.
  const { readFileSync } = await import("node:fs");
  const source = readFileSync(new URL("../src/content/gallery.js", import.meta.url), "utf8");
  assert.match(source, /zh: zhPack\.gallery\[i\], ko: koPack\.gallery\[i\]/);
  const zh = await import("../src/content/locales/zh.js");
  const ko = await import("../src/content/locales/ko.js");
  const items = (source.match(/^ {4}type: "/gm) || []).length;
  assert.equal(zh.gallery.length, items);
  assert.equal(ko.gallery.length, items);
});

test("panel kondisi laut: English tanpa terjemahan, Indonesia delapan penjuru", () => {
  assert.equal(seaWords("en"), null);
  assert.equal(seaWords("id").labels.Calm, LABELS_ID.Calm);
  assert.equal(seaWords("id").compass[0], arah(0));
});
