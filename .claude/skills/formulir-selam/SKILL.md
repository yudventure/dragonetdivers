---
name: formulir-selam
description: Formulir selam online (dive waiver) dari Dragonet Divers Raja Ampat, siap dipasang di situs lain milik pemilik yang sama, terutama DAMPIER (thedampier.com) dan Zanclus. Isinya data diri, profil penyelam dan asuransi, kuesioner medis 10 pertanyaan dengan kotak lanjutan A sampai G (Diver Medical Participant Questionnaire 2020) yang menandai perlu persetujuan dokter, perjanjian Assumption of Risk, Liability Release & Hold Harmless yang tampil dalam bahasa halaman, tanda tangan jari, wali untuk di bawah 18 tahun, salinan email, penempatan di halaman dan email pesanan, admin daftar, cetak, dan editor perjanjian. Teks English, Indonesia, Mandarin, Korea. Pakai SETIAP KALI pemilik meminta waiver, liability release, formulir selam, kuesioner medis, surat pernyataan, tanda tangan online, "formulir seperti di Dragonet", atau memasangnya di DAMPIER, Zanclus, atau situs lain, walau kata "skill" tidak disebut.
---

# Formulir selam (dive waiver)

Formulir ini lahir di repo Dragonet Divers (`yudventure/dragonetdivers`,
halaman `/waiver`, permintaan pemilik 2 November 2026 dengan contoh form
waiver Turtle Dive Homestay). Skill ini membawa logika, teks empat bahasa,
teks perjanjian, dan contoh kode lengkapnya supaya situs lain milik pemilik
yang sama (DAMPIER lebih dulu) bisa memasangnya tanpa menulis ulang.

## Isi skill

| Berkas | Gunanya |
|---|---|
| `assets/formulir-selam/waiver.js` | Logika murni tanpa ketergantungan: pertanyaan medis (`MEDICAL`, `BOXES`), `needsClearance`, `cleanWaiver` (dipakai peramban dan server), kode formulir, blok teks perjanjian, `agreementTexts`, `cleanAgreement`, `diversIn`. Setelan situs di bagian atas (`ORDER_CODE`), `DIVE_SERVICES` di bawah. |
| `assets/formulir-selam/waiver.test.js` | Uji logika (`node --test`). |
| `assets/formulir-selam/aset.test.js` | Uji teks: semua bahasa sama bentuk dengan English, jumlah pertanyaan medis cocok, tanpa titik dua dan titik koma. |
| `assets/formulir-selam/teks.json` | Teks formulir en, id, zh, ko (label, pertanyaan medis, galat, email, kartu pesanan, tautan footer). Nama dive center tertulis `{operator}`. |
| `assets/formulir-selam/perjanjian.json` | Teks perjanjian English (asli dari pemilik) dan terjemahan Indonesia, Mandarin, Korea dengan susunan sama, bagian 1 sampai 7, nama tertulis `{operator}`. |
| `assets/formulir-selam/skema.sql` | Tabel `waivers` MySQL (plus perbesar `settings.value`). |
| `assets/formulir-selam/SignaturePad.jsx` | Kotak tanda tangan (pointer events, retina, ikut skala saat ponsel diputar). Hanya React + kelas Tailwind. |
| `assets/contoh-dragonet/` | Berkas asli Dragonet dengan jalur yang sama: halaman, formulir, API, penyimpanan, email, admin. Dibaca dan disesuaikan, tidak disalin buta. |
| `scripts/ekspor-aset.mjs` | Mengisi ulang `assets/` dari repo Dragonet (sumber kebenaran). |
| `references/memasang.md` | Langkah memasang di situs baru, khusus DAMPIER (TypeScript, id/en/zh/ru). |
| `references/penempatan.md` | Hasil riset di mana formulir ditaruh dan kapan tamu mengisinya. |
| `references/kuesioner-medis.md` | Susunan kuesioner, aturan persetujuan dokter, sumber, hal yang wajib dicek. |
| `references/perjanjian.md` | Asal teks perjanjian, yang berlaku secara hukum, terjemahan, wali, salinan yang disimpan. |
| `references/aturan-pemilik.md` | Aturan tulisan, tata letak, dan laporan pemilik di semua situsnya. |

## Memasang di situs baru (ringkas)

Baca `references/memasang.md` untuk rinciannya. Intinya:

1. Baca dulu CLAUDE.md situs tujuan (stack, database, email, bahasa, admin).
2. Salin `assets/formulir-selam/` ke situs (DAMPIER boleh jadi `.ts`).
   Ubah `ORDER_CODE` dan `DIVE_SERVICES` ke kode pesanan dan layanan selam
   situs itu, awalan kode formulir di `waiverCode` bila perlu. Jalankan
   `node --test waiver.test.js aset.test.js`.
3. Ganti `{operator}` di teks dan perjanjian dengan nama yang dipakai situs
   itu. Nama badan hukum di perjanjian ditanyakan ke pemilik.
4. Tambah bahasa yang belum ada (DAMPIER perlu ru) dengan bentuk yang sama,
   `aset.test.js` memeriksanya.
5. Buat tabel dari `skema.sql`, API kirim formulir (cek ulang dengan
   `cleanWaiver`, batas per IP, salinan teks perjanjian ikut disimpan),
   halaman formulir, admin daftar dan detail cetak, editor teks perjanjian.
   Contoh lengkapnya di `assets/contoh-dragonet/`.
6. Pasang di tempat yang benar (`references/penempatan.md`): halaman
   pesanan selam, email pesanan dan lunas, footer, tautan langsung untuk
   kode QR di meja dive center.
7. Uji di peramban di semua bahasa situs, ponsel 390 px, tanda tangan
   dengan sentuhan.

## Aturan yang tidak boleh dilanggar

- **Teks perjanjian dan kuesioner medis tidak dikarang.** Perjanjian berasal
  dari teks yang diberikan pemilik. Pertanyaan medis mengikuti formulir
  resmi 2020, dan isi kotak lanjutan A sampai G wajib dicocokkan ke PDF
  resminya sebelum tayang di situs baru (lihat
  `references/kuesioner-medis.md`). Katakan terus terang ke pemilik bila
  belum dicocokkan.
- **Perjanjian tampil dalam bahasa halaman** (keputusan pemilik 2 November
  2026, "sesuaikan saja dengan bahasa yang sedang aktif"). Tamu membaca dan
  menyetujui teks bahasa yang sedang dibukanya, dan teks itulah yang
  disalin ke formulirnya. Bahasa tanpa teks memakai English dengan kalimat
  `englishOnly`. Terjemahan bukan terjemahan tersumpah, katakan ke pemilik.
- **Jawaban medis tidak pernah diputuskan situs.** Situs hanya menandai
  "perlu persetujuan dokter". Keputusan boleh menyelam ada pada dokter dan
  instruktur.
- **Data medis dan tanda tangan adalah data pribadi sensitif.** Hanya admin
  yang bisa melihat, tidak ada di halaman publik, cadangan publik, atau
  log. Tautan formulir dari pesanan memakai token rahasia pesanan.
- **Semua teks tampil mengikuti aturan pemilik** di
  `references/aturan-pemilik.md`. `aset.test.js` memeriksa teks bawaan.
- **Bukan nasihat hukum.** Sarankan pemilik meminta ahli hukum memeriksa
  perjanjian untuk badan usahanya, terutama nama pihak dan hukum yang
  berlaku.

## Menjaga tetap sama dengan Dragonet

Dragonet adalah sumber kebenaran. Setelah formulir di sana berubah, jalankan
dari akar repo dragonetdivers

```bash
node .claude/skills/formulir-selam/scripts/ekspor-aset.mjs
```

lalu kemas ulang skill (`package_skill.py` dari skill-creator) supaya versi
di akun pemilik ikut baru. Perbaikan yang ditemukan saat memasang di situs
lain sebaiknya dikembalikan ke Dragonet juga.

## Sebelum mengaku selesai

- [ ] `node --test waiver.test.js aset.test.js` lolos di situs tujuan
- [ ] Build situs lolos, tanpa galat konsol di halaman formulir
- [ ] Formulir terkirim dan tersimpan, salinan perjanjian ikut tersimpan
- [ ] Ya di pertanyaan 3, 5, 10, atau di isi kotak menampilkan "perlu persetujuan dokter" di formulir, email, dan admin
- [ ] Di bawah 18 tahun meminta nama wali dan wali yang mengetik konfirmasi
- [ ] Teks di semua bahasa situs bersih dari titik dua, titik koma, tanda pisah panjang
- [ ] Ponsel 390 px tanpa gulir menyamping, tanda tangan bisa digambar dengan sentuhan
- [ ] Katakan terus terang hanya Chromium Linux yang diuji, Windows, Mac, Android, dan iOS belum
