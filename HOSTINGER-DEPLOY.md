# Deploy ke Hostinger (Node.js Web App) + domain + MySQL

Proyek ini Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + MySQL (`mysql2`), dijalankan sebagai server Node.js dengan `npm start`. Alurnya:

```
branch kerja ──push──► CI: test + build ──lulus──► merge otomatis ke main ──► Hostinger build & deploy ──► dragonetdiversrajaampat.com
```

## 1. GitHub: merge otomatis

Workflow `.github/workflows/ci.yml` berjalan di setiap push:

| Cek | Isi |
| --- | --- |
| **build** | `npm ci`, `npm test`, `npm run build` |
| **merge** | Hanya untuk branch selain `main`, setelah **build** lulus. Membuka PR ke `main` (bila diizinkan), lalu menggabungkannya. Bila Actions belum diizinkan membuat PR, branch digabung langsung ke `main`. |

Jadi setiap push yang lulus test + build **langsung tayang** (setelah Hostinger membangun ulang). Bila build gagal, tidak ada yang digabung. Bila branch bentrok dengan `main`, cek **merge** merah dan menjelaskan konfliknya.

Pengecualian:
- Branch berawalan `wip/` (mis. `wip/coba-galeri`) tidak digabung otomatis; pakai untuk percobaan.
- Matikan merge otomatis untuk semua branch: Settings → Secrets and variables → Actions → Variables → `AUTO_MERGE` = `false`.

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
5. Nyalakan **auto-deploy** dari GitHub bila opsinya ada. Bila tidak ada, tekan **Redeploy** setelah setiap merge ke `main`.
6. Pilih domain: klik **Gunakan domain sementara**. `dragonetdiversrajaampat.com` belum bisa dipilih di sini karena masih tercatat di akun Hostinger lain (muncul tercoret, "Sudah terdaftar di Hostinger"). Domain asli disambungkan belakangan (bagian 3).

## 3. Sambungkan domain dragonetdiversrajaampat.com

Domain ini masih tercatat di **akun Hostinger lain** (akses collaborator `backupdata@dewarangga.com`), sedangkan hosting ada di akun paket Business. Hostinger hanya mengizinkan satu domain berada di satu akun, jadi wizard menolak domain ini ("Sudah terdaftar di Hostinger"). Domain harus dipindah atau dilepas dari akun lama dulu.

Zona DNS di akun lama per 20 Oktober 2026 (simpan sebagai cadangan):

| Tipe | Nama | Isi | TTL |
| --- | --- | --- | --- |
| ALIAS | `@` | `dragonetdiversrajaampat.com.cdn.hstgr.net` | 300 |
| CNAME | `www` | `www.dragonetdiversrajaampat.com.cdn.hstgr.net` | 300 |
| A | `ftp` | `46.202.138.217` | 1800 |

### Langkah

1. **Jalankan website dulu di domain sementara** (bagian 2, langkah 6), lalu uji `https://<domain-sementara>/api/health`.
2. **Bebaskan domain dari akun lama.** Pilih salah satu:
   - **Pindahkan domain ke akun hosting (disarankan, tidak ada yang dihapus).** Dari akun lama, buka chat bantuan Hostinger dan minta: *"Tolong pindahkan domain dragonetdiversrajaampat.com dari akun ini ke akun Hostinger saya [email akun hosting]."* Pemindahan antar-akun diproses Hostinger dan biasanya butuh konfirmasi pemilik kedua akun.
   - **Hapus dari akun lama (lebih cepat, hanya bila domain tidak dibeli di akun itu).** Screenshot semua record DNS terlebih dahulu, terutama MX/TXT bila ada email. Lalu di akun lama hapus website yang memakai domain ini (Websites) dan/atau entri domainnya (Domains). Domain akan tidak bisa dibuka sebentar sampai langkah 3 selesai.
3. **Akun hosting:** dashboard website → **Hubungkan / ganti domain** → `dragonetdiversrajaampat.com`.
4. **DNS:** bila nameserver domain mengarah ke Hostinger (`ns1.dns-parking.com`, `ns2.dns-parking.com`), zona DNS kini dikelola di akun hosting dan record untuk website dibuat otomatis. Masukkan kembali record lain (MX/TXT) dari cadangan bila ada. Bila nameserver di tempat lain, isi record yang diminta hPanel di tempat DNS itu.
5. **Akun hosting:** pasang/cek **SSL** (Security → SSL) setelah DNS mengarah ke hosting ini.
6. Uji: `https://dragonetdiversrajaampat.com/api/health` harus menampilkan `"app":"dragonet-divers"`.

## 4. Environment variables (hPanel → website → Environment variables)

| Nama | Isi |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://dragonetdiversrajaampat.com` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Nomor booking, mis. `6281234567890` (tanpa `+`, spasi, atau `0` di depan). Kosong = tombol WhatsApp disembunyikan. |
| `MYSQL_HOST` | Hostname database dari hPanel |
| `MYSQL_PORT` | `3306` |
| `MYSQL_DATABASE` | Nama database lengkap, mis. `u123456789_dragonet` |
| `MYSQL_USER` | User database lengkap, mis. `u123456789_dragonet` |
| `MYSQL_PASSWORD` | Password user database |

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
- **Perubahan tidak muncul**: pastikan PR sudah di-merge ke `main` dan deployment terbaru sukses.
