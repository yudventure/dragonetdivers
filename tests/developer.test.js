import { test } from "node:test";
import assert from "node:assert/strict";
import { maintenanceText } from "../src/content/maintenance.js";
import {
  DEFAULT_DEVELOPER,
  LOCKABLE_PAGES,
  lockCount,
  normalizeDeveloper,
  pageForPath,
  pageLocked,
  retryAfter,
  sectionLocked,
  validateDeveloper,
  visitorLocks,
} from "../src/lib/developer.js";
import { maintenanceHtml, untilLabel } from "../src/lib/maintenance-page.js";
import { services } from "../src/lib/services.js";

const on = (patch) => ({ ...DEFAULT_DEVELOPER, enabled: true, ...patch });

test("pengaturan mode developer dibersihkan dan pilihan asing ditolak", () => {
  const clean = validateDeveloper({
    enabled: true,
    site: "ya",
    pages: ["checkout", "checkout", "fun-dives"],
    sections: ["faq"],
    message: { id: "  Sebentar ya  ", en: "" },
    until: "2026-10-22T18:00",
    extra: "dibuang",
  });
  assert.deepEqual(clean, {
    enabled: true,
    site: false,
    pages: ["checkout", "fun-dives"],
    sections: ["faq"],
    message: { id: "Sebentar ya", en: "" },
    until: "2026-10-22T18:00",
  });
  assert.throws(() => validateDeveloper({ pages: ["admin"] }), /tidak dikenal/);
  assert.throws(() => validateDeveloper({ sections: "faq" }), /tidak valid/);
  assert.throws(() => validateDeveloper({ message: { id: "x".repeat(401) } }), /400/);
  assert.throws(() => validateDeveloper({ until: "besok" }), /tanggal/);
  assert.throws(() => validateDeveloper(null), /tidak valid/);
  // Simpanan rusak atau dari versi lama tetap menghasilkan bentuk lengkap yang aman (mode mati).
  assert.deepEqual(normalizeDeveloper({ pages: ["hilang"] }), DEFAULT_DEVELOPER);
  assert.deepEqual(normalizeDeveloper(null), DEFAULT_DEVELOPER);
  assert.deepEqual(normalizeDeveloper({ enabled: true, sections: ["faq"] }).sections, ["faq"]);
});

test("kunci hanya berlaku untuk pengunjung selama mode developer aktif", () => {
  const settings = on({ pages: ["fun-dives"], sections: ["gallery"] });
  const visitor = visitorLocks(settings);
  assert.ok(pageLocked(visitor, "fun-dives") && !pageLocked(visitor, "home") && !pageLocked(visitor, null));
  assert.ok(sectionLocked(visitor, "gallery") && !sectionLocked(visitor, "faq"));
  // Operator yang masuk melihat semuanya.
  const admin = visitorLocks(settings, true);
  assert.ok(!pageLocked(admin, "fun-dives") && !sectionLocked(admin, "gallery"));
  // Mode mati: pilihan kunci tetap tersimpan tetapi tidak berlaku.
  const off = visitorLocks({ ...settings, enabled: false });
  assert.ok(!pageLocked(off, "fun-dives") && !sectionLocked(off, "gallery"));
  // Seluruh website: halaman apa pun ikut tertutup, termasuk alamat yang tidak ada.
  const site = visitorLocks(on({ site: true }));
  assert.ok(pageLocked(site, "home") && pageLocked(site, "checkout") && pageLocked(site, null));
  assert.equal(lockCount(on({ site: true, pages: ["home"] })), 1);
  assert.equal(lockCount(settings), 2);
  assert.equal(lockCount({ ...settings, enabled: false }), 0);
});

test("alamat dipetakan ke kunci halaman", () => {
  assert.equal(pageForPath("/"), "home");
  assert.equal(pageForPath(""), "home");
  assert.equal(pageForPath("/services/fun-dives"), "fun-dives");
  assert.equal(pageForPath("/services/fun-dives/"), "fun-dives");
  assert.equal(pageForPath("/checkout/12"), "checkout");
  assert.equal(pageForPath("/services/tidak-ada"), null);
  assert.equal(pageForPath("/order/DD-ABC"), null);
  // Setiap halaman layanan bisa ditutup, dan sebaliknya.
  const servicePages = LOCKABLE_PAGES.filter(([, , path]) => path.startsWith("/services/")).map(([key]) => key);
  assert.deepEqual(servicePages.sort(), services.map((s) => s.slug).sort());
  for (const [key, , path] of LOCKABLE_PAGES) assert.equal(pageForPath(path), key);
});

test("Retry-After mengikuti perkiraan selesai dalam WIT, dalam batas wajar", () => {
  const now = Date.parse("2026-10-21T00:00:00Z"); // 09.00 WIT
  assert.equal(retryAfter("", now), 3600);
  assert.equal(retryAfter("2026-10-21T11:00", now), 7200);
  assert.equal(retryAfter("2026-10-21T09:01", now), 300);
  assert.equal(retryAfter("2026-10-30T09:00", now), 86400);
  assert.equal(retryAfter("2026-10-20T09:00", now), 300);
});

test("teks halaman perawatan lengkap di kedua bahasa dan mengikuti aturan tulisan pemilik", () => {
  assert.deepEqual(Object.keys(maintenanceText.en).sort(), Object.keys(maintenanceText.id).sort());
  for (const lang of ["en", "id"]) {
    for (const [key, text] of Object.entries(maintenanceText[lang])) {
      assert.ok(text.trim(), `${lang}.${key} kosong`);
      assert.doesNotMatch(text, /[:;—]/, `${lang}.${key}`);
    }
  }
});

test("halaman perawatan aman, tidak diindeks, dan menautkan bahasa lain", () => {
  const html = maintenanceHtml({ kind: "page", lang: "id", path: "/services/fun-dives", message: "<b>Segera</b> & kembali", until: "2026-10-22T18:00", whatsapp: "6281234", email: "halo@dragonetdivers.com" });
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.match(html, /<html lang="id">/);
  assert.match(html, /&lt;b&gt;Segera&lt;\/b&gt; &amp; kembali/);
  assert.doesNotMatch(html, /<b>Segera/);
  assert.match(html, /href="\/services\/fun-dives\?lang=en"/); // ganti ke English, pilihannya diingat
  assert.match(html, /href="\/id"/); // kembali ke beranda
  assert.match(html, /https:\/\/wa\.me\/6281234/);
  assert.match(html, /22 Oktober 2026/);
  const site = maintenanceHtml({ kind: "site", lang: "en", path: "/" });
  assert.match(site, /We&#39;ll be back soon|We'll be back soon/);
  assert.doesNotMatch(site, /wa\.me|mailto|Back to the homepage|pratinjau/);
  assert.match(maintenanceHtml({ previewExit: "/id?pratinjau=admin" }), /href="\/id\?pratinjau=admin"/);
  assert.equal(untilLabel("", "en"), "");
  assert.equal(untilLabel("bukan-tanggal", "en"), "");
});
