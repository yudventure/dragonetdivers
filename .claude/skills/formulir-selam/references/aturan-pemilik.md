# Aturan pemilik yang berlaku di semua situsnya

Pemilik DAMPIER juga membangun situs lain (Zanclus Dive Center dan klien
lain). Aturan berikut ia tegaskan berulang kali dan berlaku juga di sana,
kecuali situs itu punya aturan sendiri yang berbeda.

## Tulisan yang tampil

- Tanpa **titik dua** di kalimat, judul, label, atau pembuka daftar
  (juga ：di Mandarin). Boleh di jam (07:00), rasio (16:9), alamat (https://).
- Tanpa **titik koma** (juga ；).
- Tanpa **tanda pisah panjang** (—) dan tanda pisah berspasi ( – ). Rentang
  ditulis rapat (07–21).
- Label dan nilai dipisah dengan baris atau tampilan ("Kode DMP-…", bukan
  "Kode: DMP-…"). Daftar dibuka dengan kalimat utuh.
- Komentar kode tidak ikut aturan ini.

## Tata letak

- **Tanpa garis datar pemisah** (`<hr>`, `border-t`/`border-b` sebagai
  pemisah, `divide-y`). Pisahkan dengan jarak, latar, atau bayangan lembut.
  Bingkai kartu, kolom isian, dan peta boleh.
- **Kartu yang sendirian melebar penuh.** Dua kartu di baris terakhir kisi
  tiga kolom dibagi rata.
- **Nomor atau ikon, pilih satu** di satu butir.
- Tanpa hiasan garis putus-putus berpanah.
- Pemilik tidak suka warna krem keabuan.

## Ponsel

- Lembar yang ditambatkan ke bawah memakai `svh` dengan `vh` sebagai
  cadangan (`max-h-[92vh] supports-[height:1svh]:max-h-[92svh]`).
- Kunci gulir halaman dengan membekukan body (`position: fixed`), bukan
  `overflow: hidden` saja, karena Safari mengabaikannya untuk sentuhan.
- Ketuk di luar menutup, dengan pendengar di dokumen, bukan `onClick` di
  latar (iPhone tidak mengirim click ke elemen tanpa penangan).
- Jangan beri `backdrop-blur`, `filter`, atau `transform` pada leluhur
  panel `fixed`.

## Isi dan panel

- Semua yang tampil di situs publik harus bisa diubah dari panel pengelola
  (kecuali teks berkas bahasa, yang disebut terus terang ke pemilik).
- DAMPIER empat bahasa (id, en, zh, ru). Situs lain mengikuti bahasanya
  sendiri (Zanclus: en bawaan, id).
- Data pribadi pendiri, nomor WhatsApp mitra, kunci API, dan rahasia tidak
  pernah masuk repo, cadangan, atau halaman publik.

## Pengujian dan laporan

- Uji di peramban, bukan hanya membaca kode. Dari lingkungan cloud hanya
  Chromium Linux yang bisa dijalankan. Katakan itu, dan sebut Windows, Mac,
  Android, dan iOS belum diperiksa.
- Laporan ke pemilik dalam bahasa Indonesia.

## Tambahan dari formulir selam di Dragonet

- Dragonet empat bahasa (en bawaan, id, zh, ko). Bahasa Indonesia memakai
  sapaan "kamu", Mandarin "您", Korea 해요체. Periksa sapaan yang dipakai
  situs tujuan sebelum menulis teks baru.
- Aturan brand Dragonet (cek padanannya di situs tujuan): satu tombol
  oranye per layar, teks putih di atas oranye dilarang, warna hanya dari
  token tema situs.
- Teks hukum dan medis tidak dikarang. Yang belum bisa dipastikan dari
  sumber resmi disebut terus terang ke pemilik.
- Pemilik pernah mengirim tangkapan layar yang memperlihatkan kata sandi.
  Jangan pernah mengulang rahasia yang terlihat di tangkapan layar, minta ia
  menggantinya.
- Dokumentasi dan komentar kode dalam Bahasa Indonesia.
