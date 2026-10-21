# Branding — Dragonet Divers Raja Ampat

Pedoman identitas visual untuk website dan media sosial Dragonet Divers. Semua keputusan di sini berangkat dari logo. Dokumen ini adalah acuan sebelum website dibangun; website mengambil nilainya dari `brand/tokens.css`.

Lihat versi visualnya di [`brand/brand-guide.html`](brand/brand-guide.html) (buka di browser) dan template media sosial di [`brand/social/`](brand/social/).

| Isi | Lokasi |
| --- | --- |
| **Buku pedoman PDF** (A4 landscape, 25 halaman) | `brand/export/Dragonet-Divers-Brand-Identity.pdf` |
| **Logo kit ZIP** (badge, lockup, favicon, highlight, palet) | `brand/export/Dragonet-Divers-Logo-Kit.zip` |
| Logo asli, versi plate, lockup horizontal, favicon | `brand/logo/` |
| Token warna, font, jarak, radius (CSS) | `brand/tokens.css` |
| Token yang sama (JSON, untuk Tailwind/alat lain) | `brand/tokens.json` |
| Font (self-host, lisensi SIL OFL) | `brand/fonts/` |
| Motif grafis (SVG) | `brand/patterns/` |
| Komponen website referensi (kelas `.dd-*`) | `brand/components.css` |
| Brand book visual: logo, warna, tipografi, komponen website | `brand/brand-guide.html` (tangkapan layar: `brand/preview/`) |
| Template media sosial (HTML) + pratinjau PNG | `brand/social/` |

---

## 1. Inti brand

| | |
| --- | --- |
| **Nama** | Dragonet Divers Raja Ampat. Singkatan yang boleh dipakai: *Dragonet Divers*. Jangan disingkat "DD" di materi publik. |
| **Apa yang dijual** | Fun dive, kursus selam, snorkeling, dan trip di Raja Ampat (Selat Dampier dan sekitarnya). |
| **Audiens** | Penyelam internasional dan domestik, pasangan dan keluarga yang ingin snorkeling, serta pemula yang ingin kursus. |
| **Janji brand** | Grup kecil, pemandu lokal yang mengenal setiap karang, dan rasa takjub pada makhluk sekecil ikan mandarin. |
| **Kepribadian** | Ramah, tenang, teliti, penuh warna, menghormati laut. |
| **Bahasa** | Website dua bahasa: English (default) dan Bahasa Indonesia. Media sosial: English dulu, satu baris Bahasa Indonesia. |

### Cerita di balik logo

Dragonet adalah keluarga ikan *Callionymidae*. Anggotanya yang paling terkenal adalah ikan mandarin (*Synchiropus splendidus*), ikan kecil berwarna oranye-biru yang menjadi bintang penyelaman senja. Saat matahari terbenam, pasangan ikan mandarin naik dari celah karang untuk "menari" berdua. Logo menangkap momen itu: dua ikan mandarin saling berhadapan, matahari di atas pulau karst, dan laut Raja Ampat. Cerita ini dipakai di website (halaman About, paket *Sunset Mandarin Dive*) dan di konten media sosial.

### Tagline (usulan, pilih satu)

1. **Dive into colour.** / *Menyelam ke dalam warna.* — Rekomendasi. Pendek, cocok untuk bio Instagram dan hero website, dan langsung merujuk warna ikan mandarin.
2. **Small groups. Big colour. Raja Ampat.** — Menonjolkan grup kecil.
3. **Where the reef dances at dusk.** / *Saat karang menari di senja hari.* — Untuk paket Sunset Mandarin Dive saja, bukan tagline utama.

---

## 2. Logo

| File | Untuk |
| --- | --- |
| `brand/logo/dragonet-divers-logo.png` | Asli, 301×301 px, latar transparan. **Hanya di atas putih.** |
| `brand/logo/dragonet-divers-logo-plate.png` | Bagian dalam cincin diisi putih. Untuk Foam, Abyss (footer), foto, dan template sosial. |
| `brand/logo/dragonet-divers-logo-white-bg.png` | Persegi putih penuh. Untuk foto profil media sosial. |

> **Penting:** pita bertulisan DRAGONET DIVERS / RAJA AMPAT di file asli **transparan**, bukan putih. Di latar gelap atau foto, tulisannya hilang. Selalu pakai versi *plate* di luar latar putih.

### Elemen logo

| Elemen | Warna | Dipakai di website sebagai |
| --- | --- | --- |
| Cincin luar & tulisan DRAGONET DIVERS / RAJA AMPAT | Teal Dragonet `#146E7F` | Warna utama |
| Laut | Biru Laguna `#1592AB` | Warna pendukung |
| Tubuh ikan mandarin | Oranye Mandarin `#EB7817` | Aksen CTA |
| Langit | Kuning Fajar `#F9D13E` | Sorotan kecil |
| Sirip ekor | Koral Sirip `#D9651F` | Hanya ilustrasi & pola |
| Bagian dalam badge | Putih | Dasar website |

### Aturan pemakaian

- **Area aman:** sisakan ruang kosong minimal **¼ diameter badge** di semua sisi. Badge 64 px → ruang kosong 16 px.
- **Ukuran minimum:** badge lengkap **56 px** di layar (tulisan masih terbaca) dan **20 mm** di cetak. Di bawah ukuran itu, pakai *lockup* badge + teks "Dragonet Divers" (lihat §2.1) atau favicon.
- **Latar yang boleh:** putih (utama, file asli), Foam `#F4F9FA` dan Abyss `#0A323B` (footer) dengan versi *plate*. Di atas foto: versi *plate*, di area foto yang tenang.
- **Jangan:** mengubah warna logo, memberi outline/bayangan/glow, memutar, meregangkan, memotong cincin luar, mengganti font tulisan di badge, memakai file transparan di latar gelap, menaruh di atas foto ramai, atau membuat versi satu warna sendiri tanpa desainer.

### 2.1 Lockup horizontal (header website)

Badge 44–48 px + teks **Dragonet Divers** (Fredoka 600, 20 px, Teal) + baris kecil **RAJA AMPAT** (Plus Jakarta Sans 700, 10 px, huruf besar, spasi 0.2em, Slate). Jarak badge ke teks 12 px. Di layar < 360 px tampilkan badge saja.

### 2.2 Favicon & ikon aplikasi

Sudah dibuat dari versi *plate* (aman di tab browser mode gelap): `favicon.ico`, `favicon-16/32/48.png`, `icon-192.png`, dan `apple-touch-icon-180.png` (latar putih penuh).

> **Perlu dari pemilik:** file logo resolusi tinggi (minimal 2000 px) atau vektor (SVG/AI/PDF). File sekarang hanya 301 px: cukup untuk header dan favicon, tetapi pecah bila dipakai sebagai foto profil 1080 px, spanduk, kaos, atau stiker. Versi satu warna (teal saja dan putih saja) sebaiknya dibuat desainer dari file vektor itu.

---

## 3. Warna

Website **minimalis berdasar putih**. Warna logo hanya aksen.

### Proporsi

| Porsi | Warna | Untuk |
| --- | --- | --- |
| ±80% | Putih, Foam | Latar halaman, section, kartu |
| ±12% | Abyss, Teal | Teks, judul, tombol utama, footer |
| ±5% | Biru Laguna | Ikon, ilustrasi, kotak info |
| ±3% | Oranye Mandarin, Kuning Fajar | Satu CTA per layar, bintang rating, sorotan |

### Palet

| Token | Nama | HEX | RGB | Peran |
| --- | --- | --- | --- | --- |
| `--dd-teal` | Teal Dragonet | `#146E7F` | 20 110 127 | Warna utama: tombol utama, link, ikon, judul aksen |
| `--dd-teal-dark` | Teal Gelap | `#0F5866` | 15 88 102 | Hover/pressed |
| `--dd-teal-soft` | Teal Lembut | `#D9E8EB` | 217 232 235 | Chip, tab aktif |
| `--dd-lagoon` | Biru Laguna | `#1592AB` | 21 146 171 | Ikon, ilustrasi, focus ring |
| `--dd-lagoon-wash` | Laguna Tipis | `#ECF6F8` | 236 246 248 | Kotak info kondisi laut |
| `--dd-mandarin` | Oranye Mandarin | `#EB7817` | 235 120 23 | Tombol CTA (Book / WhatsApp) |
| `--dd-ember` | Bara | `#B4560F` | 180 86 15 | Teks oranye: eyebrow, harga |
| `--dd-mandarin-fin` | Koral Sirip | `#D9651F` | 217 101 31 | Ilustrasi & pola saja |
| `--dd-sunrise` | Kuning Fajar | `#F9D13E` | 249 209 62 | Bintang rating, stabilo, titik aktif |
| `--dd-sunrise-wash` | Fajar Tipis | `#FEF8E0` | 254 248 224 | Latar peringatan, chip Sunset |
| `--dd-white` | Putih | `#FFFFFF` | 255 255 255 | Dasar |
| `--dd-foam` | Buih | `#F4F9FA` | 244 249 250 | Section selang-seling |
| `--dd-mist` | Kabut | `#DCE8EB` | 220 232 235 | Garis, border kartu |
| `--dd-line-strong` | Garis Tegas | `#78939A` | 120 147 154 | Border input |
| `--dd-slate` | Batu | `#557079` | 85 112 121 | Teks sekunder |
| `--dd-abyss` | Palung | `#0A323B` | 10 50 59 | Teks utama, footer |
| `--dd-on-dark-muted` | Kabut Malam | `#9DB9BF` | 157 185 191 | Teks sekunder di footer (6.6 : 1) |
| `--dd-success` | — | `#1E8257` | | Berhasil |
| `--dd-danger` | — | `#C0392B` | | Error |

### Kombinasi yang lulus kontras (WCAG AA)

| Teks / di atas | Rasio | Boleh untuk |
| --- | --- | --- |
| Abyss di Putih | 13.7 : 1 | Semua teks |
| Slate di Putih | 5.3 : 1 | Teks sekunder |
| Teal di Putih / Putih di Teal | 5.9 : 1 | Link, tombol utama |
| Bara di Putih | 4.9 : 1 | Eyebrow, harga |
| Abyss di Oranye Mandarin | 4.7 : 1 | Teks tombol CTA |
| Abyss di Kuning Fajar | 9.3 : 1 | Chip/stiker kuning |
| Putih di Abyss | 13.7 : 1 | Footer |
| Biru Laguna di Putih | 3.7 : 1 | **Hanya** teks ≥ 24 px, ikon, focus ring |

**Dilarang:** teks putih di atas oranye (2.9 : 1), teks kuning atau oranye terang di atas putih, gradasi ungu-biru, dan memakai lebih dari satu tombol oranye dalam satu layar.

---

## 4. Tipografi

| Peran | Font | Kenapa |
| --- | --- | --- |
| **Display** (judul) | **Fredoka** 600 | Huruf tebal membulat, senada dengan tulisan di badge. Ramah tanpa kekanak-kanakan bila dipakai hemat. |
| **Body** (teks, tombol, form) | **Plus Jakarta Sans** 400/600/700 | Rapi dan mudah dibaca di ukuran kecil. Dibuat oleh Tokotype, foundry Indonesia. |

Keduanya berlisensi SIL OFL dan disimpan lokal di `brand/fonts/` (tanpa CDN saat runtime).

| Gaya | Font | Ukuran desktop / mobile | Tinggi baris | Catatan |
| --- | --- | --- | --- | --- |
| Display | Fredoka 600 | 60 / 40 px | 1.05 | Hanya judul hero |
| H1 | Fredoka 600 | 44 / 34 px | 1.1 | Satu per halaman |
| H2 | Fredoka 600 | 34 / 28 px | 1.15 | Judul section |
| H3 | Fredoka 600 | 24 px | 1.25 | Judul kartu besar |
| H4 | Plus Jakarta Sans 700 | 20 px | 1.3 | Judul kartu kecil |
| Lead | Plus Jakarta Sans 400 | 18 px | 1.65 | Paragraf pembuka |
| Body | Plus Jakarta Sans 400 | 16 px | 1.65 | Teks utama |
| Small | Plus Jakarta Sans 500 | 14 px | 1.55 | Caption, meta |
| Eyebrow | Plus Jakarta Sans 700 | 12 px, HURUF BESAR, spasi 0.14em | 1.3 | Label di atas judul, warna Bara atau Teal |
| Tombol | Plus Jakarta Sans 700 | 15 px | 1 | |

Aturan:
- Fredoka **tidak** untuk paragraf, form, atau tabel.
- Judul pakai *sentence case* ("Dive the Dampier Strait"), bukan HURUF BESAR semua. Huruf besar hanya untuk eyebrow dan label kecil.
- Lebar paragraf maksimal ±65 karakter.
- Angka data selam (kedalaman, suhu, harga) pakai `font-variant-numeric: tabular-nums`. Satuan ditulis dengan spasi: `18 m`, `28 °C`, `IDR 1.500.000`.

---

## 5. Elemen grafis

Tiga motif, semuanya dari logo. Pakai paling banyak **satu motif per section**.

| Motif | File | Dari logo | Pakai untuk |
| --- | --- | --- | --- |
| **Garis ombak** | `brand/patterns/wave-divider.svg` | Goresan air | Di bawah judul section, pembatas antar-bagian, penanda menu aktif |
| **Garis mandarin** | `brand/patterns/mandarin-stripe.svg` | Belang ikan mandarin | Pita tipis 6–12 px di atas footer, tepi template sosial. Jangan sebagai latar luas. |
| **Lingkaran badge** | (CSS `border-radius: 50%` + cincin 3 px Teal) | Bentuk badge | Foto tim, foto biota di kartu fakta, stiker "Since 20xx", highlight Instagram |

---

## 6. Ikon

- Gaya **garis** (outline), stroke 1.75 px, ujung membulat, grid 24 px. Rekomendasi set: **Lucide** (lisensi ISC): `fish`, `waves`, `sun`, `anchor`, `ship`, `map-pin`, `calendar`, `thermometer`, `eye`, `gauge`, `life-buoy`, `message-circle`.
- Warna default Teal; di atas Abyss pakai Putih. Oranye hanya untuk ikon di dalam tombol CTA.
- Jangan pakai emoji sebagai ikon di website.

---

## 7. Fotografi & video

- **Asli dan jujur:** foto bawah laut Raja Ampat milik sendiri atau berlisensi jelas. Gambar AI tidak boleh ditampilkan sebagai dokumentasi lokasi.
- **Dua skala:** makro (ikan mandarin, nudibranch, kuda laut pygmy) dan luas (manta, hamparan karang, pulau karst, kapal di Selat Dampier).
- **Warna natural:** koreksi warna bawah laut secukupnya; jangan saturasi berlebihan atau filter kuning/ungu.
- **Manusia & etika:** penyelam dengan buoyancy baik, tidak menyentuh karang, jarak aman dari biota. Ini bagian dari pesan brand.
- **Waktu emas:** foto senja (sesuai cerita logo) untuk hero dan paket Sunset Mandarin Dive.
- **Teks di atas foto:** pakai gradasi Abyss 0 → 70% di bagian bawah foto, teks putih. Jangan teks di area foto yang ramai.
- **Bingkai:** radius 28 px untuk foto besar, 16 px untuk kartu, lingkaran untuk potret.

---

## 8. Suara & bahasa

| Kami | Bukan |
| --- | --- |
| Ramah, seperti dive guide yang sudah lama kenal | Formal kaku atau terlalu heboh |
| Spesifik: nama site, kedalaman, biota | Klaim umum ("terbaik di dunia!!!") |
| Tenang dan meyakinkan soal keselamatan | Menakut-nakuti atau meremehkan risiko |
| Menghormati laut dan warga lokal | Memperlakukan biota sebagai atraksi |

Contoh:
- ✔ *"Small groups, local guides, and the colours of the Dampier Strait."*
- ✔ *"Kami menyelam maksimal 4 tamu per pemandu."* (sesuaikan dengan kebijakan asli)
- ✘ *"BEST DIVING EVER 🔥🔥🔥 BOOK NOW!!!"*

Penulisan: "Raja Ampat" (bukan "Rajaampat"), "Selat Dampier / Dampier Strait", nama biota dalam English di konten EN dan Indonesia di konten ID (ikan mandarin / mandarinfish). Tombol pakai kata kerja: **Book a dive**, **Chat on WhatsApp**, **See packages**.

---

## 9. Komponen website

Semua komponen memakai token di `brand/tokens.css`. Contoh visual lengkap ada di `brand/brand-guide.html`.

### 9.1 Header
- Latar putih, tinggi 72 px (mobile 64 px), menempel di atas saat scroll dengan garis bawah 1 px Mist.
- Kiri: lockup logo. Tengah: menu (Plus Jakarta Sans 600, 15 px, Abyss). Kanan: tombol bahasa **EN / ID** dan tombol **Book a dive** (oranye).
- Menu aktif: warna Teal + garis ombak kecil di bawahnya.
- Mobile: ikon menu → panel putih layar penuh, menu 24 px Fredoka, CTA di bawah.

### 9.2 Hero
- Latar putih. Eyebrow (Bara) → judul Display (Abyss, satu kata kunci boleh Teal) → lead (Slate) → dua tombol (oranye + garis teal).
- Foto besar dalam bingkai radius 28 px di sisi kanan (desktop) atau di bawah teks (mobile). Tidak memakai hero 100vh.
- Di bawah hero: **strip kondisi laut** (suhu air, visibilitas, arus, waktu matahari terbenam) dalam kotak Laguna Tipis.

### 9.3 Tombol

| Varian | Latar | Teks | Hover | Pakai untuk |
| --- | --- | --- | --- | --- |
| **Aksen** | Oranye Mandarin | Abyss | `#F28A33` | Satu CTA utama per layar (Book, WhatsApp) |
| **Utama** | Teal | Putih | Teal Gelap | Aksi utama lain (Kirim, Lihat paket) |
| **Garis** | Transparan, border 1.5 px Teal | Teal | Latar Teal Lembut | Aksi kedua |
| **Teks** | — | Teal, garis bawah saat hover | — | Link "Selengkapnya →" |

Bentuk pil (radius penuh), tinggi 48 px (kecil 40 px), padding horizontal 24 px. Fokus keyboard: cincin 3 px Biru Laguna dengan jarak 2 px. Nonaktif: latar Mist, teks Slate.

### 9.4 Chip & badge
Pil kecil 12 px huruf besar, Plus Jakarta Sans 700:
- **Beginner / Pemula**: Teal Lembut + Teal
- **Advanced**: Mandarin Tipis + Bara
- **Sunset dive**: Fajar Tipis + Abyss
- **Snorkel**: Laguna Tipis + Teal

### 9.5 Kartu
- **Kartu dive site:** foto 4:3 radius 16 px, nama site (Fredoka 22 px), baris meta berikon (kedalaman, arus, level), chip level. Border 1 px Mist, tanpa bayangan; hover: border Teal.
- **Kartu paket/harga:** putih, border Mist, eyebrow, nama paket, harga besar (Plus Jakarta Sans 800, tabular), daftar isi bercentang Teal, tombol Garis. Paket unggulan: border 2 px Teal + chip "Most popular".
- **Kartu testimoni:** latar Foam, bintang Kuning Fajar, kutipan 18 px, nama + negara asal.
- **Kartu tim:** foto lingkaran dengan cincin Teal 3 px, nama, sertifikasi (mis. PADI Divemaster).

### 9.6 Form
Input tinggi 48 px, radius 10 px, border 1 px Garis Tegas, label di atas (14 px 600 Abyss), helper 13 px Slate. Fokus: border Teal + cincin Laguna. Error: border & teks `#C0392B` dengan ikon. Formulir booking berakhir di WhatsApp (tombol aksen).

### 9.7 Kotak info & kondisi laut
Latar Laguna Tipis, ikon Teal, teks Abyss, radius 16 px. Peringatan cuaca: Fajar Tipis + teks Bara.

Pengecualian (permintaan pemilik, Oktober 2026): panel **kondisi laut live** di beranda dan halaman layanan memakai latar video laut dalam (`public/media/ocean-manta-loop.*`) dengan manta karang realistis yang berenang bolak-balik: dari jauh berupa siluet, dari dekat perut putihnya terlihat, lalu kembali ke tempat awal; cara membuat di `brand/ocean/README.md`. Teks putih, ikon putih, panah arah Kuning Fajar, lapisan gradasi Abyss 50–70% dan bayangan teks di atas video agar teks tetap terbaca.

### 9.8 Judul section
Eyebrow (Bara) → H2 (Abyss) → garis ombak (Teal, 96 px) → paragraf Slate maks. 60 karakter. Rata kiri di desktop.

### 9.9 Tabel harga & jadwal
Header Abyss 14 px 700 di atas Foam, baris dipisah garis Mist, angka rata kanan tabular. Mobile: tabel bergulir di wadahnya sendiri.

### 9.10 Footer
Area gelap utama (selain panel kondisi laut, §9.7): latar Abyss, didahului pita garis mandarin 8 px. Logo versi *plate*, kolom menu, kontak (WhatsApp, email, alamat), ikon sosial putih, teks sekunder `--dd-on-dark-muted` `#9DB9BF`.

### 9.11 Tombol WhatsApp mengambang
Lingkaran 56 px, latar Teal, ikon putih, bayangan `--dd-shadow-md`, di pojok kanan bawah dengan jarak 20 px + safe area. Jangan menutupi CTA lain di mobile.

### 9.12 Struktur halaman (usulan)
Home · Diving (fun dive, dive site) · Courses · Snorkeling & Trips · Stay (bila ada) · About (cerita dragonet, tim, konservasi) · Contact/Book. Semua dengan versi `/id`.

---

## 10. Media sosial

Template ada di `brand/social/templates.html`; pratinjau PNG di `brand/social/preview/`, sampul highlight siap unggah di `brand/social/highlights/`. Setelah mengubah template, render ulang dengan `node brand/social/export.mjs` (butuh paket `playwright`). Kotak bergaris biru di template adalah tempat foto asli.

### 10.1 Profil
- **Foto profil:** `dragonet-divers-logo-white-bg.png` (badge sudah bulat, pas dengan potongan lingkaran). Ganti dengan versi resolusi tinggi bila sudah ada.
- **Nama:** Dragonet Divers Raja Ampat. **Handle:** usulan `@dragonetdivers` (cek ketersediaan).
- **Bio (contoh):**
  `Dive into colour 🐠 Small-group diving & snorkeling in Raja Ampat · Dampier Strait · Book via WhatsApp ↓`

### 10.2 Ukuran & zona aman

| Format | Ukuran | Zona aman |
| --- | --- | --- |
| Feed portrait (utama) | 1080 × 1350 | Margin 80 px; grid profil memotong ke 3:4, jadi teks penting jangan di 40 px tepi kiri-kanan |
| Feed persegi | 1080 × 1080 | Margin 80 px |
| Story / Reels / TikTok | 1080 × 1920 | Kosongkan 250 px atas dan 340 px bawah; TikTok juga 140 px kanan |
| Sampul Reels | 1080 × 1920 | Judul di tengah area 1080 × 1440 |
| Highlight | 1080 × 1920, ikon di lingkaran tengah | Ikon ±40% lebar lingkaran |

### 10.3 Template

| Kode | Nama | Format | Isi |
| --- | --- | --- | --- |
| **F1** | Dive Site Spotlight | Feed 4:5 | Foto penuh + kartu putih di bawah: nama site, kedalaman, arus, level, biota |
| **F2** | Marine Life Fact | Feed 4:5 | Latar putih, foto biota dalam lingkaran badge, judul Fredoka, satu fakta, pita garis mandarin |
| **F3** | Paket / Promo | Feed 4:5 | Latar putih, nama paket, harga dalam chip oranye, 3–4 poin, CTA WhatsApp |
| **F4** | Testimoni | Feed 4:5 | Latar Foam, bintang kuning, kutipan besar, nama & negara |
| **S1** | Dive Report | Story 9:16 | Kondisi hari ini: suhu, visibilitas, arus, biota yang terlihat |
| **S2** | Booking CTA | Story 9:16 | Foto + judul + stiker link/WhatsApp |
| **H** | Highlight covers | 1:1 | Lingkaran Teal, ikon garis putih: Dive, Snorkel, Trips, Courses, Reviews, Info |

### 10.4 Ritme grid
Selang-seling **foto – putih – foto** agar profil tetap terasa minimalis dan putih: foto bawah laut (F1/F2) diselingi template putih (F3/F4). Maksimal dua posting oranye berturut-turut.

### 10.5 Caption
1. Baris pembuka EN (≤ 1 kalimat, spesifik).
2. 2–3 kalimat detail EN.
3. Satu baris ringkas Bahasa Indonesia.
4. CTA: "Book via WhatsApp — link in bio."
5. 5–10 hashtag di akhir.

Emoji maksimal 2 per caption, bertema laut (🐠 🌅 🤿).

**Hashtag inti:** `#DragonetDivers #RajaAmpat #RajaAmpatDiving #DampierStrait #MandarinFish #DiveIndonesia #WonderfulIndonesia`
**Rotasi:** `#ScubaDiving #UnderwaterPhotography #MacroDiving #Snorkeling #WestPapua #CoralTriangle`

---

## 11. Checklist aksesibilitas
- Teks memenuhi rasio kontras di §3; jangan pakai Biru Laguna, Oranye Mandarin, atau Kuning Fajar untuk teks kecil.
- Semua tombol dan link punya fokus terlihat (cincin Laguna).
- Foto punya `alt` yang menyebut biota/lokasi ("Pair of mandarinfish at dusk, Raja Ampat").
- Animasi menghormati `prefers-reduced-motion`.
- Target sentuh minimal 44 × 44 px.

---

## 12. Cara pakai di website

```html
<link rel="stylesheet" href="/brand/tokens.css">
```

```css
body { font-family: var(--dd-font-body); color: var(--dd-fg); background: var(--dd-bg); }
h1, h2, h3 { font-family: var(--dd-font-display); font-weight: 600; }
```

Tailwind CSS 4 (`@theme`):

```css
@import "tailwindcss";
@theme {
  --color-dd-teal: #146E7F;
  --color-dd-teal-dark: #0F5866;
  --color-dd-teal-soft: #D9E8EB;
  --color-dd-lagoon: #1592AB;
  --color-dd-lagoon-wash: #ECF6F8;
  --color-dd-mandarin: #EB7817;
  --color-dd-mandarin-hover: #F28A33;
  --color-dd-ember: #B4560F;
  --color-dd-sunrise: #F9D13E;
  --color-dd-sunrise-wash: #FEF8E0;
  --color-dd-foam: #F4F9FA;
  --color-dd-mist: #DCE8EB;
  --color-dd-line-strong: #78939A;
  --color-dd-slate: #557079;
  --color-dd-abyss: #0A323B;
  --font-display: "Fredoka", "Nunito", system-ui, sans-serif;
  --font-body: "Plus Jakarta Sans", system-ui, sans-serif;
  --radius-card: 16px;
  --radius-frame: 28px;
}
```

Saat website dibangun, salin `brand/fonts/` ke folder aset publik dan sesuaikan path `@font-face` di `tokens.css`.

---

## 13. Yang masih dibutuhkan dari pemilik

- [ ] Logo resolusi tinggi atau vektor (SVG/AI/PDF), plus versi satu warna dari desainer.
- [ ] Pilihan tagline (§1).
- [ ] Handle media sosial yang sudah aktif/terdaftar (slot ikon footer sudah siap, isi lewat `NEXT_PUBLIC_INSTAGRAM` dst.). Domain website: dragonetdivers.com.
- [ ] Nomor WhatsApp booking. Email (halo@dragonetdivers.com) dan alamat base (Jl. Mayor, Kurkapa, Meos Mansar) sudah diberikan Oktober 2026.
- [ ] Foto & video asli (makro, luas, tim, kapal, senja).
- [ ] Data nyata untuk konten: daftar dive site, harga paket, jumlah tamu per pemandu, sertifikasi tim.
