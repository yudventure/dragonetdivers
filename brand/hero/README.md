# Hero beranda: penyelam menghembuskan gelembung

Video loop 8 detik di atas latar putih (`src/components/HomeHero.jsx`, `HeroVideo.jsx`). Ilustrasi AI, bukan dokumentasi lokasi (BRANDING.md §7). Dibuat 20 Oktober 2026 di akun Higgsfield pemilik.

| File | Isi |
| --- | --- |
| `public/media/hero-diver.webm` | VP9, 1080×1080, 24 fps, tanpa suara (Chrome, Firefox, Edge) |
| `public/media/hero-diver.mp4` | H.264, sama (Safari & cadangan) |
| `src/assets/hero-diver.webp` | Poster = frame pertama; tampil sebelum video jalan, saat "kurangi animasi" aktif, atau mode hemat data |

## Langkah membuat ulang

1. **Gambar** — Higgsfield, model GPT Image 2.5, rasio 1:1, kualitas high, 2K. Prompt:

   > Photorealistic high-key studio portrait of a scuba diver, head and shoulders, centred, seen from the front with the head turned slightly to the left and tilted a little upward. He wears a black neoprene hood and a modern low-volume dive mask with a deep teal (#0E6E7E) frame and clear silicone skirt, a scuba regulator mouthpiece in his mouth with a black hose curving down past his cheek, and a thin mandarin-orange trim on the hood edge. He is exhaling: a dense, explosive cloud of crisp clear air bubbles bursts from the regulator exhaust and rises upward over one side of the face and above the head, from large wobbling mushroom-shaped bubbles to tiny sparkling ones, every bubble sharp, glassy and three-dimensional with fine grey and pale teal refraction edges and bright specular highlights so they read clearly against white. The background is pure flat white (#FFFFFF), seamless, with no water, no blue tint, no gradient, no vignette and no shadow behind him. Soft even lighting. The shoulders and wetsuit fade smoothly into pure white toward the bottom edge of the frame. Plenty of white space above the head for the rising bubbles. No text, no logos, no watermark.

2. **Video pertama** — Kling 3.0 (pro, 1:1, 8 detik, suara mati), gambar tadi sebagai frame awal, prompt: kamera diam, penyelam menghembuskan gelembung yang naik, latar tetap putih bersih.
3. **Video loop** — ambil satu frame dari video pertama yang gelembungnya sedikit, lalu jadikan **frame awal sekaligus frame akhir** di Kling 3.0 (pengaturan sama). Prompt:

   > Seamless loop. Locked-off static camera: no zoom, no pan, no camera shake. Studio portrait of a scuba diver on a pure flat white background. The diver keeps his head almost completely still and breathes rhythmically through the regulator: two strong exhales, each one releasing a burst of crisp air bubbles from the regulator exhaust at the side of his mouth; the bubbles wobble, merge into big mushroom-shaped bubbles and rise past the side of his hood, drifting upward and out of the top of the frame, with a fine trail of tiny sparkling bubbles. Between exhales only a few small bubbles. Gentle natural breathing, eyes looking up. The background stays perfectly clean flat white for the whole clip: no water, no blue tint, no floating particles in the background, no lighting change, no new objects.

   Frame awal = frame akhir membuat loop mulus tanpa crossfade. Video tanpa frame akhir bergeser beberapa piksel sehingga sambungannya terlihat.
4. **Olah** — `python3 brand/hero/make-loop.py hasil-kling.mp4`: skala 1080 px, latar keabuan Kling (±250) dijadikan putih 255, frame terakhir dibuang, lalu tulis mp4, webm, dan poster.
