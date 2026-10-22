# Hero beranda dan latar panel kondisi laut: laut dalam + manta bolak-balik

Hero beranda (`src/components/HomeHero.jsx`, sejak 22 Oktober 2026 atas permintaan pemilik) dan panel "Live sea conditions" (`src/components/SeaConditionsPanel.jsx`) memakai satu video loop 15 detik: laut dalam dengan sinar matahari, cahaya permukaan, dan partikel, plus satu manta karang. Video diputar oleh `LoopVideo.jsx` hanya saat terlihat di layar.

Manta tidak pernah hilang dari cerita:
1. Di awal video, manta tampak kecil di kejauhan di kiri, berupa siluet gelap dengan ekor panjang yang tipis seperti cambuk.
2. Ia berenang mendekat dan melintas di atas kamera. Perut putih dengan bercak gelap, celah insang, sirip kepala, dan ekor cambuknya terlihat jelas.
3. Ia keluar di kanan, berbalik di kejauhan, lalu berenang kembali ke kiri sampai tiba di tempat dan pose awal.

Frame terakhir sama dengan frame pertama, jadi loop-nya mulus tanpa crossfade.

Riwayat permintaan pemilik:
- Video pertama: manta besar melintas sekali.
- Versi kedua: siluet gambar diam yang digerakkan CSS. Gerakannya dinilai kurang hidup.
- Versi ketiga: manta realistis yang digelapkan jadi bayangan. Ekornya masih bersirip seperti ikan (salah anatomi), dan manta keluar frame lalu hilang.
- Versi sekarang (21 Oktober 2026): ekor manta dibetulkan. Dari jauh manta tampak sebagai siluet, dari dekat perut putihnya terlihat (pemilik mengirim foto manta karang sebagai contoh rupa; foto itu hanya dipakai sebagai acuan, tidak diunggah ke Higgsfield). Manta berenang kembali ke tempat awal, bolak-balik.

Semua aset adalah ilustrasi AI, bukan dokumentasi lokasi (BRANDING.md §7). Dibuat di akun Higgsfield pemilik.

| File | Isi |
| --- | --- |
| `public/media/ocean-manta-loop.webm` | VP9, 1280×720, 24 fps, tanpa suara |
| `public/media/ocean-manta-loop.mp4` | H.264, sama (Safari & cadangan) |
| `src/assets/ocean-manta-loop.webp` | Poster = frame pertama (manta kecil di kiri). Tampil sebelum video jalan, saat "kurangi animasi" aktif, atau dalam mode hemat data |

## Langkah membuat ulang

1. **Gambar laut**: Higgsfield, GPT Image 2.5, rasio 16:9, kualitas high, 2K. Prompt:

   > Photorealistic underwater photograph of open deep ocean in Raja Ampat, looking slightly upward through clear water: soft god rays of sunlight stream down diagonally from the bright rippling surface far above, the water is a rich gradient from luminous lagoon blue (#1592AB) near the surface through deep teal (#146E7F) to dark abyss blue-green (#0A323B) in the depths, tiny plankton particles and a few small silver bubbles float in the water column. The middle of the frame is open, empty blue water with nothing in it. No reef, no fish, no diver, no boat, no land. Calm, cinematic, natural colours, slight depth haze. No text, no logos, no watermark.

2. **Gambar awal dengan manta**: GPT Image 2.5 (16:9, high, 2K), gambar laut tadi sebagai referensi. Dua varian; pilih yang ekor cambuk dan sirip kepalanya paling jelas. Prompt:

   > Edit this exact underwater photograph and keep everything else identical: same framing, same sunbeams, same rippling surface, same water colours and particles. Add one single reef manta ray far away in the blue water, small in the frame (about 8% of the frame width), in the left third of the frame at about 40% from the top, gliding toward the right. Seen from slightly below and far away, it reads as a dark backlit silhouette softened by the blue haze: wide triangular pectoral wings spread flat with slightly curved tips, two small cephalic fins at the front of the head, and a long, very thin, straight whip-like tail trailing behind it, about as long as the body. Correct manta anatomy: no tail fin, no fish-like caudal fin, no dorsal fin on the tail. Photorealistic, natural, no other animals, no divers, no text, no watermark.

3. **Video**: Kling 3.0 (pro, 16:9, 15 detik, suara mati). Gambar awal tadi dijadikan **frame awal sekaligus frame akhir**. Prompt:

   > Seamless loop, locked-off static underwater camera looking slightly upward in the open blue ocean of Raja Ampat. The reef manta ray starts far away on the left as a small dark backlit silhouette with its long, very thin whip-like tail. It swims toward the camera and to the right with slow, powerful, realistic wing beats and long glides, growing larger as it comes closer and passes above the camera, banking so that its bright white underside with scattered dark spots, its gill slits, its two curled cephalic fins and its long thin whip tail are clearly visible in the sunlight. Then it makes a wide, graceful banking turn and swims back away to the left, shrinking into the blue haze and returning to exactly its starting position, size and pose far away on the left at the end of the clip. Correct manta anatomy throughout: a long thin whip tail, no tail fin, no fish-like caudal fin. Sunbeams shimmer and sway gently, the rippling surface light dances, tiny plankton particles drift slowly. The clip ends on exactly the same frame as the start. Natural colours, cinematic, realistic animal motion, no camera movement, no other animals, no divers, no text.

4. **Putihkan perut manta**: Kling membuat perutnya krem kemerahan. Perintah berikut menggeser piksel "hangat" (merah > biru, hanya ada di tubuh manta karena airnya selalu kebiruan) ke putih keabuan yang sejuk:

   `python3 brand/ocean/manta-belly.py hasil-kling.mp4 manta-putih.mkv`

5. **Olah video**: `python3 brand/video/make-loop.py manta-putih.mkv --name ocean-manta-loop --size 1280x720 --crf-mp4 27 --crf-webm 42` (tanpa `--blend` dan `--whiten`).

   Crossfade tidak dipakai, karena manta kecil di sambungan jadi berbayang. Frame akhir Kling sudah hampir sama dengan frame awal: selisihnya 2,7, sedangkan selisih antarframe biasa 1,9 dan bisa sampai 6,7 saat manta dekat.
