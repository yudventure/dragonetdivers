# Latar panel kondisi laut: penyelam bersiap turun dari perahu

Panel "Live sea conditions" (`src/components/SeaConditionsPanel.jsx`, di beranda dan halaman layanan) memakai satu foto latar: empat penyelam bersiap di perahu kayu biru di Raja Ampat. Dua penyelam duduk di tepi perahu dengan tabung, BCD, dan fin, siap melakukan *backward roll*, satu memeriksa tabung temannya, dan pemandu berdiri di buritan. Air pirus di atas karang dan pulau karst berhutan di latar belakang.

Dibuat 22 Oktober 2026 atas permintaan pemilik ("ubah live weather dengan foto orang orang sedang bersiap turun ke air dari boat"). Sebelumnya panel memakai video manta yang sekarang menjadi hero beranda (`brand/ocean/README.md`).

Foto ini ilustrasi AI, bukan dokumentasi lokasi (BRANDING.md §7). Orang di foto bukan orang sungguhan. Dibuat di akun Higgsfield pemilik.

| File | Isi |
| --- | --- |
| `src/assets/boat-divers.webp` | 2000×1131, WebP kualitas 78 (dari PNG 2688×1520). Dipakai lewat `next/image`, jadi ukuran kecil dibuat otomatis |

## Langkah membuat ulang

Higgsfield, GPT Image 2.5, rasio 16:9, kualitas medium, 2K (1 kredit; kualitas high 2K butuh 2,75 kredit). Prompt:

> Photorealistic travel photograph, Raja Ampat, Indonesia, bright morning. A small group of four scuba divers getting ready to go into the water from a small open wooden dive boat with an outboard engine, anchored over clear turquoise water above a coral reef. Two divers sit on the side of the boat in black wetsuits with dive tanks and BCD jackets on, masks pushed up on their foreheads and fins on, about to do a backward roll entry; one diver checks a buddy's tank valve; a local dive guide in a cap stands at the stern. Seen from inside the boat at a slight angle, people shown mostly from the side and back, faces not the focus, relaxed and safe. Background: calm sea in shades of lagoon blue and teal, green jungle-covered limestone karst islets on the horizon, soft blue sky with a few clouds. Natural colours, gentle sunlight, wide cinematic composition with open sky and water around the group, the boat and divers in the lower middle of the frame. No text, no logos, no brand names on equipment, no watermark.

Lalu perkecil ke lebar 2000 px dan simpan sebagai WebP kualitas 78.

## Tampilan di panel

- Lapisan gradasi Abyss 50 sampai 72% dan bayangan teks supaya teks putih tetap terbaca (BRANDING.md §9.7).
- Layar lebar: `object-[center_40%]`, kepala penyelam di tepi perahu dan pulau karst terlihat. Ponsel: `object-[32%_center]`, potongan foto digeser ke penyelam.
