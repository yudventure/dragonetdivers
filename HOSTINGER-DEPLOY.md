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

Jadi setiap push yang lulus test + build **langsung tayang**. Bila build gagal, tidak ada yang digabung. Bila branch bentrok dengan `main`, cek **merge** merah dan menjelaskan konfliknya. Bila build di Hostinger gagal, cek **deploy** merah dan menampilkan log build Hostinger (juga di ringkasan run di tab Actions).

Pengecualian:
- Branch berawalan `wip/` (mis. `wip/coba-galeri`) tidak digabung otomatis; pakai untuk percobaan.
- Matikan merge otomatis untuk semua branch: Settings → Secrets and variables → Actions → Variables → `AUTO_MERGE` = `false`.

### Token API Hostinger (wajib untuk deploy otomatis, sekali saja)

Tanpa token, cek **deploy** tetap hijau tetapi hanya memberi peringatan "Deploy Hostinger dilewati".

1. hPanel akun hosting → ikon profil kanan atas → **Profile** → **API** ([hpanel.hostinger.com/profile/api](https://hpanel.hostinger.com/profile/api)) → buat token baru, mis. nama `github-dragonetdivers`. Salin token (hanya tampil sekali).
2. github.com/yudventure/dragonetdivers → Settings → Secrets and variables → Actions → **New repository secret**: nama `HOSTINGER_API_TOKEN`, isi token tadi. Jangan tempel token di chat, issue, atau file di repo.
3. Opsional, tab **Variables** → `HOSTINGER_DOMAIN` = domain website di Hostinger (`dragonetdivers.com`). Bila kosong, website dicari otomatis: website Node.js yang auto-deploy-nya terhubung ke repo ini, atau satu-satunya website Node.js di akun. Bila diisi, perbarui setiap kali domain website diganti.
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

Domain utama website: **dragonetdivers.com** (sudah tersambung ke website Node.js di akun hosting, 20 Oktober 2026; sebelumnya domain sementara `gold-walrus-261903.hostingersite.com`).

Setelah domain website diganti:
1. **Environment variables:** `NEXT_PUBLIC_SITE_URL` = `https://dragonetdivers.com`, atau hapus barisnya (nilai bawaan sama). Nilai lama seperti `https://dragonetdiversrajaampat.com` membuat tautan bagikan (Open Graph) menunjuk domain yang salah.
2. **SSL:** Security → SSL, pastikan sertifikat aktif untuk `dragonetdivers.com` dan `www`.
3. **Variabel GitHub** `HOSTINGER_DOMAIN` (bila diisi) diganti ke `dragonetdivers.com`.
4. **Deploy ulang** (Actions → **Deploy** → **Run workflow**), lalu uji `https://dragonetdivers.com/api/health` harus menampilkan `"app":"dragonet-divers"`.

### dragonetdiversrajaampat.com (opsional)

Domain lama ini masih tercatat di **akun Hostinger lain** (akses collaborator `backupdata@dewarangga.com`), jadi tidak bisa ditambahkan ke akun hosting. Bila nanti ingin dipakai sebagai alamat kedua yang dialihkan ke `dragonetdivers.com`: minta Hostinger memindahkan domain itu ke akun hosting (chat bantuan dari akun lama), lalu di akun hosting tambahkan sebagai domain parkir/alias atau buat redirect 301 ke `https://dragonetdivers.com`.

Zona DNS-nya di akun lama per 20 Oktober 2026 (cadangan):

| Tipe | Nama | Isi | TTL |
| --- | --- | --- | --- |
| ALIAS | `@` | `dragonetdiversrajaampat.com.cdn.hstgr.net` | 300 |
| CNAME | `www` | `www.dragonetdiversrajaampat.com.cdn.hstgr.net` | 300 |
| A | `ftp` | `46.202.138.217` | 1800 |

## 4. Environment variables (hPanel → website → Environment variables)

| Nama | Isi |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://dragonetdivers.com` (boleh dihapus: nilai bawaan sama) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Nomor booking, mis. `6281234567890` (tanpa `+`, spasi, atau `0` di depan). Kosong = tombol WhatsApp disembunyikan. |
| `NEXT_PUBLIC_INSTAGRAM`, `NEXT_PUBLIC_TIKTOK`, `NEXT_PUBLIC_FACEBOOK`, `NEXT_PUBLIC_YOUTUBE` | Akun media sosial untuk ikon di footer: handle (`@dragonetdivers`) atau URL lengkap di domain jaringan itu. Kosong = ikon tidak ditampilkan. Perlu build ulang setelah diubah. |
| `ADMIN_EMAIL` | Email operator untuk masuk ke dashboard `/admin` (tautan "Operator sign in" di footer). Rahasia, hanya di hPanel. |
| `ADMIN_PASSWORD` | Password operator, minimal 10 karakter. Mengganti nilainya langsung mengakhiri semua sesi yang sedang masuk. |
| `SESSION_SECRET` | Teks acak panjang untuk menandatangani sesi (mis. hasil `openssl rand -base64 48`). Tanpa ini operator harus masuk lagi setiap aplikasi dimulai ulang. |
| `USD_IDR_RATE` | Opsional. Kurs tetap Rupiah per 1 US$ (mis. `16250`) untuk pilihan mata uang di header. Kosong = kurs harian Bank Sentral Eropa (Frankfurter), diperbarui otomatis. |
| `MYSQL_HOST` | Hostname database dari hPanel |
| `MYSQL_PORT` | `3306` |
| `MYSQL_DATABASE` | Nama database lengkap, mis. `u123456789_dragonet` |
| `MYSQL_USER` | User database lengkap, mis. `u123456789_dragonet` |
| `MYSQL_PASSWORD` | Password user database |

Jangan isi dengan teks contoh (mis. `masih uji coba`): variabel yang belum punya nilai **hapus barisnya**. Isian yang salah tidak lagi menggagalkan build, tetapi diabaikan dan dilaporkan di `warnings` / `database.issues` pada `/api/health`.

Variabel `NEXT_PUBLIC_*` ditanam saat build; setelah diubah, deploy ulang. Daftar lengkap ada di `.env.example`.

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
- **Perubahan tidak muncul**: buka tab Actions → run terakhir → cek **deploy**. "Dilewati" = token API belum dipasang (bagian 1). Merah = baca log build Hostinger di ringkasan run. Deploy ulang kapan saja: Actions → **Deploy** → **Run workflow**.
