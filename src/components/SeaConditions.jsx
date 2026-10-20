import { getSeaConditions } from "@/server/sea-conditions";
import SeaConditionsPanel from "./SeaConditionsPanel";

// Data awal dirender di server agar panel langsung terisi; bila Open-Meteo gagal, panel mengambil sendiri di browser.
export default async function SeaConditions() {
  const initial = await getSeaConditions();
  return <SeaConditionsPanel initial={initial} />;
}
