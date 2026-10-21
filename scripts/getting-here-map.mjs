// Membuat public/media/getting-here-map.svg: potongan garis pantai peta Raja Ampat bersama
// (src/components/peta-raja-ampat/data/garis-pantai.json, © kontributor OpenStreetMap, GSHHG)
// dari Waisai sampai Mansuar, untuk peta rute seksi "How to get here" (src/components/GettingHere.jsx).
// Jalankan ulang bila data garis pantai atau CROP di src/lib/getting-here.js berubah:
//   node scripts/getting-here-map.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { CROP, MAP_ISLANDS } from "../src/lib/getting-here.js";

const root = new URL("../", import.meta.url);
const garis = JSON.parse(readFileSync(new URL("src/components/peta-raja-ampat/data/garis-pantai.json", root), "utf8"));
const [x, y, w, h] = CROP;
// Warna dari brand/tokens.json: darat Teal, karang dangkal Laguna muda (sama dengan tema .peta-dragonet).
// Data memakai perintah absolut M, Q, Z. Hanya subpath yang menyentuh potongan (plus 8 satuan) yang
// disimpan, supaya pulau kecil di luar peta rute tidak ikut membesarkan berkas.
const touches = (sub) => {
  const n = sub.match(/-?\d+(?:\.\d+)?/g).map(Number);
  for (let i = 0; i < n.length; i += 2) {
    if (n[i] > x - 8 && n[i] < x + w + 8 && n[i + 1] > y - 8 && n[i + 1] < y + h + 8) return true;
  }
  return false;
};
const paths = MAP_ISLANDS.map((id) => garis.pulau[id].d.match(/M[^M]*/g).filter(touches).join("")).filter(Boolean);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w * 2}" height="${h * 2}">
<defs>${paths.map((d, i) => `<path id="p${i}" d="${d}"/>`).join("")}</defs>
<g fill="none" stroke="#9DD1DC" stroke-width="2.4" stroke-linejoin="round">${paths.map((_, i) => `<use href="#p${i}"/>`).join("")}</g>
<g fill="#146E7F" fill-rule="evenodd">${paths.map((_, i) => `<use href="#p${i}"/>`).join("")}</g>
</svg>
`;
writeFileSync(new URL("public/media/getting-here-map.svg", root), svg);
console.log(`getting-here-map.svg ${(svg.length / 1024).toFixed(1)} KB`);
