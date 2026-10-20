# Latar panel kondisi laut: laut dalam + manta lewat

Video loop 10 detik di belakang panel "Live sea conditions" (`src/components/SeaConditionsPanel.jsx`, diputar oleh `LoopVideo.jsx` hanya saat terlihat). Ilustrasi AI, bukan dokumentasi lokasi (BRANDING.md §7). Dibuat 20 Oktober 2026 di akun Higgsfield pemilik.

| File | Isi |
| --- | --- |
| `public/media/ocean-manta.webm` | VP9, 1280×720, 24 fps, tanpa suara |
| `public/media/ocean-manta.mp4` | H.264, sama (Safari & cadangan) |
| `src/assets/ocean-manta.webp` | Poster = frame pertama (laut kosong); tampil sebelum video jalan, saat "kurangi animasi" aktif, atau mode hemat data |

Panel memotong video dengan `object-cover`: di desktop yang terlihat pita tengahnya (tempat manta lewat), di mobile irisan tengah vertikal.

## Langkah membuat ulang

1. **Gambar latar**: Higgsfield, GPT Image 2.5, rasio 16:9, kualitas high, 2K. Dua varian; pilih yang warnanya paling kaya. Prompt:

   > Photorealistic underwater photograph of open deep ocean in Raja Ampat, looking slightly upward through clear water: soft god rays of sunlight stream down diagonally from the bright rippling surface far above, the water is a rich gradient from luminous lagoon blue (#1592AB) near the surface through deep teal (#146E7F) to dark abyss blue-green (#0A323B) in the depths, tiny plankton particles and a few small silver bubbles float in the water column. The middle of the frame is open, empty blue water with nothing in it. No reef, no fish, no diver, no boat, no land. Calm, cinematic, natural colours, slight depth haze. No text, no logos, no watermark.

2. **Video**: Kling 3.0 (pro, 16:9, 10 detik, suara mati). Gambar tadi dijadikan **frame awal sekaligus frame akhir**, jadi manta masuk lalu keluar dan loop-nya mulus. Dua varian; pilih yang mantanya paling jelas di tengah. Prompt:

   > Seamless loop, locked-off static underwater camera in the open blue ocean of Raja Ampat. A large reef manta ray swims into frame from the left side, gliding gracefully through the middle of the frame with slow, smooth wing beats, its white belly and dark back clearly visible, and leaves the frame on the right side well before the end. Sunbeams from the surface shimmer and sway gently, the rippling surface light dances, tiny plankton particles and small bubbles drift slowly upward. The clip ends on exactly the same empty ocean view as the start. Natural colours, cinematic, realistic motion, no camera movement, no other animals, no divers, no text.

3. **Olah**: `python3 brand/video/make-loop.py hasil-kling.mp4 --name ocean-manta --size 1280x720` (tanpa `--whiten`).
