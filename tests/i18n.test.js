import { test } from "node:test";
import assert from "node:assert/strict";
import { faqs } from "../src/content/faq.js";
import { ui } from "../src/content/ui.js";
import { alternates, chooseLangHref, format, isLocale, languageChoice, localeHref, localeRoute, pathIn } from "../src/lib/i18n.js";
import { arah, describeWeather, LABELS_ID, seaState, translateLabel } from "../src/lib/sea-conditions.js";

test("tautan English tetap, tautan Indonesia diberi awalan /id", () => {
  assert.equal(localeHref("en", "/services/fun-dives"), "/services/fun-dives");
  assert.equal(localeHref("id", "/"), "/id");
  assert.equal(localeHref("id", "/#faq"), "/id#faq");
  assert.equal(localeHref("id", "/services/snorkeling"), "/id/services/snorkeling");
  assert.equal(localeHref("id", "/services/snorkeling?x=1#top"), "/id/services/snorkeling?x=1#top");
  // Tautan luar, mailto, dan //host tidak disentuh.
  for (const href of ["https://wa.me/62", "mailto:halo@dragonetdiversrajaampat.com", "//cdn.example/x", "#faq"]) {
    assert.equal(localeHref("id", href), href);
  }
  assert.deepEqual(alternates("/services/dusk-dives"), {
    en: "/services/dusk-dives",
    id: "/id/services/dusk-dives",
    "zh-Hans": "/zh/services/dusk-dives",
    ko: "/ko/services/dusk-dives",
  });
  assert.equal(localeHref("zh", "/#faq"), "/zh#faq");
  assert.equal(localeHref("ko", "/services/fun-dives"), "/ko/services/fun-dives");
  assert.ok(["en", "id", "zh", "ko"].every(isLocale) && !isLocale("fr"));
});

test("proxy: English di akar, /id diteruskan, /en dialihkan", () => {
  assert.deepEqual(localeRoute("/"), { rewrite: "/en" });
  assert.deepEqual(localeRoute("/services/fun-dives"), { rewrite: "/en/services/fun-dives" });
  assert.deepEqual(localeRoute("/id"), {});
  assert.deepEqual(localeRoute("/id/services/fun-dives"), {});
  assert.deepEqual(localeRoute("/zh"), {});
  assert.deepEqual(localeRoute("/ko/services/fun-dives"), {});
  assert.deepEqual(localeRoute("/zhx"), { rewrite: "/en/zhx" });
  assert.deepEqual(localeRoute("/en"), { redirect: "/" });
  assert.deepEqual(localeRoute("/en/services/fun-dives"), { redirect: "/services/fun-dives" });
  // Bukan awalan bahasa: /english, /idx tetap ditulis ulang ke English (lalu 404 bila tidak ada).
  assert.deepEqual(localeRoute("/idx"), { rewrite: "/en/idx" });
  assert.deepEqual(localeRoute("/english"), { rewrite: "/en/english" });
});

test("pilihan bahasa diingat: tombol EN / ID, lalu alamat bahasa lain dialihkan", () => {
  assert.equal(pathIn("en", "/id/services/fun-dives"), "/services/fun-dives");
  assert.equal(pathIn("en", "/id"), "/");
  assert.equal(pathIn("id", "/"), "/id");
  assert.equal(pathIn("id", "/order/DD-261024-ABCDE"), "/id/order/DD-261024-ABCDE");
  assert.equal(pathIn("ko", "/zh/services/fun-dives"), "/ko/services/fun-dives");
  assert.equal(pathIn("en", "/ko"), "/");
  assert.equal(pathIn("zh", "/id/order/DD-1?t=x"), "/zh/order/DD-1?t=x");
  assert.equal(chooseLangHref("zh", "/services/fun-dives"), "/zh/services/fun-dives?lang=zh");
  assert.equal(chooseLangHref("en", "/services/fun-dives"), "/services/fun-dives?lang=en");
  assert.equal(chooseLangHref("id", "/"), "/id?lang=id");
  assert.equal(chooseLangHref("id", "/order/DD-261024-ABCDE?t=abc"), "/id/order/DD-261024-ABCDE?t=abc&lang=id");
  assert.equal(chooseLangHref("id", "/#faq"), "/id?lang=id#faq");
  // Tombol bahasa: cookie diisi, alamat dalam bahasa itu.
  assert.deepEqual(languageChoice("/id/services/fun-dives", { param: "en" }), { remember: "en", redirect: "/services/fun-dives" });
  assert.deepEqual(languageChoice("/", { param: "id", cookie: "en" }), { remember: "id", redirect: "/id" });
  // Sudah memilih English: tautan /id dibawa ke English, dan sebaliknya.
  assert.deepEqual(languageChoice("/id/services/fun-dives", { cookie: "en" }), { redirect: "/services/fun-dives" });
  assert.deepEqual(languageChoice("/services/fun-dives", { cookie: "id" }), { redirect: "/id/services/fun-dives" });
  assert.deepEqual(languageChoice("/id", { cookie: "ko" }), { redirect: "/ko" });
  assert.deepEqual(languageChoice("/ko/services/fun-dives", { param: "zh" }), { remember: "zh", redirect: "/zh/services/fun-dives" });
  assert.equal(languageChoice("/zh", { cookie: "zh" }), null);
  // Bahasa sudah cocok, tanpa pilihan, atau isian asing: diteruskan.
  assert.equal(languageChoice("/services/fun-dives", { cookie: "en" }), null);
  assert.equal(languageChoice("/id", { cookie: "id" }), null);
  assert.equal(languageChoice("/id/services/fun-dives", {}), null);
  assert.equal(languageChoice("/", { param: "fr", cookie: "de" }), null);
});

test("format mengisi {nama} dan membiarkan yang tidak dikenal", () => {
  assert.equal(format("Tanya soal {topic}", { topic: "kursus" }), "Tanya soal kursus");
  assert.equal(format("{n} titik", { n: 12 }), "12 titik");
  assert.equal(format("{x} tetap", {}), "{x} tetap");
});

/** Semua jalur kunci objek; larik dibandingkan per indeks. */
function shape(value, path = "") {
  if (Array.isArray(value)) return value.flatMap((item, i) => shape(item, `${path}[${i}]`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, item]) => shape(item, path ? `${path}.${key}` : key));
  return [path];
}

const strings = (value) => (typeof value === "string" ? [value] : Object.values(value ?? {}).flatMap(strings));

test("teks antarmuka en dan id punya kunci yang sama dan tidak kosong", () => {
  assert.deepEqual(shape(ui.id), shape(ui.en));
  for (const lang of ["en", "id"]) {
    for (const text of strings(ui[lang])) assert.ok(text.trim().length > 0, lang);
  }
  // Placeholder {nama} sama di kedua bahasa.
  const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
  const get = (root, path) => path.split(/[.[\]]/).filter(Boolean).reduce((o, key) => o[key], root);
  for (const path of shape(ui.en)) assert.deepEqual(placeholders(get(ui.id, path)), placeholders(get(ui.en, path)), path);
});

test("teks Indonesia benar-benar diterjemahkan", () => {
  for (const key of ["title", "intro", "note"]) assert.notEqual(ui.id.gettingHere[key], ui.en.gettingHere[key], key);
  assert.equal(ui.id.meta.tagline, "Menyelam ke dalam warna.", "tagline Indonesia dari BRANDING.md §1");
  assert.notEqual(ui.id.nav.book, ui.en.nav.book);
});

test("FAQ en dan id berurutan sama, dengan tautan yang sama", () => {
  assert.equal(faqs.id.length, faqs.en.length);
  faqs.en.forEach((item, i) => {
    const other = faqs.id[i];
    assert.equal(other.link?.href, item.link?.href, item.q);
    assert.equal(Boolean(other.rate), Boolean(item.rate), item.q);
    assert.notEqual(other.q, item.q, `belum diterjemahkan: ${item.q}`);
  });
  assert.equal(faqs.en.filter((item) => item.rate).length, 1, "kurs ditampilkan di satu jawaban");
  const text = JSON.stringify(faqs);
  assert.doesNotMatch(text, /Rp\s?\d|\$\s?\d|USD|IDR/, "kurs tidak ditulis tetap di FAQ");
});

test("label cuaca dan gelombang punya padanan Indonesia", () => {
  const labels = new Set();
  for (let code = 0; code <= 99; code++) labels.add(describeWeather(code).label);
  for (const wave of [0, 0.3, 1, 2, 3, 5]) labels.add(seaState(wave));
  labels.delete(null);
  for (const label of labels) assert.ok(LABELS_ID[label], label);
  assert.equal(translateLabel("Slight", "id"), "Rendah");
  assert.equal(translateLabel("Slight", "en"), "Slight");
  assert.equal(translateLabel(null, "id"), null);
});

test("arah delapan penjuru dalam Bahasa Indonesia", () => {
  assert.equal(arah(0), "utara");
  assert.equal(arah(44), "timur laut");
  assert.equal(arah(135), "tenggara");
  assert.equal(arah(225), "barat daya");
  assert.equal(arah(-45), "barat laut");
  assert.equal(arah(359), "utara");
  assert.equal(arah(null), null);
});
