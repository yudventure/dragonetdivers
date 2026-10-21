# Dragonet Divers — catatan untuk agen

Website dive center Dragonet Divers Raja Ampat (dragonetdivers.com). Pemilik berbahasa Indonesia: dokumentasi & komentar kode dalam Bahasa Indonesia, UI website English (default, di `/`) dan Bahasa Indonesia (di `/id`).

## Stack & perintah
- Next.js 16 App Router (JavaScript, bukan TypeScript), React 19, Tailwind CSS 4, MySQL via `mysql2`.
- `npm ci` · `npm test` (node:test di `tests/`) · `npm run build` (`next build --webpack`, wajib webpack untuk Hostinger) · `npm run dev`.
- Jalankan `npm test && npm run build` sebelum push; CI menjalankan hal yang sama (cek **build**).

## Struktur
- **Dua bahasa**: halaman publik di `app/[lang]/` (root layout, `<html lang>`), `proxy.js` menulis ulang alamat English ke `/en/...` di belakang layar dan mengalihkan `/en/...` ke alamat tanpa awalan (aturan di `src/lib/i18n.js`, `localeRoute`). Tautan internal selalu lewat `localeHref(lang, "/...")`. Teks antarmuka di `src/content/ui.js` (`en` dan `id` berkunci sama, dijaga `tests/i18n.test.js`); isi layanan, FAQ, langkah perjalanan, galeri, dan teks peta juga punya versi `en`/`id`. Setiap komponen halaman menerima prop `lang`. Bahasa Indonesia memakai sapaan "kamu". Teks baru wajib ditulis dalam kedua bahasa.
- `/admin` punya root layout sendiri (`app/admin/layout.jsx`, Bahasa Indonesia saja). Alamat yang tidak ada → `app/[lang]/[...missing]` → `app/[lang]/not-found.jsx` (404 dalam bahasanya; karena root layout ada di segmen dinamis, Next.js menggambarnya di peramban, status tetap 404).
- **Menu** (`SiteHeader.jsx` + `SiteNav.jsx`): desktop menu berlatar pil (Layanan berisi kelima halaman layanan, Titik selam, Galeri, Cara ke sini, FAQ), tombol EN / ID, pilihan mata uang, Book a dive; ponsel/tablet panel layar penuh. Halaman mengirim `path` tanpa awalan bahasa ke `SiteHeader` untuk tombol EN / ID.
- **Mata uang** USD / IDR: kurs harian ECB lewat Frankfurter (`src/server/exchange-rate.js`, cache 12 jam) atau `USD_IDR_RATE` dari hPanel; logika di `src/lib/currency.js`. Pilihan tamu disimpan di localStorage (`src/components/currency.jsx`, `CurrencyProvider` di layout; awal English → USD, Indonesia → IDR). Harga kelak ditulis dalam Rupiah dengan `<Price idr={1500000} />` (USD tampil sebagai perkiraan). Kurs hari ini juga tampil di jawaban FAQ uang tunai (`rate: true`).
- `app/` halaman & route API; `app/api/health` untuk cek deploy + database; `app/api/conditions` kondisi laut live Selat Dampier (Open-Meteo, logika di `src/lib/sea-conditions.js`, cache 15 menit).
- `src/components/` komponen UI; `src/lib/site.js` data situs, kontak (email, alamat & titik base di Kurkapa, Mansuar), WhatsApp, dan media sosial (`NEXT_PUBLIC_INSTAGRAM` dst.); `src/lib/services.js` daftar layanan (grid beranda + halaman `app/[lang]/services/[slug]`, ilustrasi di `src/assets/services/<slug>.webp`).
- `src/lib/getting-here.js` + `GettingHere.jsx`: seksi "How to get here" (Sorong → Waisai → Kurkapa); peta rutenya `public/media/getting-here-map.svg` dibuat `node scripts/getting-here-map.mjs`.
- `src/content/gallery.js`: isi galeri beranda (foto di `src/assets/gallery/`, klip loop sendiri di `public/media/`, tautan YouTube/Shorts/TikTok/Instagram/Facebook dibaca `src/lib/video-embed.js`). Player pihak ketiga dimuat hanya saat petaknya terlihat (`EmbedVideo.jsx`).
- `src/components/peta-raja-ampat/`: peta Raja Ampat bersama (skill peta-raja-ampat, sama dengan DAMPIER & Zanclus); di beranda hanya titik selam & snorkel (`DiveSiteMap.jsx`, `src/lib/dive-map.js`, tema `.peta-dragonet`). Baca README di folder itu sebelum mengubah datanya.
- `/admin` dashboard tim (acuan: admin Zanclus): login operator `ADMIN_EMAIL` + `ADMIN_PASSWORD` dari hPanel, sesi cookie httpOnly bertanda tangan `SESSION_SECRET` (`src/server/admin-auth.js`, `src/lib/admin-session.js`, batas 5 percobaan/15 menit per IP). UI di `src/admin/`; baru "Ringkasan cepat", modul lain menyusul.
- FAQ beranda: `src/content/faq.js` (fakta umum dicek ke sumber, tanpa harga/jadwal).
- `src/server/db.js` → pakai `query(sql, params)` untuk semua akses database (server saja).
- `database/migrations/NNN_nama.sql`: skema, idempoten (`CREATE TABLE IF NOT EXISTS`), dijalankan otomatis. Jangan ubah file migrasi yang sudah di-merge; buat nomor baru.
- `brand/`: identitas visual. Pedoman di `BRANDING.md`.

## Aturan brand (wajib)
- Dasar putih; warna hanya dari tema Tailwind di `app/globals.css` (palet bawaan Tailwind dimatikan): `teal`, `lagoon`, `mandarin`, `sunrise`, `ember`, `abyss`, `slate`, `foam`, `mist`, dst. `tests/brand-tokens.test.js` menjaga nilainya sama dengan `brand/tokens.json`.
- Judul `font-display` (Fredoka 600), teks `font-sans` (Plus Jakarta Sans).
- Satu tombol oranye (`bg-mandarin text-abyss`) per layar; teks putih di atas oranye dilarang.
- Logo di luar latar putih pakai `dragonet-divers-logo-plate.png` (pita tulisan file asli transparan).
- Jangan menulis harga, jadwal, atau klaim bisnis yang belum diberikan pemilik.

## Git & deploy
- `main` = produksi; Hostinger membangun dari `main`. Kerjakan di branch lain.
- **Setiap push ke branch selain `main` yang lulus test + build otomatis digabung ke `main` dan tayang** (job `merge` di `.github/workflows/ci.yml`, lalu job `deploy` → `.github/workflows/deploy.yml` → `scripts/hostinger-deploy.mjs` lewat API Hostinger, secret `HOSTINGER_API_TOKEN`). Push hanya pekerjaan yang sudah selesai dan teruji; percobaan pakai branch `wip/…`.
- Panduan Hostinger, DNS, dan MySQL: `HOSTINGER-DEPLOY.md`.
