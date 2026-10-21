import "server-only";
import { parseRate, RATE_REFRESH_SECONDS, RATE_URL, rateFromEnv } from "@/lib/currency";

// Kurs USD → IDR untuk tampilan harga. USD_IDR_RATE di hPanel (angka tetap) mengalahkan kurs harian.
// Kurs harian disimpan di data cache Next.js 12 jam, jadi semua pengunjung berbagi satu panggilan.
// Gagal → null: harga tetap tampil dalam Rupiah dan info kurs disembunyikan.
export async function getUsdIdrRate() {
  const manual = rateFromEnv(process.env.USD_IDR_RATE);
  if (manual) return manual;
  try {
    const response = await fetch(RATE_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: RATE_REFRESH_SECONDS },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rate = parseRate(await response.json());
    if (!rate) throw new Error("jawaban tanpa kurs IDR");
    return rate;
  } catch (error) {
    console.warn(`[kurs] Frankfurter gagal: ${error?.message ?? error}`);
    return null;
  }
}
