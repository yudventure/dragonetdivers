# Latar panel kondisi laut: laut dalam + bayangan manta

Panel "Live sea conditions" (`src/components/SeaConditionsPanel.jsx`) memakai satu video loop 15 detik: laut dalam dengan sinar matahari, cahaya permukaan, dan partikel, plus satu manta di kejauhan yang hanya tampak sebagai bayangan gelap. Manta muncul kecil di kejauhan, mendekat sambil berbelok di bawah cahaya permukaan dengan kepakan sayap yang realistis, lalu berenang ke kiri dan keluar. Video diputar oleh `LoopVideo.jsx` hanya saat panel terlihat.

Riwayat permintaan pemilik:
- Video pertama: manta besar melintas dengan perut putih terlihat.
- Versi kedua: siluet gambar diam yang digerakkan CSS. Pemilik menilai gerakannya kurang hidup.
- Versi sekarang: gerakan realistis seperti video pertama, tetapi manta digelapkan sampai hanya terlihat bayangannya.

Semua aset adalah ilustrasi AI, bukan dokumentasi lokasi (BRANDING.md §7). Dibuat 20–21 Oktober 2026 di akun Higgsfield pemilik.

| File | Isi |
| --- | --- |
| `public/media/ocean-manta-shadow.webm` | VP9, 1280×720, 24 fps, tanpa suara |
| `public/media/ocean-manta-shadow.mp4` | H.264, sama (Safari & cadangan) |
| `src/assets/ocean-manta-shadow.webp` | Poster = frame pertama (laut kosong). Tampil sebelum video jalan, saat "kurangi animasi" aktif, atau dalam mode hemat data |

## Langkah membuat ulang

1. **Gambar latar**: Higgsfield, GPT Image 2.5, rasio 16:9, kualitas high, 2K. Prompt:

   > Photorealistic underwater photograph of open deep ocean in Raja Ampat, looking slightly upward through clear water: soft god rays of sunlight stream down diagonally from the bright rippling surface far above, the water is a rich gradient from luminous lagoon blue (#1592AB) near the surface through deep teal (#146E7F) to dark abyss blue-green (#0A323B) in the depths, tiny plankton particles and a few small silver bubbles float in the water column. The middle of the frame is open, empty blue water with nothing in it. No reef, no fish, no diver, no boat, no land. Calm, cinematic, natural colours, slight depth haze. No text, no logos, no watermark.

2. **Video**: Kling 3.0 (pro, 16:9, 15 detik, suara mati, dua varian). Gambar tadi dijadikan **frame awal sekaligus frame akhir**, jadi manta muncul lalu pergi dan sambungan loop-nya mulus. Pilih varian yang mantanya paling jelas berupa bayangan. Prompt:

   > Seamless loop, locked-off static underwater camera in the open blue ocean of Raja Ampat. Far away in the blue haze, a single reef manta ray appears only as a dark shadowy silhouette, backlit against the bright water, with no white belly, no markings and no details visible, small in the frame. It swims into view from the left side through the middle of the frame with slow, powerful, realistic wing beats and long graceful glides, its wing tips curling and its body gently undulating, then makes a slow, natural banking turn on the right side of the frame and swims back toward the left, leaving the frame on the left well before the end. Sunbeams from the surface shimmer and sway gently, the rippling surface light dances, tiny plankton particles drift slowly. The clip ends on exactly the same empty ocean view as the start. Natural colours, cinematic, realistic animal motion, no camera movement, no other animals, no divers, no text.

3. **Gelapkan manta**: perut manta dari Kling masih abu-abu, jadi mantanya digelapkan sampai menjadi bayangan. Air, sinar, dan partikel tidak diubah. Perintah:

   `python3 brand/ocean/manta-shadow.py hasil-kling.mp4 manta-bayangan.mkv`

   Skrip membuat masker dari piksel yang lebih gelap atau lebih pudar daripada latar median (laut tanpa manta). Manta lalu dilacak dari frame ke frame, sehingga celah gelap di riak permukaan tidak ikut tergelapkan. Piksel manta diganti dengan warna air di titik itu yang digelapkan sampai 22%, dengan tepi lembut.

4. **Olah video**: `python3 brand/video/make-loop.py manta-bayangan.mkv --name ocean-manta-shadow --size 1280x720 --blend 8` (tanpa `--whiten`). Opsi `--blend 8` melebur 1/3 detik terakhir ke awal video, karena frame akhir Kling tidak 100% sama dengan frame awal. Hasil 21 Oktober 2026: selisih sambungan 1,6, setara dengan selisih antarframe biasa (1,7).

Catatan: dari dua varian Kling, satu tidak memunculkan manta sama sekali. Yang dipakai adalah varian kedua. Di varian itu manta muncul kecil di kejauhan sekitar detik ke-2, mendekat sambil berbelok di bawah cahaya permukaan, lalu keluar di kiri sekitar detik ke-13.
