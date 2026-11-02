# Kuesioner medis penyelam

## Sumber

Pertanyaan mengikuti **Diver Medical | Participant Questionnaire** versi
2020, formulir medis baku penyelaman rekreasi yang disusun Diver Medical
Screen Committee bersama UHMS dan dipakai agensi selam (PADI, SSI, dan
lainnya). PDF resminya, beserta terjemahan ke banyak bahasa, tersedia di
situs UHMS dan DAN.

**Wajib dicek sebelum tayang di situs baru.** Saat membangun Dragonet, situs
resmi tidak bisa dibuka dari lingkungan cloud, jadi isi kotak lanjutan A
sampai G ditulis dari ingatan atas formulir 2020 dan pemilik diminta
mencocokkannya. Sebelum memasang di DAMPIER

1. Minta pemilik mengirim PDF resmi terbaru (atau unduh bila bisa dibuka).
2. Cocokkan kalimat 10 pertanyaan dan semua isi kotak dengan
   `teks.json` (`waiver.medical`). Bila PDF punya versi lebih baru dengan
   jumlah butir berbeda, ubah `BOXES` di `waiver.js` dan teksnya bersamaan,
   lalu kembalikan perbaikannya ke Dragonet.
3. Pakai terjemahan resmi untuk bahasa lain bila ada (Rusia untuk DAMPIER).
4. Baca ketentuan pemakaian di PDF resminya dan sampaikan ke pemilik.
5. Katakan terus terang ke pemilik apa yang sudah dan belum dicocokkan.

## Susunan di logika

| Pertanyaan | Bila Ya |
|---|---|
| 1 paru, pernapasan, jantung, darah | kotak A (5 butir) |
| 2 umur di atas 45 | kotak B (4 butir) |
| 3 sulit olahraga sedang | **langsung perlu dokter** |
| 4 mata, telinga, hidung, sinus | kotak C (4 butir) |
| 5 operasi dalam 12 bulan | **langsung perlu dokter** |
| 6 pingsan, migrain, kejang, stroke, cedera kepala | kotak D (5 butir) |
| 7 psikologis, adiksi, disabilitas belajar | kotak E (4 butir) |
| 8 punggung, hernia, tukak, diabetes | kotak F (5 butir) |
| 9 lambung, usus | kotak G (6 butir) |
| 10 obat resep | **langsung perlu dokter** |

- Semua 10 pertanyaan wajib dijawab Ya atau Tidak. Kotak lanjutan muncul
  dan wajib dijawab hanya bila pertanyaan induknya Ya
  (`medicalQuestions`).
- `needsClearance` = Ya di 3, 5, atau 10, atau Ya di salah satu butir kotak.
  Ya di pertanyaan berkotak tetapi Tidak di semua butirnya **tidak** perlu
  dokter, sesuai petunjuk formulir resmi.
- Pengantar formulir menyebut ibu hamil atau yang sedang berusaha hamil
  tidak menyelam.
- Kalimat pernyataan "informasi medis di atas benar dan lengkap" wajib
  dicentang (`declaration`).

## Tampilan

- Di halaman selain English, tiap pertanyaan tampil dalam bahasa halaman
  dengan teks English kecil di bawahnya, karena formulir resminya English
  dan staf membaca jawaban dalam English.
- Jawaban Ya / Tidak berupa dua tombol radio besar yang mudah diketuk. Ya
  yang dipilih tidak boleh berupa teks putih di atas oranye (aturan
  pemilik). Dragonet memakai latar `sunrise-wash`, teks `ember`, cincin
  `ember`.
- Hasil tampil langsung di bawah kuesioner, lalu lagi setelah terkirim.
  Bila perlu dokter, tamu diminta membawa persetujuan dokter (Physician
  Evaluation Form dari formulir resmi) sebelum menyelam.
- Admin menandai formulir **Perlu dokter** di daftar dan menonjolkan
  jawaban Ya di detail.

## Batas tanggung jawab situs

Situs hanya mencatat jawaban dan menandai perlu tidaknya persetujuan dokter.
Situs tidak memberi saran medis dan tidak memutuskan seseorang boleh
menyelam. Keputusan ada pada dokter dan instruktur. Jangan menambah
pertanyaan medis atau aturan buatan sendiri tanpa sumber resmi.
