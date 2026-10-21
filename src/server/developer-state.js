import "server-only";
import { DEFAULT_DEVELOPER, DEVELOPER_STATE, normalizeDeveloper } from "@/lib/developer";
import { isDatabaseConfigured } from "./db-config.js";
import { getSetting, saveSetting } from "./settings";

// Pengaturan mode developer (tabel settings, baris "developer"), diingat per proses supaya proxy.js bisa
// memeriksanya di setiap permintaan tanpa membebani database. Setelah 15 detik nilai lama tetap dipakai
// sambil disegarkan di belakang, jadi database yang lambat atau putus tidak menahan halaman; bila
// database tidak terbaca, nilai terakhir tetap berlaku (awalnya: mode developer mati).

const TTL = 15_000;
const FIRST_WAIT = 1500;
const state = (globalThis[DEVELOPER_STATE] ??= { value: null, at: 0, savedAt: 0, pending: null });

function refresh() {
  const started = (state.at = Date.now());
  state.pending ??= getSetting("developer", DEFAULT_DEVELOPER)
    .then((value) => {
      // Bacaan yang dimulai sebelum tim menyimpan tidak menimpa simpanan baru.
      if (state.savedAt < started) state.value = normalizeDeveloper(value);
    })
    .catch((error) => {
      state.value ??= structuredClone(DEFAULT_DEVELOPER);
      console.error(`[developer] pengaturan tidak terbaca: ${error.code ?? error.message}`);
    })
    .finally(() => {
      state.pending = null;
    });
  return state.pending;
}

/** Pengaturan mode developer saat ini. fresh = tunggu bacaan baru dari database (halaman /admin/developer). */
export async function getDeveloper({ fresh = false } = {}) {
  if (!isDatabaseConfigured()) return structuredClone(DEFAULT_DEVELOPER);
  if (fresh) await refresh();
  else if (Date.now() - state.at >= TTL) {
    const pending = refresh();
    // Belum pernah terbaca (proses baru mulai): tunggu sebentar saja.
    if (!state.value) await Promise.race([pending, new Promise((resolve) => setTimeout(resolve, FIRST_WAIT))]);
  }
  return state.value ?? structuredClone(DEFAULT_DEVELOPER);
}

export async function saveDeveloper(value) {
  await saveSetting("developer", value);
  state.value = value;
  state.at = state.savedAt = Date.now();
}
