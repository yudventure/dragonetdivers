// Dijalankan Next.js sekali saat server mulai (next start di Hostinger). Memuat pengaturan mode developer
// (supaya halaman yang ditutup sudah tertutup sejak permintaan pertama), memasukkan daftar harga pemilik
// ke tabel packages bila belum (src/server/packages.js), dan memulai pengecekan berkala
// email pengingat bayar (src/server/reminders.js). Tidak berjalan saat build.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  try {
    const { getDeveloper } = await import("./src/server/developer-state.js");
    await getDeveloper(); // paling lama 1,5 detik bila database lambat
  } catch (error) {
    console.error(`[developer] pengaturan tidak bisa dimuat: ${error?.message}`);
  }
  // Daftar harga pemilik masuk ke tabel packages sekali (tidak ditunggu, galatnya dicatat sendiri).
  import("./src/server/packages.js").then(({ ensurePriceList }) => ensurePriceList()).catch(() => {});
  try {
    const { startReminders } = await import("./src/server/reminders.js");
    startReminders();
  } catch (error) {
    console.error(`[pengingat] tidak bisa dimulai: ${error?.message}`);
  }
}
