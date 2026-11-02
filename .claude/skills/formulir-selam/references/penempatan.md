# Di mana formulir ditaruh dan kapan tamu mengisinya

Riset untuk Dragonet Divers, 2 November 2026, atas pertanyaan pemilik
"coba risetkan bagusnya masuk dimana".

## Temuan

- **PADI** mengirim undangan formulir digital ke calon siswa lewat sistem
  pengelolaan siswanya, biasanya bersamaan dengan kode eLearning. Formulir
  kertas tetap boleh. Formulir administrasi (termasuk pelepasan tanggung
  jawab) **wajib lengkap sebelum kegiatan di air**. Pro bisa melihat status
  formulir (email terkirim tetapi belum dibuka, ditolak), lalu menghubungi
  tamu atau mengirim ulang.
  Sumber: [PADI Pros Blog, new digital forms](https://pros-blog.padi.com/new-digital-forms/)
- **SSI** memakai formulir baku "Assumption of Risk, Liability Release &
  Hold Harmless Agreement". Formulir pendaftaran SSI 2019 menyebut versi
  pelepasan tanggung jawabnya tidak dipakai di Uni Eropa, jadi yurisdiksi
  berpengaruh.
  Sumber: [SSI Student Forms 2019](https://www.diventures.com/wp-content/uploads/2020/09/SSI-Student-Forms-2019.pdf),
  [SSI Try Scuba Forms 2019](https://www.diventures.com/wp-content/uploads/2020/09/SSI-Try-Scuba-Forms-2019.pdf)
- **Software dive center** memakai pola sebelum datang. Tamu menerima
  tautan formulir sebelum tiba, mengisi online, dan semuanya siap saat
  check-in.
  Sumber: [DiversDesk, custom dive centre waivers](https://diversdesk.vercel.app/blog/en/custom-dive-centre-waivers/),
  [DiversDesk, onboarding fun divers](https://diversdesk.vercel.app/blog/en/blog1-how-to-digitally-onboard-fun-divers/)
- **Operator** di lapangan meminta kuesioner medis, pelepasan tanggung
  jawab, dan formulir peserta diisi sebelum masuk air.
  Sumber: [TripShock, Key West Q&A](https://www.tripshock.com/questions/7227918/For-beginner-scuba-in-Key-West-do-I-need-to-finish-any-paperwork-before-arriving)
- Sumber vendor dan operator bersifat pemasaran, jadi dipakai sebagai contoh
  praktik, bukan aturan. Keabsahan waiver online berbeda per negara,
  jadi teksnya sebaiknya diperiksa ahli hukum setempat.

## Penempatan yang dipasang di Dragonet

Urutannya mengikuti kapan tamu paling mungkin mengisi.

1. **Halaman status pesanan selam.** Kartu "Dive forms" berisi jumlah
   penyelam yang sudah mengisi dari jumlah penyelam di pesanan, tombol
   "Fill in a dive form" membuka formulir dengan kode dan token pesanan
   (tanggal selam terisi sendiri, formulir tertaut ke pesanan). Setelah
   semua mengisi, kartu berganti "All dive forms are in".
2. **Email pesanan dibuat dan email lunas** untuk pesanan yang berisi
   layanan selam. Tidak di email pengingat bayar (fokusnya membayar) dan
   tidak di pesanan trip atau snorkeling.
3. **Footer**, kelompok rencana perjalanan, tautan "Dive form".
4. **Tautan langsung** `/waiver` untuk tamu yang datang tanpa pesanan
   online. Admin menampilkan tautannya dengan tombol salin, untuk dijadikan
   kode QR di meja dive center atau di perahu.

Yang sengaja **tidak** dilakukan

- Tidak dijadikan langkah wajib di checkout. Pemesan sering memesan untuk
  beberapa orang, dan tiap penyelam harus mengisi dan menandatangani
  sendiri.
- Tidak ada menu utama. Formulir hanya relevan bagi yang sudah memesan atau
  sudah di dive center.
- Halaman tidak diindeks mesin pencari.

## Untuk DAMPIER

Sesuaikan dengan alur DAMPIER.

- Kalau DAMPIER memesan penyelaman untuk mitra (dive center lain), tanyakan
  ke pemilik siapa penyelenggara di perjanjian dan siapa yang melihat
  formulirnya (tim DAMPIER, mitra, atau keduanya). Data medis hanya boleh
  dilihat pihak yang menyelenggarakan penyelaman.
- Kartu di halaman pesanan dan blok email dipasang hanya untuk pesanan
  yang berisi penyelaman (`DIVE_SERVICES`).
- Tautan langsung tetap berguna untuk homestay mitra yang menerima tamu
  tanpa pesanan online.
