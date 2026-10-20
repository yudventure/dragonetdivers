// Ekspor template media sosial dan tangkapan brand guide ke PNG.
// Pakai: node brand/social/export.mjs   (butuh paket `playwright` + Chromium)
// Hasil: brand/social/preview, brand/social/highlights, brand/preview, brand/logo/*lockup*.png,
//        brand/export/Dragonet-Divers-Brand-Identity.pdf
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const brandDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const types = { ".html": "text/html", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".ico": "image/x-icon" };

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  try {
    const body = await readFile(join(brandDir, path));
    res.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });

  await page.goto(`${base}/social/templates.html`);
  await page.evaluate(() => document.body.classList.add("export"));
  await page.evaluate(() => document.fonts.ready);

  await mkdir(join(brandDir, "social/preview"), { recursive: true });
  await mkdir(join(brandDir, "social/highlights"), { recursive: true });
  for (const id of ["f1-dive-site", "f2-marine-fact", "f3-package", "f4-review", "s1-dive-report", "s2-booking", "h-highlights"]) {
    await page.locator(`#${id}`).screenshot({ path: join(brandDir, `social/preview/${id}.png`) });
  }
  for (const name of ["dive", "snorkel", "trips", "courses", "reviews", "info"]) {
    await page.locator(`#hl-${name}`).screenshot({ path: join(brandDir, `social/highlights/${name}.png`) });
  }

  await mkdir(join(brandDir, "preview"), { recursive: true });
  for (const [name, width] of [["brand-guide-desktop", 1280], ["brand-guide-mobile", 390]]) {
    const guide = await browser.newPage({ viewport: { width, height: 900 } });
    await guide.goto(`${base}/brand-guide.html`);
    await guide.evaluate(() => document.fonts.ready);
    await guide.screenshot({ path: join(brandDir, `preview/${name}.png`), fullPage: true });
    await guide.close();
  }

  // Lockup horizontal (latar transparan) untuk logo kit.
  const lockup = await browser.newPage({ viewport: { width: 1400, height: 800 } });
  await lockup.goto(`${base}/print/lockup.html`);
  await lockup.evaluate(() => document.fonts.ready);
  for (const id of ["lockup-teal", "lockup-white"]) {
    await lockup.locator(`#${id}`).screenshot({ path: join(brandDir, `logo/dragonet-divers-${id}.png`), omitBackground: true });
  }
  await lockup.close();

  // Buku pedoman PDF (A4 landscape).
  await mkdir(join(brandDir, "export"), { recursive: true });
  const book = await browser.newPage();
  await book.goto(`${base}/print/brand-identity.html`, { waitUntil: "networkidle" });
  await book.evaluate(() => document.fonts.ready);
  await book.pdf({ path: join(brandDir, "export/Dragonet-Divers-Brand-Identity.pdf"), width: "297mm", height: "210mm", printBackground: true, preferCSSPageSize: true });
  await book.close();
} finally {
  await browser.close();
  server.close();
}
console.log("Selesai: PNG template, highlight, lockup, dan brand/export/Dragonet-Divers-Brand-Identity.pdf");
