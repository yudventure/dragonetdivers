# Dragonet Divers — catatan untuk agen

Website dive center Dragonet Divers Raja Ampat (dragonetdiversrajaampat.com). Pemilik berbahasa Indonesia: dokumentasi & komentar kode dalam Bahasa Indonesia, UI website English (default) dengan versi Indonesia.

## Stack & perintah
- Next.js 16 App Router (JavaScript, bukan TypeScript), React 19, Tailwind CSS 4, MySQL via `mysql2`.
- `npm ci` · `npm test` (node:test di `tests/`) · `npm run build` (`next build --webpack`, wajib webpack untuk Hostinger) · `npm run dev`.
- Jalankan `npm test && npm run build` sebelum push; CI menjalankan hal yang sama (cek **build**).

## Struktur
- `app/` halaman & route API; `app/api/health` untuk cek deploy + database.
- `src/components/` komponen UI; `src/lib/site.js` data situs & WhatsApp.
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
- `main` = produksi; Hostinger membangun dari `main`. Kerjakan di branch lain; workflow Auto PR membuka PR ke `main` otomatis.
- Panduan Hostinger, DNS, dan MySQL: `HOSTINGER-DEPLOY.md`.
