import { test } from "node:test";
import assert from "node:assert/strict";
import { courseBySlug, courses, coursesIn } from "../src/content/courses.js";
import { COURSE_SLUGS, COURSES_SERVICE, coursePath, isCourseSlug } from "../src/lib/course-slugs.js";
import { serviceBySlug } from "../src/lib/services.js";

// Kursus selam SSI dari dokumen pemilik (16 November 2026): lima kursus, masing-masing punya halaman sendiri di
// bawah /services/dive-courses, dalam English, Indonesia, Mandarin, dan Korea.
const LANGS = ["en", "id", "zh", "ko"];

function shape(value) {
  if (typeof value === "string") return "s";
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, shape(value[key])]));
  return typeof value;
}

const texts = (value, out = []) => {
  if (typeof value === "string") out.push(value);
  else if (value && typeof value === "object") Object.values(value).forEach((v) => texts(v, out));
  return out;
};

test("lima kursus urut seperti daftar pemilik, di bawah layanan Kursus selam", () => {
  assert.deepEqual(
    courses.map((c) => c.slug),
    ["open-water-diver", "advanced-open-water-diver", "react-right", "diver-stress-and-rescue", "divemaster"],
  );
  assert.deepEqual(COURSE_SLUGS, courses.map((c) => c.slug));
  assert.ok(serviceBySlug(COURSES_SERVICE));
  assert.equal(coursePath("react-right"), "/services/dive-courses/react-right");
  assert.ok(isCourseSlug("divemaster"));
  assert.equal(isCourseSlug("fun-dives"), false);
  assert.deepEqual(courses.map((c) => c.minAge), [10, 12, 12, 12, 18]);
});

test("setiap bahasa lengkap dan bentuknya sama dengan English", () => {
  for (const course of courses) {
    const en = course.en;
    assert.ok(en.name && en.short && en.level && en.tagline && en.summary && en.certification, course.slug);
    assert.ok(en.intro.length && en.facts.length && en.learn.length && en.structure.length, course.slug);
    for (const lang of LANGS) {
      assert.ok(course[lang], `${course.slug} ${lang}`);
      assert.deepEqual(shape(course[lang]), shape(en), `${course.slug} ${lang}`);
      for (const text of texts(course[lang])) assert.ok(text.trim(), `${course.slug} ${lang} teks kosong`);
    }
  }
});

test("teks tampil tanpa titik dua, titik koma, dan tanda pisah panjang (aturan pemilik)", () => {
  const bad = courses.flatMap((course) => LANGS.flatMap((lang) => texts(course[lang]).filter((t) => /[:;—–：；]/.test(t))));
  assert.deepEqual(bad, []);
});

test("fakta dari dokumen pemilik tetap sama di keempat bahasa", () => {
  const digits = (course, lang) => course[lang].facts.map(([, value]) => (value.match(/\d+/g) ?? []).join(" "));
  for (const course of courses) {
    for (const lang of ["id", "zh", "ko"]) assert.deepEqual(digits(course, lang), digits(course, "en"), `${course.slug} ${lang}`);
  }
  assert.match(courseBySlug("open-water-diver").facts.find(([label]) => label === "Maximum depth")[1], /18 meters/);
  assert.match(courseBySlug("divemaster").certification, /60 logged open water dives/);
});

test("courseBySlug dan coursesIn memakai bahasa yang diminta, bahasa asing jatuh ke English", () => {
  assert.equal(courseBySlug("divemaster", "ko").short, "다이브마스터");
  assert.equal(courseBySlug("divemaster", "xx").short, "Divemaster");
  assert.equal(courseBySlug("tidak-ada"), null);
  assert.equal(coursesIn("zh")[0].minAge, 10);
  assert.equal(coursesIn("id").length, 5);
});
