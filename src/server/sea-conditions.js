import "server-only";
import { loadSeaConditions, REFRESH_SECONDS } from "@/lib/sea-conditions";

// Disimpan di data cache Next.js selama 15 menit: semua pengunjung berbagi satu panggilan ke Open-Meteo.
export function getSeaConditions() {
  return loadSeaConditions({ fetchOptions: { next: { revalidate: REFRESH_SECONDS } } });
}
