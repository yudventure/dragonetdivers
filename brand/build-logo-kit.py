"""Susun paket logo Dragonet Divers menjadi brand/export/Dragonet-Divers-Logo-Kit.zip.

Pakai: python3 brand/build-logo-kit.py
Jalankan `node brand/social/export.mjs` lebih dulu agar lockup dan highlight terbaru ikut masuk.
"""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

BRAND = Path(__file__).resolve().parent
KIT = "Dragonet-Divers-Logo-Kit"
OUT = BRAND / "export" / f"{KIT}.zip"

FILES = {
    "01-badge": [
        "logo/dragonet-divers-logo.png",
        "logo/dragonet-divers-logo-plate.png",
        "logo/dragonet-divers-logo-white-bg.png",
    ],
    "02-lockup": [
        "logo/dragonet-divers-lockup-teal.png",
        "logo/dragonet-divers-lockup-white.png",
    ],
    "03-favicon-web": [
        "logo/favicon.ico",
        "logo/favicon-16.png",
        "logo/favicon-32.png",
        "logo/favicon-48.png",
        "logo/icon-192.png",
        "logo/apple-touch-icon-180.png",
    ],
}
RENAMED = {
    "04-media-sosial/foto-profil.png": "logo/dragonet-divers-logo-white-bg.png",
    **{f"04-media-sosial/highlight-{n}.png": f"social/highlights/{n}.png"
       for n in ("dive", "snorkel", "trips", "courses", "reviews", "info")},
}

README = """DRAGONET DIVERS RAJA AMPAT - LOGO KIT
Versi 1.0 - Oktober 2026

ISI
01-badge/
  dragonet-divers-logo.png ........ Logo asli, latar transparan, 301 x 301 px.
                                     HANYA dipakai di atas latar PUTIH.
  dragonet-divers-logo-plate.png .. Bagian dalam cincin diisi putih. Pakai di atas
                                     foto, latar Foam (#F4F9FA), dan latar gelap Abyss
                                     (#0A323B, footer).
  dragonet-divers-logo-white-bg.png  Persegi putih penuh. Untuk foto profil.

02-lockup/
  dragonet-divers-lockup-teal.png . Badge + teks "Dragonet Divers / RAJA AMPAT",
                                     teks Teal. Untuk latar putih (header website,
                                     kop surat, dokumen).
  dragonet-divers-lockup-white.png  Versi teks putih + badge plate. Untuk latar
                                     gelap Abyss.

03-favicon-web/
  favicon.ico, favicon-16/32/48.png  Ikon tab browser.
  icon-192.png .................... Ikon aplikasi web (Android / manifest).
  apple-touch-icon-180.png ........ Ikon layar utama iPhone/iPad.

04-media-sosial/
  foto-profil.png ................. Foto profil Instagram, TikTok, Facebook,
                                     WhatsApp Business.
  highlight-*.png ................. Sampul highlight Instagram 1080 x 1080
                                     (dive, snorkel, trips, courses, reviews, info).

05-warna/
  palet-warna.txt ................. Kode warna brand (HEX dan RGB).

PENTING
- Pita bertulisan DRAGONET DIVERS / RAJA AMPAT di file asli TRANSPARAN.
  Di latar gelap atau foto, tulisannya hilang. Selain di atas putih,
  selalu pakai versi "plate".
- Area aman: sisakan ruang kosong minimal 1/4 diameter badge di semua sisi.
- Ukuran minimum badge: 56 px di layar, 20 mm di cetak.
- Jangan mengubah warna, meregangkan, memutar, memberi bayangan/outline,
  atau memotong cincin luar logo.
- Resolusi logo sumber hanya 301 px. Cukup untuk website, favicon, dan foto
  profil, tetapi BELUM cukup untuk cetak besar (spanduk, kaos, stiker).
  Minta file vektor (SVG/AI/PDF) atau PNG minimal 2000 px dari desainer logo.

Pedoman lengkap: Dragonet-Divers-Brand-Identity.pdf
"""

PALETTE = """DRAGONET DIVERS - PALET WARNA

WARNA UTAMA (dari logo)
Teal Dragonet     #146E7F   RGB 20 110 127    Warna utama: tombol, link, ikon
Biru Laguna       #1592AB   RGB 21 146 171    Pendukung: ikon, ilustrasi, info
Oranye Mandarin   #EB7817   RGB 235 120 23    Aksen CTA (teks di atasnya: Abyss)
Kuning Fajar      #F9D13E   RGB 249 209 62    Sorotan kecil, bintang rating

TURUNAN
Teal Gelap        #0F5866   RGB 15 88 102     Hover tombol teal
Teal Lembut       #D9E8EB   RGB 217 232 235   Chip, tab aktif
Laguna Tipis      #ECF6F8   RGB 236 246 248   Kotak info
Mandarin Hover    #F28A33   RGB 242 138 51    Hover tombol oranye
Bara              #B4560F   RGB 180 86 15     Teks oranye di atas putih
Koral Sirip       #D9651F   RGB 217 101 31    Ilustrasi & pola saja
Fajar Tipis       #FEF8E0   RGB 254 248 224   Latar peringatan

NETRAL
Putih             #FFFFFF   RGB 255 255 255   Dasar (+-80% permukaan)
Foam              #F4F9FA   RGB 244 249 250   Section selang-seling
Mist              #DCE8EB   RGB 220 232 235   Garis, border
Garis Tegas       #78939A   RGB 120 147 154   Border input
Slate             #557079   RGB 85 112 121    Teks sekunder
Abyss             #0A323B   RGB 10 50 59      Teks utama, footer
Kabut Malam       #9DB9BF   RGB 157 185 191   Teks sekunder di footer

FONT
Judul: Fredoka 600 - Teks: Plus Jakarta Sans (keduanya gratis, SIL OFL, Google Fonts)
"""


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(OUT, "w", ZIP_DEFLATED) as z:
        z.writestr(f"{KIT}/BACA-SAYA.txt", README)
        z.writestr(f"{KIT}/05-warna/palet-warna.txt", PALETTE)
        for folder, paths in FILES.items():
            for rel in paths:
                z.write(BRAND / rel, f"{KIT}/{folder}/{Path(rel).name}")
        for target, rel in RENAMED.items():
            z.write(BRAND / rel, f"{KIT}/{target}")
    print(f"Selesai: {OUT.relative_to(BRAND.parent)}")


if __name__ == "__main__":
    main()
