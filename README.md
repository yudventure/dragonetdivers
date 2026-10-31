# Dragonet Divers Raja Ampat

Website dive center Dragonet Divers, Raja Ampat — **dragonetdiversrajaampat.com** (dulu dragonetdivers.com, kini Parked Domain yang dialihkan). Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + MySQL, dijalankan sebagai Node.js Web App di Hostinger.

## Development

Node.js 22 (lihat `.nvmrc`).

```sh
npm ci
cp .env.example .env.local   # isi bila perlu database lokal
npm run dev                  # http://localhost:3000
npm test
npm run build && npm start
```

`/api/health` menampilkan status aplikasi dan koneksi database (tanpa menampilkan kredensial).

## Alur kerja

1. Kerjakan perubahan di branch selain `main`, lalu push.
2. GitHub Actions menjalankan test + build. Bila lulus, branch **otomatis digabung ke `main`** (lewat PR bila diizinkan).
3. Cek **deploy** menyuruh Hostinger membangun versi baru dari `main` lewat API, menunggu sampai selesai, lalu membuka `/api/health`. Butuh secret `HOSTINGER_API_TOKEN` (sekali pasang). Deploy ulang manual: Actions → **Deploy** → **Run workflow**.

Branch berawalan `wip/` tidak digabung otomatis; variabel repo `AUTO_MERGE=false` mematikannya untuk semua branch.

Pengaturan GitHub, Hostinger, domain, dan MySQL: **[HOSTINGER-DEPLOY.md](./HOSTINGER-DEPLOY.md)**.

## Struktur

| Folder | Isi |
| --- | --- |
| `app/` | Halaman, layout, route API (`app/api/health`) |
| `src/components/` | Komponen UI (header, footer, ikon) |
| `src/server/` | Koneksi MySQL (`db.js`), konfigurasi, migrasi |
| `database/migrations/` | Skema SQL berurutan, dijalankan otomatis |
| `tests/` | Test `node:test` |
| `brand/` | Identitas visual: logo, font, token, template sosial |

## Brand

- Pedoman: [BRANDING.md](./BRANDING.md)
- Unduhan: `brand/export/Dragonet-Divers-Brand-Identity.pdf` (buku pedoman) dan `brand/export/Dragonet-Divers-Logo-Kit.zip` (semua file logo)
- Brand book interaktif: `brand/brand-guide.html`; template media sosial: `brand/social/templates.html`
- Warna di Tailwind (`app/globals.css`) dijaga sama dengan `brand/tokens.json` oleh test.

Render ulang PNG/PDF brand setelah mengubah template atau pedoman (butuh Playwright: `npm i --no-save playwright`):

```sh
node brand/social/export.mjs
python3 brand/build-logo-kit.py
```
