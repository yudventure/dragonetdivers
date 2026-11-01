# Deploy ke Hostinger (Node.js Web App) + domain + MySQL

Proyek ini Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + MySQL (`mysql2`), dijalankan sebagai server Node.js dengan `npm start`. Alurnya:

```
branch kerja ──push──► CI: test + build ──lulus──► merge otomatis ke main ──► deploy: build di Hostinger + cek /api/health ──► website tayang
```

## 1. GitHub: merge & deploy otomatis

Workflow `.github/workflows/ci.yml` berjalan di setiap push:

| Cek | Isi |
| --- | --- |
| **build** | `npm ci`, `npm test`, `npm run build` |
| **merge** | Hanya untuk branch selain `main`, setelah **build** lulus. Membuka PR ke `main` (bila diizinkan), lalu menggabungkannya. Bila Actions belum diizinkan membuat PR, branch digabung langsung ke `main`. |
| **deploy / hostinger** | Setelah ada yang masuk `main`. Lewat API Hostinger (`scripts/hostinger-deploy.mjs`, `.github/workflows/deploy.yml`): memastikan auto-deploy website menunjuk branch `main`, membangun website dari `main` (atau memakai build yang sudah dipicu Hostinger), menunggu sampai selesai, lalu membuka `/api/health`. |
| **Keamanan** (`security.yml`) | Setiap hari 05.17 WIT dan lewat **Run workflow**: `npm audit fix` tanpa `--force`, lalu `npm test` + `npm run build`; bila ada perubahan, langsung masuk `main` dan tayang. Merah bila masih ada kerentanan yang butuh naik versi besar (rinciannya di ringkasan run). |

Jadi setiap push yang lulus test + build **langsung tayang**. Bila build gagal, tidak ada yang digabung. Bila branch bentrok dengan `main`, cek **merge** merah dan menjelaskan konfliknya. Bila build di Hostinger gagal, cek **deploy** merah dan menampilkan log build Hostinger (juga di ringkasan run di tab Actions).

Pengecualian:
- Branch berawalan `wip/` (mis. `wip/coba-galeri`) tidak digabung otomatis; pakai untuk percobaan.
- Matikan merge otomatis untuk semua branch: Settings → Secrets and variables → Actions → Variables → `AUTO_MERGE` = `false`.

### Token API Hostinger (wajib untuk deploy otomatis, sekali saja)

Tanpa token, cek **deploy** tetap hijau tetapi hanya memberi peringatan "Deploy Hostinger dilewati".

1. hPanel akun hosting → ikon profil kanan atas → **Profile** → **API** ([hpanel.hostinger.com/profile/api](https://hpanel.hostinger.com/profile/api)) → buat token baru, mis. nama `github-dragonetdivers`. Salin token (hanya tampil sekali).
2. github.com/yudventure/dragonetdivers → Settings → Secrets and variables → Actions → **New repository secret**: nama `HOSTINGER_API_TOKEN`, isi token tadi. Jangan tempel token di chat, issue, atau file di repo.
3. Opsional, tab **Variables** → `HOSTINGER_DOMAIN` = domain website di Hostinger (`dragonetdiversrajaampat.com`). Bila kosong, website dicari otomatis: website Node.js yang auto-deploy-nya terhubung ke repo ini, atau satu-satunya website Node.js di akun. Bila diisi, perbarui setiap kali domain website diganti.
4. Tab **Actions** → **Deploy** → **Run workflow** untuk deploy pertama. Setelah itu deploy berjalan sendiri setiap merge ke `main`.

Token berlaku untuk seluruh akun Hostinger. Bila bocor, hapus di halaman API hPanel dan buat yang baru.

Pengaturan GitHub yang disarankan (sekali saja, di github.com/yudventure/dragonetdivers):

| Pengaturan | Letak | Nilai |
| --- | --- | --- |
| Default branch | Settings → General → Default branch | `main` |
| Catatan PR untuk setiap merge (opsional) | Settings → Actions → General → Workflow permissions | Centang **Allow GitHub Actions to create and approve pull requests** |

## 2. Buat Node.js Web App di hPanel

Di akun Hostinger yang memegang paket **Business** (yang berisi thedampier.com, dll.):

1. **Websites → Buat website → Node.js Web App** → sumber **GitHub**.
2. Izinkan akses ke repository `yudventure/dragonetdivers`, pilih branch **`main`**, direktori proyek **`.`** (folder yang berisi `package.json`).
3. Pengaturan build:

   | Pengaturan | Nilai |
   | --- | --- |
   | Framework | Next.js |
   | Versi Node.js | 22.x |
   | Install command | `npm ci` |
   | Build command | `npm run build` |
   | Start command | `npm start` |
   | Output directory (bila diminta) | `.next` |

   `npm run build` sudah memakai `next build --webpack`. Turbopack bawaan Next.js 16 bisa gagal di server Hostinger karena versi GLIBC (pengalaman di Zanclus), jadi jangan ganti menjadi `next build` polos.
4. Isi **environment variables** (bagian 4) sebelum deploy pertama.
5. Branch harus **`main`**. Bila terlanjur memilih branch lain (mis. `claude/…`), merge ke `main` tidak akan tayang; cek **deploy** memindahkannya ke `main` otomatis begitu token API terpasang (bagian 1). Tanpa token: ubah branch di pengaturan Git website, lalu tekan **Redeploy**.
6. Pilih domain. Domain yang masih tercatat di akun Hostinger lain muncul tercoret ("Sudah terdaftar di Hostinger"); pakai **domain sementara** dulu dan sambungkan domain asli belakangan (bagian 3).

## 3. Domain

Domain utama website: **dragonetdiversrajaampat.com** (pindah akhir Oktober 2026; domain ini dipindahkan pemilik lama ke akun domain pemilik, dan website di akun hosting diganti ke domain ini). `dragonetdivers.com` (dipakai 20 sampai 31 Oktober 2026) kini hanya **Parked Domain** di website yang sama dan tidak diperpanjang setelah berakhir 2027-10-20. Kedua domain terdaftar di akun Hostinger yang lain dan diarahkan ke akun hosting lewat DNS (A `@` ke IP server, CNAME `www`, TXT verifikasi Hostinger).

**Domain utama = isian `NEXT_PUBLIC_SITE_URL`** (bawaan `https://dragonetdiversrajaampat.com`, jadi barisnya boleh dihapus). Dari situ website membuat tautan canonical, sitemap, email ke tamu, dan alamat kembali pembayaran. Halaman (termasuk `/admin`) yang dibuka lewat domain situs yang lain atau lewat `www.` dialihkan 301 ke domain utama oleh `proxy.js` (`src/lib/domain.js`). `/api` tidak dialihkan, jadi notifikasi Midtrans ke domain lama tetap sampai. Jangan buat aturan di menu **Domain → Pengalihan** untuk kedua domain ini, karena bisa berputar dengan pengalihan dari website.

### Setelah pindah domain

1. **Variabel environment**: `NEXT_PUBLIC_SITE_URL` = `https://dragonetdiversrajaampat.com` (atau hapus barisnya), lalu **Memindahkan** (Redeploy). `https://dragonetdivers.com/` harus berpindah ke domain baru.
2. Dashboard Midtrans (bila Notification URL pernah diisi): `https://dragonetdiversrajaampat.com/api/payments/midtrans`. Alamat yang benar tampil di `/admin/pembayaran`.
3. Google Search Console (langkahnya juga di panel **Pindah domain** `/admin/google`): tambahkan properti Awalan URL `https://dragonetdiversrajaampat.com` tanpa menghapus properti lama, tempel kode tag HTML barunya di `/admin/google` pada baris baru di bawah kode lama (keduanya tetap terpasang), kirim `sitemap.xml` di properti baru, lalu di properti lama buka **Setelan → Perubahan alamat** (Change of address) ke properti baru. `sitemap.xml` dan `robots.txt` yang dibuka lewat `dragonetdivers.com` berisi alamat domain lama (dialihkan 301), jadi sitemap di properti lama tetap sah.
4. Variabel GitHub `HOSTINGER_DOMAIN` (bila diisi) = `dragonetdiversrajaampat.com`.
5. **Email** `halo@dragonetdiversrajaampat.com` (bawaan email publik website sejak 31 Oktober 2026): buat kotak emailnya di hPanel **Email** untuk domain ini dan isi catatan MX/SPF/DKIM yang diminta di akun domain. Lalu di hPanel ganti `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `ADMIN_OTP_EMAIL` (dan `ADMIN_EMAIL` bila memakai alamat lama) ke alamat baru, dan pastikan kolom email di `/admin/kontak` kosong atau berisi alamat baru. Semua harus selesai sebelum `dragonetdivers.com` berakhir.

Zona DNS dragonetdiversrajaampat.com di akun pemilik sebelumnya per 20 Oktober 2026 (cadangan):

| Tipe | Nama | Isi | TTL |
| --- | --- | --- | --- |
| ALIAS | `@` | `dragonetdiversrajaampat.com.cdn.hstgr.net` | 300 |
| CNAME | `www` | `www.dragonetdiversrajaampat.com.cdn.hstgr.net` | 300 |
| A | `ftp` | `46.202.138.217` | 1800 |

## 4. Environment variables (hPanel → website → Environment variables)

| Nama | Isi |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Domain utama website (bagian 3), mis. `https://dragonetdiversrajaampat.com`. Kosong = `https://dragonetdiversrajaampat.com`. Setelah diubah, Redeploy. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Opsional. Lebih mudah diisi di `/admin/kontak` (langsung berlaku tanpa deploy ulang); nilai di sini hanya dipakai selama kolom di admin kosong. Nomor booking dengan kode negara, mis. `6281234567890` atau `+6281234567890` (spasi, tanda hubung, dan awalan `0` dirapikan). |
| `NEXT_PUBLIC_INSTAGRAM`, `NEXT_PUBLIC_TIKTOK`, `NEXT_PUBLIC_FACEBOOK`, `NEXT_PUBLIC_YOUTUBE` | Opsional. Lebih mudah diisi di `/admin/kontak`; nilai di sini (handle `@dragonetdivers` atau URL lengkap) hanya dipakai selama kolom di admin kosong, dan perlu build ulang setelah diubah. |
| `ADMIN_EMAIL` | Email operator untuk masuk ke dashboard `/admin` (tautan "Operator sign in" di footer). Rahasia, hanya di hPanel. |
| `ADMIN_PASSWORD` | Password operator, minimal 10 karakter. Mengganti nilainya langsung mengakhiri semua sesi yang sedang masuk. Spasi atau tanda kutip yang ikut tersalin ke kolom Value diabaikan. Lupa password: tekan **Lupa password?** di halaman masuk (perlu SMTP dan database). |
| `SESSION_SECRET` | Teks acak panjang untuk menandatangani sesi (mis. hasil `openssl rand -base64 48`). Tanpa ini operator harus masuk lagi setiap aplikasi dimulai ulang. |
| `USD_IDR_RATE` | Opsional. Kurs tetap Rupiah per 1 US$ (mis. `16250`) untuk pilihan dolar di website (bila dinyalakan di `/admin/kontak`) dan tagihan PayPal. Kosong = kurs harian Bank Sentral Eropa (Frankfurter), diperbarui otomatis. |
| `MIDTRANS_SERVER_KEY` | Server Key dari dashboard Midtrans (Settings → Access Keys). Awalan `SB-Mid-server-` untuk uji coba, `Mid-server-` untuk pembayaran sungguhan. Rahasia, hanya di hPanel. |
| `MIDTRANS_PRODUCTION` | `true` untuk pembayaran sungguhan. Hapus barisnya selama uji coba (sandbox). |
| `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` | Dari developer.paypal.com → Apps & Credentials (pilih Sandbox atau Live). Rahasia, hanya di hPanel. |
| `PAYPAL_MODE` | `live` untuk pembayaran sungguhan. Hapus barisnya selama uji coba (sandbox). |
| `SMTP_HOST` | Server email untuk kode lupa password admin dan email pesanan ke tamu. Email Hostinger: `smtp.hostinger.com`. |
| `SMTP_PORT` | `465` (SSL, bawaan) atau `587` (STARTTLS). |
| `SMTP_USER`, `SMTP_PASS` | Alamat email pengirim lengkap (mis. `halo@dragonetdiversrajaampat.com`) dan password kotak email itu. Rahasia, hanya di hPanel. |
| `SMTP_FROM` | Opsional. Nama dan alamat pengirim, mis. `Dragonet Divers <halo@dragonetdiversrajaampat.com>`. Kosong = "Dragonet Divers" dengan alamat `SMTP_USER`. |
| `ADMIN_OTP_EMAIL` | Opsional. Kotak masuk yang menerima kode **Lupa password**. Kosong = dikirim ke `ADMIN_EMAIL`. |
| `MYSQL_HOST` | Hostname database dari hPanel |
| `MYSQL_PORT` | `3306` |
| `MYSQL_DATABASE` | Nama database lengkap, mis. `u123456789_dragonet` |
| `MYSQL_USER` | User database lengkap, mis. `u123456789_dragonet` |
| `MYSQL_PASSWORD` | Password user database |

Jangan isi dengan teks contoh (mis. `masih uji coba`): variabel yang belum punya nilai **hapus barisnya**, atau isi dengan `-` saja. hPanel (termasuk tombol **Impor .env**) tidak menerima value kosong, jadi `-` dipakai sebagai tanda "belum diisi" dan dibaca aplikasi sama dengan kosong (`src/lib/env.js`). Isian yang salah tidak lagi menggagalkan build, tetapi diabaikan dan dilaporkan di `warnings` / `database.issues` pada `/api/health`.

Variabel `NEXT_PUBLIC_*` ditanam saat build; setelah diubah, deploy ulang. Daftar lengkap ada di `.env.example`.

### Pembayaran paket (Midtrans, PayPal, transfer bank, tunai)

Paket, pesanan, dan pengaturan pembayaran disimpan di MySQL, jadi database (bagian 5) wajib terhubung.

1. Isi key Midtrans dan/atau PayPal di tabel di atas, lalu deploy ulang. Mulai dengan key **sandbox** untuk uji coba.
2. Buka `/admin/pembayaran`: tekan **Uji koneksi** untuk tiap penyedia, centang cara bayar yang ditawarkan, isi rekening untuk transfer bank, lalu **Simpan pengaturan**. **Tunai di dive center** menyala sejak awal, jadi checkout tetap bisa dipakai walau Midtrans, PayPal, dan rekening belum diisi. Transfer bank baru tampil di checkout setelah dicentang dan minimal satu rekening diisi; rekeningnya langsung terlihat begitu tamu memilih transfer. Rekening BRI dari pemilik (PT Nusa Birawa Integrated, dengan SWIFT/BIC untuk transfer dari luar negeri) dimasukkan otomatis sekali saat aplikasi terhubung ke database, dan transfer bank ikut menyala; setelah itu rekening diubah atau dihapus di halaman yang sama dan tidak kembali.
3. Buka `/admin/paket` dan tambahkan paket (nama dan isi dalam English dan Indonesia, harga Rupiah). Paket aktif langsung tampil di halaman layanannya.
4. Coba satu pesanan dari situs dengan mode sandbox. Notifikasi Midtrans dikirim otomatis ke `https://dragonetdiversrajaampat.com/api/payments/midtrans`; alamat yang sama boleh juga diisi di dashboard Midtrans (Settings → Payment → Notification URL).
5. Setelah uji coba lancar, ganti ke key production/live dan tambahkan `MIDTRANS_PRODUCTION=true` / `PAYPAL_MODE=live`. Di checkout, label "Mode uji" hilang begitu mode sungguhan aktif.

### Modul tim di /admin

Kalender reservasi, Tamu, Galeri foto & video, Kalender konten, Agen & mitra, Pegawai, Absensi, Slip gaji, Buku kas, dan Laba rugi & pajak menyimpan datanya di MySQL (tabel `admin_records`, `media`, dan `settings`, dibuat otomatis oleh migrasi 006). Tidak ada environment variable baru. Setiap modul punya tombol **Unduh Excel**.

- **Paket & harga**: 34 paket dari daftar harga pemilik 2026 masuk otomatis sekali saat aplikasi pertama kali terhubung ke database (paket yang namanya sudah ada dilewati, paket yang kemudian dihapus tim tidak kembali). Panel **Daftar harga 2026** menampilkan isinya, dengan tombol **Tambahkan paket** untuk memasukkan lagi yang belum ada. Harga dan isi paket diubah di daftar paket yang sama dan langsung tampil di halaman layanan. Panel **Layanan di website** di halaman yang sama menampilkan atau menyimpan seluruh layanan (bawaan Oktober 2026: fun dive, trip pulau, dan dusk dive tampil, snorkeling dan kursus selam disimpan). Layanan yang disimpan hilang dari menu, beranda, dan footer, halamannya 404, dan paketnya tidak bisa dipesan, tetapi paket dan harganya tetap ada.
- **Kalender reservasi**: pesanan website tampil otomatis, dan tiap tanggal menunjukkan tamu terisi dari kapasitasnya (mis. "Selam 12/30"). Tanggal yang ditutup (**Tutup tanggal ini**) dan **Kapasitas harian** (bawaan 30 tamu selam per hari) tampil di kalender tempat halaman layanan dan ditolak oleh checkout website bila penuh.
- **Galeri foto & video**: **Tambah foto** menerima 1 sampai 40 foto sekaligus. Foto diperkecil dulu di perangkat (foto kamera 10 MB terkirim sekitar 0,5 MB), diunggah dengan progres, dan dicoba ulang otomatis bila koneksi putus; setelah semua terunggah, satu tombol menyimpan semuanya. Foto disimpan di database (diperkecil lagi di server), jadi tidak hilang saat situs dibangun ulang. Beranda menampilkan 12 foto dulu dengan tombol untuk melihat sisanya, jadi galeri yang besar tidak memperlambat halaman. Foto dengan ukuran petak Otomatis tersusun mosaik (besar, kecil, tinggi bergantian) dengan keterangan di kiri bawah foto. Begitu ada satu item yang tampil, galeri bawaan di beranda diganti. Halamannya memuat panduan ukuran foto dan video, pratinjau petak, dan peringatan bila foto terlalu kecil.
- **Kontak, sosial & mata uang**: nomor WhatsApp, email publik, alamat, tautan Google Maps, dan akun Instagram, TikTok, Facebook, YouTube diisi tim di `/admin/kontak` dan langsung berlaku tanpa deploy ulang. Di halaman yang sama ada sakelar **Tampilkan pilihan dolar AS (USD)**: mati (bawaan) berarti semua harga di website hanya dalam Rupiah.
- **Buku kas**: pesanan website yang lunas masuk otomatis sebagai pemasukan. Pengeluaran dan pemasukan lain dicatat tim.
- **Galat di admin**: bila halaman admin gagal tampil setelah menyimpan (layar "This page couldn't load"), halaman kini dimuat ulang sendiri sekali, dan galatnya tercatat di **Mode developer** bagian **Galat di peramban admin** untuk dikirim ke developer.
- **Mode developer** (menu Sistem): tutup seluruh website, halaman tertentu, atau bagian beranda selama sedang diperbaiki. Pengunjung mendapat halaman perawatan (status 503, jadi Google kembali lagi nanti) atau kartu "sedang diperbarui" di bagian itu, dan checkout menolak pesanan baru bila ikut ditutup. Operator yang masuk di `/admin` tetap melihat semuanya dengan bilah kecil di bawah layar, dan bisa memakai **Lihat seperti pengunjung** selama 30 menit. Halaman status pesanan tamu dan pembayaran yang sedang berjalan tidak pernah ditutup. Disimpan di tabel `settings`, tanpa environment variable baru.

### Email ke tamu dan lupa password admin

Isi `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, dan `SMTP_PASS` (tabel di atas), lalu deploy ulang. Di `/admin/pembayaran` bagian **Email ke tamu**, tekan **Kirim email uji ke operator** dan buka pratinjau tiap email. Setelah aktif:

- Tamu menerima email **pesanan diterima** (menunggu pembayaran, dengan rekening untuk transfer bank), email **pembayaran belum masuk** saat separuh waktu bayar lewat (status Midtrans/PayPal dicek dulu), dan email **pembayaran diterima** saat lunas. Email ditulis dalam bahasa yang dipakai tamu saat memesan, dibalas ke email publik dari `/admin/kontak` (bawaan `halo@dragonetdiversrajaampat.com`).
- `/admin/pesanan` menampilkan email yang sudah terkirim per pesanan, dengan tombol **Email pengingat** dan **Kirim ulang email lunas**.
- Halaman masuk `/admin` punya **Lupa password?**: kode 6 angka dikirim ke `ADMIN_EMAIL` (atau `ADMIN_OTP_EMAIL`), berlaku 10 menit. Password baru disimpan sebagai hash di database dan berlaku sampai `ADMIN_PASSWORD` di hPanel diganti; setelah itu password hPanel yang berlaku lagi.

Midtrans menagih dalam Rupiah. PayPal tidak menerima Rupiah, jadi menagih dalam dolar AS dengan kurs hari itu (dibulatkan ke atas per sen) yang dikunci saat tamu memesan. Transfer bank ditandai lunas oleh tim di `/admin/pesanan` setelah dana masuk. Pesanan tunai menahan tempat tanpa batas waktu bayar (tanpa email pengingat); setelah tamu membayar di dive center, tekan **Tunai diterima** di `/admin/pesanan` supaya pesanan lunas, tamu mendapat email pembayaran diterima, dan buku kas mencatatnya sebagai tunai. Pesanan tunai yang tidak jadi dibatalkan di halaman yang sama.

## 5. Database MySQL

1. hPanel → **Databases → MySQL Databases**: buat database (mis. `dragonet`) dan user dengan password kuat. Hostinger menambahkan prefix akun, mis. `u123456789_dragonet`.
2. Isi variabel `MYSQL_*` di atas, lalu deploy ulang.
3. Buka `/api/health`. Bila `database.ok` bernilai `true`, tabel sudah dibuat otomatis dari `database/migrations/` (`schema_migrations`, `booking_requests`). Tidak perlu impor SQL.
   Alternatif manual: phpMyAdmin → pilih database → Import file `.sql` dari `database/migrations/` sesuai urutan nomor.

Bila `/api/health` menampilkan error, lihat `database.code`:

| Kode | Arti & tindakan |
| --- | --- |
| `ER_ACCESS_DENIED_ERROR` | User/password salah, atau user tidak boleh login dari server aplikasi. Cek ulang `MYSQL_USER`/`MYSQL_PASSWORD`. Di Zanclus, `localhost` ditolak dan yang berhasil adalah hostname `srvXXXX.hstgr.io` dari hPanel + izin di **Remote MySQL**. |
| `ER_HOST_NOT_PRIVILEGED` | Tambahkan IP keluar aplikasi di **Remote MySQL** (bukan IP database). |
| `ER_BAD_DB_ERROR` | Nama database harus lengkap dengan prefix. |
| `ENOTFOUND` / `ECONNREFUSED` / `ETIMEDOUT` | Periksa `MYSQL_HOST`/`MYSQL_PORT`; isi hostname saja, tanpa `https://`. |

## 6. Menambah tabel baru

Buat file `database/migrations/NNN_nama.sql` (nomor berikutnya, 3 digit) berisi `CREATE TABLE IF NOT EXISTS ...`. Aplikasi menjalankannya otomatis pada koneksi database pertama setelah deploy. Dari komputer sendiri: isi `.env.local`, lalu `npm run db:migrate`.

## 7. Diagnosis cepat

- **Build gagal**: pastikan Node 22.x, direktori proyek `.`, dan `package-lock.json` ikut. Baca error pertama di log build.
- **Website 503 / tidak jalan**: pastikan start command `npm start` dan build selesai. `PORT` diberikan Hostinger, tidak perlu diisi.
- **Login admin ditolak padahal password benar**: pastikan `ADMIN_EMAIL` sama persis dengan email yang diketik, lalu cek apakah browser mengisi password lama secara otomatis. Atau pakai **Lupa password?** di halaman masuk.
- **Email tidak terkirim**: `/admin/pembayaran` → **Email ke tamu** menunjukkan variabel SMTP yang kurang dan alasan penolakan server email.
- **Perubahan tidak muncul**: buka tab Actions → run terakhir → cek **deploy**. "Dilewati" = token API belum dipasang (bagian 1). Merah = baca log build Hostinger di ringkasan run. Deploy ulang kapan saja: Actions → **Deploy** → **Run workflow**.
