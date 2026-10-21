# Latar panel kondisi laut: laut dalam + siluet manta

Panel "Live sea conditions" (`src/components/SeaConditionsPanel.jsx`) punya dua lapisan bergerak di belakang teks:

1. **Video laut dalam** tanpa hewan: sinar matahari bergoyang, cahaya permukaan menari, dan partikel melayang. Loop 10 detik, diputar oleh `LoopVideo.jsx` hanya saat panel terlihat.
2. **Siluet manta di kejauhan**: gambar kecil (`src/assets/manta-silhouette.webp`, 4 KB) yang digerakkan dengan CSS (`animate-manta-*` di `app/globals.css`). Manta berenang ke kanan, berbelok, lalu kembali ke kiri dalam 44 detik, sambil naik-turun pelan dan mengepakkan sayap. Posisinya dihitung dalam persen lebar panel (`cqw`), jadi manta selalu di dalam panel, baik di desktop maupun mobile.

Pemilik ingin manta hanya berupa siluet jauh yang mondar-mandir di dalam frame, bukan manta besar yang melintas sekali. Itu sebabnya manta dipisah dari video. Semua aset adalah ilustrasi AI, bukan dokumentasi lokasi (BRANDING.md §7). Dibuat 20–21 Oktober 2026 di akun Higgsfield pemilik.

| File | Isi |
| --- | --- |
| `public/media/ocean-deep.webm` | VP9, 1280×720, 24 fps, tanpa suara |
| `public/media/ocean-deep.mp4` | H.264, sama (Safari & cadangan) |
| `src/assets/ocean-deep.webp` | Poster = frame pertama; tampil sebelum video jalan, saat "kurangi animasi" aktif, atau mode hemat data |
| `src/assets/manta-silhouette.webp` | Siluet manta warna Abyss, latar transparan, lebar 320 px |

Saat "kurangi animasi" aktif, siluet diam di kiri atas dan video tidak diputar.

## Langkah membuat ulang

1. **Gambar latar**: Higgsfield, GPT Image 2.5, rasio 16:9, kualitas high, 2K. Prompt:

   > Photorealistic underwater photograph of open deep ocean in Raja Ampat, looking slightly upward through clear water: soft god rays of sunlight stream down diagonally from the bright rippling surface far above, the water is a rich gradient from luminous lagoon blue (#1592AB) near the surface through deep teal (#146E7F) to dark abyss blue-green (#0A323B) in the depths, tiny plankton particles and a few small silver bubbles float in the water column. The middle of the frame is open, empty blue water with nothing in it. No reef, no fish, no diver, no boat, no land. Calm, cinematic, natural colours, slight depth haze. No text, no logos, no watermark.

2. **Video**: Kling 3.0 (pro, 16:9, 10 detik, suara mati). Gambar tadi dijadikan **frame awal sekaligus frame akhir** supaya loop-nya mulus. Prompt:

   > Seamless loop, locked-off static underwater camera in the open blue ocean. Empty water only: no animals, no fish, no manta, no divers. Sunbeams from the surface shimmer and slowly sway, the rippling surface light dances, tiny plankton particles and a few small bubbles drift slowly upward. Calm, cinematic, natural colours, no camera movement, no text. The clip ends on exactly the same view as the start.

3. **Olah video**: `python3 brand/video/make-loop.py hasil-kling.mp4 --name ocean-deep --size 1280x720 --blend 8` (tanpa `--whiten`). `--blend 8` melebur 1/3 detik terakhir ke awal karena frame akhir Kling tidak 100% sama dengan frame awal.

4. **Siluet**: GPT Image 2.5, rasio 3:2, latar transparan, lalu potong sesuai bentuknya, warnai Abyss `#0A323B`, dan perkecil ke lebar 320 px. Prompt:

   > Clean silhouette of a single reef manta ray swimming to the right, three-quarter side view as seen from slightly below: both wide wings raised in a graceful curve, the two cephalic fins at the front of the head pointing forward, a long thin whip-like tail trailing to the left. Solid flat dark navy colour (#0A323B), no internal details, no texture, no outline, no shadow. Isolated on a fully transparent background, generous empty space around it. No text, no logos.
