# Peta Raja Ampat (bersama DAMPIER dan Zanclus)

Komponen peta interaktif dari skill **peta-raja-ampat** milik pemilik. Sumber kebenaran datanya adalah repo DAMPIER (`yudventure/dampier_system`). Salinan ini diambil dari situs Zanclus (`yudventure/zanclusdive`, `src/components/peta-raja-ampat/`), versi yang sudah punya baris pilihan wilayah yang bisa digeser di ponsel dan tombol "Back to the full map".

Di Dragonet peta dipakai oleh `src/components/DiveSiteMap.jsx` (beranda, di antara layanan dan kursus):

- Hanya titik selam & snorkel (`jenis: "selam"`, 15 titik) dan hanya wilayah yang punya titik. Logikanya di `src/lib/dive-map.js`, diuji `tests/dive-map.test.js`.
- Kotak zoom tiap wilayah diperlebar sampai semua titiknya masuk (Arborek: Manta Sandy dan Manta Ridge).
- Tema warna `.peta-dragonet` di `app/globals.css`.

## Yang diubah dari data bersama

- `data/tata.json`: warna jenis `selam` diganti dari `#1FA39E` ke Oranye Mandarin `#EB7817`. Ikon dan teks di atasnya Abyss (lihat `.peta-dragonet` di `app/globals.css`), karena teks putih di atas oranye dilarang.

Kalau folder `data/` disalin ulang dari DAMPIER atau Zanclus, ulangi perubahan warna itu. `tests/dive-map.test.js` akan gagal kalau terlupa.

## Aturan

- Atribusi "© OpenStreetMap contributors, GSHHG" wajib tampil di peta (ODbL dan LGPL). Garis pantai hanya dari paket npm `@geo-maps/earth-lands-10m` dan PyPI `basemap-data-hires`.
- Letak titik adalah perkiraan (`perkiraan: true`). Nama titik baru harus bisa dipastikan dari sumber umum.
- Teks tampil di peta tanpa titik dua, titik koma, dan tanda pisah panjang. `logika.test.js` memeriksa data bawaan, `tests/dive-map.test.js` memeriksa teks yang ditimpa Dragonet.
- Uji logika: `node --test src/components/peta-raja-ampat/logika.test.js` (ikut `npm test`).
