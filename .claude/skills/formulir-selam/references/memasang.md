# Memasang formulir selam di situs baru

Panduan ini ditulis untuk DAMPIER (`yudventure/dampier_system`, TypeScript,
empat bahasa id, en, zh, ru) tetapi berlaku untuk situs Next.js mana pun.
Contoh lengkap yang sudah tayang ada di `assets/contoh-dragonet/` (Next.js 16
App Router, JavaScript, React 19, Tailwind 4, MySQL lewat `mysql2`).

## 0. Kenali situs tujuan dulu

Baca CLAUDE.md dan struktur repo situs tujuan sebelum menulis apa pun.
Catat jawabannya, karena setiap langkah di bawah bergantung padanya.

- Database apa (MySQL, Postgres, berkas JSON, layanan lain) dan cara
  menjalankan migrasi.
- Cara situs mengirim email (SMTP, layanan lain, belum ada).
- Sistem bahasa (nama berkas teks, bahasa bawaan, cara memilih bahasa).
- Ada pesanan online atau tidak, bentuk kode pesanannya, layanan mana yang
  termasuk menyelam, dan apakah pesanan punya token rahasia untuk tamu.
- Bentuk panel admin dan cara memeriksa sesi admin di API.
- Aturan desain situs (warna, huruf, tombol utama).
- Apakah situs itu sendiri yang menyelenggarakan penyelaman atau hanya
  perantara bagi mitra. Ini menentukan siapa `{operator}` di perjanjian
  (lihat langkah 3), jadi tanyakan ke pemilik bila tidak jelas.

## 1. Logika murni

Salin `assets/formulir-selam/waiver.js`, `waiver.test.js`, dan
`aset.test.js` ke folder logika situs (DAMPIER misalnya `lib/formulir-selam/`).

- Di TypeScript boleh tetap `.js` (bila `allowJs` menyala) atau diubah ke
  `.ts` dengan tipe sederhana. Isi fungsinya jangan diubah tanpa alasan,
  supaya perbaikan di Dragonet mudah dibawa ke sini.
- Ubah setelan di bagian atas berkas. `ORDER_CODE` = pola kode pesanan
  situs (DAMPIER memakai awalan `DMP-`, cocokkan dengan kodenya yang
  sebenarnya). `DIVE_SERVICES` di bagian bawah = id layanan yang termasuk
  menyelam. Awalan kode formulir `DW-` di `waiverCode` dan `isWaiverCode`
  boleh diganti bila bentrok dengan kode lain di situs itu.
- Zona waktu kode formulir dan "hari ini" memakai WIT (UTC+9), sudah benar
  untuk Raja Ampat.
- Jalankan `node --test waiver.test.js aset.test.js` dan masukkan ke
  perintah uji situs (`npm test`).

## 2. Teks dan bahasa

`teks.json` berisi teks lengkap formulir dalam en, id, zh, ko dengan kunci
yang sama. Pindahkan ke sistem teks situs (bisa tetap satu berkas JSON
yang dibaca per bahasa).

- Bahasa yang tidak dipakai situs boleh dibuang (DAMPIER tidak memakai ko).
- **DAMPIER perlu bahasa Rusia (ru).** Tulis dengan bentuk yang sama persis
  dengan `en`, placeholder `{code}`, `{email}`, `{name}`, `{done}`,
  `{total}`, `{host}`, `{operator}` dipertahankan. Untuk pertanyaan medis,
  cari dulu versi resmi berbahasa Rusia dari formulir medis 2020 (lihat
  `kuesioner-medis.md`). Kalau tidak ada, terjemahkan dan tetap tampilkan
  teks English kecil di bawah tiap pertanyaan seperti di Dragonet, lalu
  katakan ke pemilik bahwa terjemahan Rusia belum diperiksa penutur asli.
- `aset.test.js` memeriksa semua bahasa di `teks.json` berbentuk sama dengan
  English dan bersih dari titik dua, titik koma, dan tanda pisah panjang.
- Isi `{operator}` di teks (pesan WhatsApp `done.chatMessage`, teks email)
  dengan nama merek situs.
- `fields.room` ("Where you stay in Raja Ampat") cocok untuk DAMPIER. Situs
  di luar Raja Ampat mengubahnya.
- Teks Mandarin, Korea, dan Rusia **tidak boleh sampai ke bundle peramban**
  semua sekaligus. Kirim teks satu bahasa sebagai prop dari komponen
  server ke formulir (cara Dragonet, `ui.waiver` bahasa halaman plus teks
  medis English untuk baris kecil).

## 3. Teks perjanjian

`perjanjian.json` berisi `en` (berlaku secara hukum) dan `id` (terjemahan).
Baca `perjanjian.md` dulu.

- Ganti `{operator}` dengan nama penyelenggara kegiatan yang **ditetapkan
  pemilik** (nama dagang dan, bila ada, nama badan hukumnya). Jangan
  menebak.
- Bagian 6 menyebut merek dagang SSI. Hapus atau sesuaikan bila
  penyelenggara bukan SSI Training Center, dan tanyakan ke pemilik
  agensinya (SSI, PADI, lainnya).
- Simpan sebagai teks bawaan di kode. Tim bisa menggantinya dari admin
  (langkah 6). `agreementTexts(simpanan, bawaan)` memilih yang berlaku dan
  tidak memasangkan teks English buatan tim dengan terjemahan bawaan.
- DAMPIER memakai id sebagai bahasa utama, tetapi teks yang berlaku tetap
  English. Halaman berbahasa Indonesia menampilkan English lalu terjemahan
  di bawahnya. Bahasa lain (zh, ru) cukup English dengan kalimat
  `bindingTranslated` atau `binding`, kecuali pemilik memberi terjemahan
  resmi.

## 4. Penyimpanan

`skema.sql` membuat tabel `waivers` (MySQL). Untuk database lain, pertahankan
kolomnya.

- Kolom utama untuk daftar dan pencarian (kode, kode pesanan, bahasa, nama,
  tanggal lahir, kebangsaan, email, telepon, tanggal selam, perlu dokter,
  di bawah umur, waktu).
- `data` = isian lengkap hasil `cleanWaiver` tanpa tanda tangan (JSON).
- `agreement` = **salinan teks perjanjian yang disetujui**, apa adanya saat
  ditandatangani. Untuk tamu berbahasa Indonesia, English lalu `---` lalu
  terjemahannya. Perubahan teks di admin tidak boleh mengubah formulir lama.
- `signature` = PNG base64 dari kanvas (paling besar `SIGNATURE_MAX`).
- `ip` dan `user_agent` sebagai bukti tambahan penandatanganan.
- Baris terakhir `skema.sql` memperbesar `settings.value` ke MEDIUMTEXT
  karena teks perjanjian dua bahasa bisa melebihi 64 KB. Lewati bila situs
  menyimpan pengaturan dengan cara lain.

Fungsi penyimpanan Dragonet ada di
`assets/contoh-dragonet/src/server/waivers.js` (`createWaiver`,
`listWaivers` tanpa tanda tangan, `waiverByCode` lengkap, `waiverCounts` per
pesanan, `getAgreement`, `saveAgreement`).

## 5. API kirim formulir

Contoh `assets/contoh-dragonet/app/api/waiver/route.js`. Urutannya

1. Tolak permintaan dari situs lain (cek Origin sama dengan host).
2. Batasi 30 formulir per jam per IP. Satu rombongan sering mengisi dari
   satu ponsel, jadi jangan lebih ketat dari itu.
3. Baca JSON dengan batas ukuran `SIGNATURE_MAX + 40000` byte.
4. `cleanWaiver(isian, { today: hariIniWIT, agreement: true })`. Galat
   `WaiverError` membawa nama kolom, petakan ke `waiver.errors` bahasa tamu.
5. Kode pesanan hanya ditautkan bila token rahasia pesanan cocok (bandingkan
   dengan perbandingan waktu tetap) dan pesanannya berisi layanan selam
   (`diversIn(items) > 0`). Selain itu kosongkan.
6. Simpan dengan `waiverCode()`, coba ulang bila kode kebetulan sudah ada.
7. Kirim salinan ke email tamu bila diisi, di belakang (jangan menahan
   jawaban). Contoh isi email `assets/contoh-dragonet/src/lib/waiver-mail.js`.
8. Jawab `{ code, clearance, copy }` dengan `Cache-Control: no-store`.

## 6. Halaman, admin, dan editor perjanjian

- **Halaman formulir** (`app/[lang]/waiver/page.jsx` +
  `src/components/waiver/WaiverForm.jsx`). Komponen server mengambil teks
  perjanjian, memecahnya dengan `agreementBlocks`, dan mengirim teks satu
  bahasa ke formulir. Formulir memeriksa dengan `cleanWaiver` yang sama
  sebelum mengirim, menggulir ke kolom pertama yang salah, dan setelah
  terkirim menawarkan "isi untuk penyelam lain" (formulir dikosongkan,
  tanda tangan ikut). `?order=<kode>&t=<token>` mengisi tanggal selam
  pertama (`firstDiveDate`). Halaman tidak diindeks (`robots noindex`).
- **Kotak tanda tangan** `assets/formulir-selam/SignaturePad.jsx`. Ganti
  kelas warna Tailwind (`border-lagoon`, `text-ember`, `bg-sunrise-wash`,
  `border-danger`, `rounded-input`) dengan token situs, dan warna goresan
  `#0A323B` dengan warna teks gelap situs. Di TypeScript cukup diberi tipe
  props.
- **Admin daftar** (`app/admin/formulir/page.jsx`). Tabel formulir terbaru
  dengan tanda **Perlu dokter** dan **Di bawah 18**, jumlah per status,
  tautan formulir untuk disalin (untuk kode QR di meja dive center).
- **Admin detail** (`app/admin/formulir/[code]/page.jsx`). Semua isian,
  jawaban medis Ya ditonjolkan, tanda tangan, teks perjanjian yang
  disetujui, tombol cetak (`print:hidden` di menu admin).
- **Editor perjanjian** (`src/admin/WaiverAgreementForm.jsx` +
  `app/api/admin/waiver/route.js`). Dua kolom (English wajib bila ada
  terjemahan, `cleanAgreement`), tombol kembali ke teks bawaan. Bila isinya
  sama dengan bawaan, simpan kosong supaya perbaikan teks bawaan berikutnya
  ikut terpakai. API admin wajib memeriksa sesi admin.

## 7. Penempatan

Lihat `penempatan.md`. Di Dragonet

- Kartu "Dive forms" di halaman status pesanan selam dengan jumlah yang
  sudah mengisi (`waiverCounts`) dari jumlah penyelam (`diversIn`), tombol
  membuka formulir dengan kode dan token pesanan.
- Blok tautan formulir di email pesanan dan email lunas untuk pesanan selam
  (bukan di pengingat bayar dan bukan di trip non-selam).
- Tautan di footer, kelompok rencana perjalanan.
- Tautan langsung `/waiver` untuk tamu yang datang tanpa pesanan online,
  dijadikan kode QR di meja dive center.

## 8. Uji di peramban

Contoh uji Playwright Dragonet (Chromium yang terpasang di lingkungan cloud)

```js
const { chromium } = require("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
await page.goto(`${base}/waiver`);
// isi kolom, jawab semua pertanyaan medis, gambar tanda tangan
const box = await page.locator("canvas").boundingBox();
await page.mouse.move(box.x + 30, box.y + 60);
await page.mouse.down();
for (let i = 1; i <= 20; i++) await page.mouse.move(box.x + 30 + i * 12, box.y + 60 + Math.sin(i) * 20);
await page.mouse.up();
await page.getByRole("button", { name: /sign and send/i }).click();
await page.getByText(/form number is DW-/).waitFor();
// tidak ada gulir menyamping
const wide = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
```

Periksa juga

- Ya di pertanyaan 3 menampilkan "perlu persetujuan dokter", Ya di
  pertanyaan 1 membuka kotak A, Tidak di semua isi kotak tidak perlu dokter.
- Tanggal lahir di bawah 18 tahun memunculkan kolom wali, konfirmasi nama
  harus nama wali.
- Kirim kosong menggulir ke kolom pertama yang salah dengan pesan dalam
  bahasa halaman.
- Setiap bahasa situs, termasuk huruf Mandarin dan Rusia yang panjang.
- Formulir tersimpan di database, salinan perjanjian ikut, admin daftar dan
  detail menampilkan isinya, halaman cetak rapi.
- Bundle peramban tidak berisi teks bahasa lain (cari satu kalimat
  Mandarin di `.next/static/chunks`).
