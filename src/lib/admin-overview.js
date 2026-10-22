// Bagian "Ringkasan cepat" dashboard operator yang bisa diuji: sapaan sesuai jam WIT dan daftar hal
// yang masih perlu dilengkapi agar situs siap menerima tamu.

/** Sapaan menurut jam di Raja Ampat (WIT, Asia/Jayapura). */
export function greeting(date = new Date()) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Jayapura" }).format(date));
  if (hour >= 4 && hour < 11) return "Selamat pagi";
  if (hour >= 11 && hour < 15) return "Selamat siang";
  if (hour >= 15 && hour < 18) return "Selamat sore";
  return "Selamat malam";
}

/** Daftar periksa pengaturan situs, urut dari yang paling penting. */
export function setupChecklist({ whatsapp, socials, database, sessionSecret, galleryIllustrations }) {
  return [
    {
      id: "whatsapp",
      label: "Nomor WhatsApp booking",
      done: whatsapp,
      hint: "Isi di Situs web, Kontak & media sosial. Tombol Book a dive dan WhatsApp langsung muncul.",
      href: "/admin/kontak",
    },
    {
      id: "database",
      label: "Database MySQL terhubung",
      done: database,
      hint: "Isi MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, dan MYSQL_PASSWORD di hPanel. Panduan di HOSTINGER-DEPLOY.md.",
    },
    {
      id: "session",
      label: "Sesi operator tetap tersimpan",
      done: sessionSecret,
      hint: "Isi SESSION_SECRET di hPanel dengan teks acak panjang, supaya tidak perlu masuk lagi setiap aplikasi dimulai ulang.",
    },
    {
      id: "social",
      label: "Akun media sosial di footer",
      done: socials > 0,
      hint: "Isi akun Instagram, TikTok, Facebook, atau YouTube di Situs web, Kontak & media sosial.",
      href: "/admin/kontak",
    },
    {
      id: "gallery",
      label: "Foto dan video asli di galeri",
      done: galleryIllustrations === 0,
      hint: `${galleryIllustrations} item galeri masih ilustrasi AI. Unggah foto asli atau tempel tautan video di Situs web, Galeri foto & video.`,
      href: "/admin/situs",
    },
  ];
}

/**
 * Hal yang bisa diatur sendiri lewat admin, tanpa hPanel (kartu "Kelola website sendiri" di Ringkasan
 * cepat). Yang tetap di hPanel hanya kunci rahasia (database, Midtrans, PayPal, SMTP, password awal).
 */
export const SELF_SERVICE = [
  { href: "/admin/paket", label: "Paket & harga", text: "Tambah paket, ubah harga, atau sembunyikan paket di halaman layanan." },
  { href: "/admin/situs", label: "Galeri foto & video", text: "Unggah foto dan tempel tautan video untuk galeri beranda." },
  { href: "/admin/kontak", label: "Kontak & media sosial", text: "Nomor WhatsApp, email, alamat, Google Maps, dan akun media sosial." },
  { href: "/admin/kalender", label: "Kalender reservasi", text: "Tutup tanggal tertentu dan atur kapasitas tamu per hari." },
  { href: "/admin/pembayaran", label: "Pembayaran online", text: "Cara bayar yang ditawarkan, rekening bank, dan batas waktu bayar." },
  { href: "/admin/developer", label: "Mode developer", text: "Tutup sementara seluruh website atau sebagian saat sedang diperbaiki." },
];
