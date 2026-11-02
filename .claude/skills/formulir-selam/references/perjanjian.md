# Teks perjanjian (liability release)

## Asal

Pemilik mengirim tangkapan layar dan lalu teks lengkap formulir waiver
Turtle Dive Homestay (Turtle Divers Raja Ampat) pada 2 November 2026 dan
meminta formulir serupa untuk Dragonet Divers. Nama penyelenggara diganti
nama Dragonet Divers Raja Ampat, kalimat lain dibiarkan apa adanya. Di skill
ini nama itu tertulis `{operator}`.

Susunannya

- Pembuka (penyelenggara dan daftar Kegiatan, risiko bawaan)
- 1. Agreement Parties
- 2. Participant's Responsibilities & Assumption of Risks
- 3. Participant's Condition & Emergency Awareness
- 4. Release of Liability
- 5. Hold Harmless & Indemnification
- 6. SSI Trademarks & Independent Operation
- 7. Legal Contract, Governing Law & Severability
- Paragraf penutup huruf besar ("I HAVE FULLY READ…")

Terjemahan Indonesia (`perjanjian.json` `id`) dibuat 2 November 2026 atas
permintaan pemilik ("tambahkan juga perjanjian untuk bahasa indonesia"),
blok per blok dengan susunan yang sama, istilah tetap "Kegiatan",
"Perjanjian", "Peserta", "Pihak yang Dibebaskan", tanpa titik dua dan
titik koma di luar kutipan. Terjemahan Mandarin (`zh`, istilah "活动",
"协议", "参与者", "被免责方") dan Korea (`ko`, gaya resmi 합니다, istilah
"활동", "동의서", "참가자", "면책 당사자") menyusul hari yang sama, setelah
pemilik memutuskan perjanjian tampil dalam bahasa halaman.

## Yang perlu diputuskan pemilik untuk situs baru

- **Siapa `{operator}`.** Nama dagang dan, bila ada, nama badan hukum
  penyelenggara kegiatan. Untuk DAMPIER, tanyakan apakah DAMPIER sendiri
  yang menyelenggarakan penyelaman atau mitranya. Perjanjian harus atas nama
  pihak yang benar-benar menyelenggarakan.
- **Bagian 6 (SSI).** Hanya tepat bila penyelenggara SSI Training Center.
  Untuk PADI atau agensi lain, pakai kalimat dari formulir agensi itu atau
  hapus bagian ini (nomor bagian sesudahnya ikut bergeser, dan uji
  `aset.test.js` yang memeriksa nomor 1 sampai 7 disesuaikan).
- **Hukum yang berlaku (bagian 7).** Teks asli menyebut "the Laws of the
  State in which the Host is located", berasal dari formulir gaya Amerika.
  Untuk usaha di Indonesia, sarankan pemilik meminta ahli hukum memeriksa
  kalimat ini dan seluruh perjanjian.
- Formulir SSI 2019 sendiri menyebut versi pelepasan tanggung jawabnya tidak
  dipakai di Uni Eropa. Keabsahan waiver berbeda per negara.

## Cara kerja di situs

- **Bahasa halaman.** Pemilik memutuskan pada 2 November 2026 bahwa
  perjanjian "sesuaikan saja dengan bahasa yang sedang aktif". Halaman
  menampilkan satu teks dalam bahasa yang sedang dibuka
  (`agreementFor`). Bahasa yang belum punya teks memakai English dengan
  kalimat `englishOnly`. Undang-Undang 24/2009 Pasal 31 mewajibkan Bahasa
  Indonesia dalam perjanjian yang melibatkan pihak Indonesia, jadi teks
  Indonesia untuk tamu Indonesia sejalan dengan aturan itu, tetapi
  keputusan teks mana yang mengikat tetap urusan ahli hukum pemilik.
- **Teks bawaan di kode, teks tim di admin.** Editor admin memuat satu kolom
  per bahasa. Semua kosong = teks bawaan. `agreementTexts(simpanan, bawaan)`
  memakai simpanan tim bila ada, dan terjemahan bawaan hanya dipasangkan
  dengan English bawaan.
- **Salinan disimpan bersama formulir.** Teks yang dibaca dan disetujui tamu
  (bahasa halaman) disalin ke kolom `agreement` saat ditandatangani, jadi
  perubahan teks kemudian tidak mengubah formulir yang sudah ditandatangani.
  Detail admin menampilkan salinan ini.
- **Format teks.** Paragraf dipisah baris kosong. Paragraf satu baris yang
  diawali nomor ("1. Agreement Parties") atau `#` tampil sebagai judul
  (`agreementBlocks`).
- **Tanda tangan.** Tamu menggambar tanda tangan, mengetik nama lengkap
  sebagai konfirmasi (harus sama dengan nama di formulir), lalu mencentang
  setuju. Bagian 7 menyebut tanda tangan elektronik berlaku sama dengan
  yang asli.
- **Di bawah 18 tahun.** Nama orang tua atau wali wajib, dan wali yang
  mengetik namanya sebagai konfirmasi dan menandatangani.
- **Bukti tambahan.** Waktu, alamat IP, dan peramban disimpan bersama
  formulir. Salinan dikirim ke email tamu bila diisi.

## Batas

Skill ini tidak memberi nasihat hukum. Katakan ke pemilik bahwa teks berasal
dari formulir dive center lain, terjemahannya bukan terjemahan tersumpah, dan
keabsahannya sebaiknya diperiksa ahli hukum Indonesia.
