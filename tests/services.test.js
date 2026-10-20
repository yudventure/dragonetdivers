import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { serviceBySlug, services } from "../src/lib/services.js";

test("setiap layanan punya slug unik, ilustrasi, dan isi halaman detail", () => {
  const slugs = services.map((s) => s.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const s of services) {
    assert.match(s.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, s.slug);
    assert.ok(existsSync(new URL(`../src/assets/services/${s.slug}.webp`, import.meta.url)), `ilustrasi ${s.slug}`);
    assert.equal(s.chips.length, 2, s.slug);
    assert.ok(s.title && s.summary && s.forWho && s.ask, s.slug);
    assert.ok(s.intro.length > 0 && s.goodToKnow.length > 0, s.slug);
  }
  assert.equal(serviceBySlug("fun-dives").title, "Fun dives");
  assert.equal(serviceBySlug("tidak-ada"), null);
});

// CLAUDE.md: jangan menulis harga atau jadwal yang belum diberikan pemilik.
test("teks layanan tanpa harga atau jam/jadwal", () => {
  const text = JSON.stringify(services);
  assert.doesNotMatch(text, /IDR|Rp\s?\d|\$\s?\d|USD|EUR|€/);
  assert.doesNotMatch(text, /\b\d{1,2}[:.]\d{2}\b|\b\d{1,2}\s?(am|pm)\b/i);
});
