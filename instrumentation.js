// Dijalankan Next.js sekali saat server mulai (next start di Hostinger). Memulai pengecekan berkala
// email pengingat bayar (src/server/reminders.js). Tidak berjalan saat build.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  try {
    const { startReminders } = await import("./src/server/reminders.js");
    startReminders();
  } catch (error) {
    console.error(`[pengingat] tidak bisa dimulai: ${error?.message}`);
  }
}
