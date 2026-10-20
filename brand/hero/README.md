# Hero beranda: penyelam menghembuskan gelembung

Video loop 10 detik di atas latar putih (`src/components/HomeHero.jsx`, `HeroVideo.jsx`). Ilustrasi AI, bukan dokumentasi lokasi (BRANDING.md §7). Dibuat 20 Oktober 2026 di akun Higgsfield pemilik.

| File | Isi |
| --- | --- |
| `public/media/hero-diver.webm` | VP9, 1080×1080, 24 fps, tanpa suara (Chrome, Firefox, Edge) |
| `public/media/hero-diver.mp4` | H.264, sama (Safari & cadangan) |
| `src/assets/hero-diver.webp` | Poster = frame pertama; tampil sebelum video jalan, saat "kurangi animasi" aktif, atau mode hemat data |

## Langkah membuat ulang

1. **Gambar** — Higgsfield, model GPT Image 2.5, rasio 1:1, kualitas high, 2K. Prompt:

   > Photorealistic high-key studio portrait of a scuba diver, head and shoulders, centred, seen from the front with the head turned slightly to the left and tilted a little upward. He wears a black neoprene hood and a modern low-volume dive mask with a deep teal (#0E6E7E) frame and clear silicone skirt, a scuba regulator mouthpiece in his mouth with a black hose curving down past his cheek, and a thin mandarin-orange trim on the hood edge. He is exhaling: a dense, explosive cloud of crisp clear air bubbles bursts from the regulator exhaust and rises upward over one side of the face and above the head, from large wobbling mushroom-shaped bubbles to tiny sparkling ones, every bubble sharp, glassy and three-dimensional with fine grey and pale teal refraction edges and bright specular highlights so they read clearly against white. The background is pure flat white (#FFFFFF), seamless, with no water, no blue tint, no gradient, no vignette and no shadow behind him. Soft even lighting. The shoulders and wetsuit fade smoothly into pure white toward the bottom edge of the frame. Plenty of white space above the head for the rising bubbles. No text, no logos, no watermark.

2. **Video pertama** — Kling 3.0 (pro, 1:1, 8 detik, suara mati), gambar tadi sebagai frame awal, prompt: kamera diam, penyelam menghembuskan gelembung yang naik, latar tetap putih bersih.
3. **Video loop** — ambil satu frame dari video pertama yang gelembungnya sedikit, lalu jadikan **frame awal sekaligus frame akhir** di Kling 3.0 (pro, 1:1, **10 detik**, suara mati). Dua varian, pilih yang paling hidup. Prompt:

   > Lifelike, natural human motion, seamless loop. Locked-off static camera: no zoom, no pan, no camera shake. Studio portrait of a scuba diver on a pure flat white background, breathing through his regulator like a real diver. He blinks naturally two or three times behind the mask, his eyes glance slightly. On each exhale his cheeks puff a little, his lips and jaw visibly work around the regulator mouthpiece and a burst of crisp air bubbles bursts from the exhaust at the side of his mouth, wobbles, merges into big mushroom-shaped bubbles and rises past his hood and out of the top of the frame. On each inhale his cheeks relax, the bubbles stop and his shoulders rise slightly. Small natural head movements, then he settles back into exactly the starting pose at the end. The background stays perfectly clean flat white for the whole clip: no water, no blue tint, no floating particles in the background, no lighting change, no new objects.

   Catatan:
   - Frame awal = frame akhir membuat loop mulus tanpa crossfade. Video tanpa frame akhir bergeser beberapa piksel sehingga sambungannya terlihat.
   - Prompt "head almost completely still" menghasilkan penyelam yang terlalu kaku. Pemilik ingin penyelam berkedip dan mulutnya ikut bergerak saat menghembuskan napas, jadi prompt di atas yang dipakai.

4. **Olah** — `python3 brand/hero/make-loop.py hasil-kling.mp4`: skala 1080 px, latar keabuan Kling (±250) dijadikan putih 255, frame terakhir dibuang, lalu tulis mp4, webm, dan poster.

## Foto seksi kursus

`src/assets/learn-diver.webp` (1200×1600, dipakai `src/components/LearnToDive.jsx`) juga ilustrasi AI: GPT Image 2.5, rasio 3:4, kualitas high, 2K, lalu diperkecil ke WebP kualitas 80. Ganti dengan foto kursus asli bila sudah ada. Prompt:

> Photorealistic underwater photograph of a scuba diver hovering horizontally with calm, perfect buoyancy in clear turquoise-blue open water, facing the camera and making the OK hand signal. He wears a black wetsuit, a dive mask with a deep teal frame, a black BCD with a single aluminium tank and a regulator with a mandarin-orange hose accent; small silver bubbles rise from the regulator. Bright sun rays stream down from the rippling surface above, the water fades from light aqua at the top to deep blue at the bottom. Open blue water only: no reef, no fish, no land, no boat. Natural colours, no heavy filter, sharp focus on the diver, slight depth haze. No text, no logos, no watermark.
