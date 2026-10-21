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
      hint: "Isi NEXT_PUBLIC_WHATSAPP_NUMBER di hPanel (mis. 6281234567890), lalu deploy ulang. Tombol Book a dive dan WhatsApp ikut muncul.",
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
      hint: "Isi NEXT_PUBLIC_INSTAGRAM, NEXT_PUBLIC_TIKTOK, NEXT_PUBLIC_FACEBOOK, atau NEXT_PUBLIC_YOUTUBE dengan handle atau URL.",
    },
    {
      id: "gallery",
      label: "Foto dan video asli di galeri",
      done: galleryIllustrations === 0,
      hint: `${galleryIllustrations} item galeri masih ilustrasi AI. Kirim foto, klip, atau tautan video ke tim web untuk menggantinya.`,
    },
  ];
}
