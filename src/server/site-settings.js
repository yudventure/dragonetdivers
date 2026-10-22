import "server-only";
import { SITE_STATE } from "@/lib/site";
import { DEFAULT_SITE_SETTINGS, normalizeSiteSettings } from "@/lib/site-settings";
import { isDatabaseConfigured } from "./db-config.js";
import { getSetting, saveSetting } from "./settings";

// Isian /admin/kontak (tabel settings, baris "site"), diingat per proses di globalThis supaya
// src/lib/site.js bisa membacanya tanpa menunggu database. Setelah 15 detik nilai lama tetap dipakai
// sambil disegarkan di belakang (sama dengan src/server/developer-state.js). Dimuat saat server mulai
// (instrumentation.js) dan di setiap layout, jadi perubahan dari admin langsung tampil tanpa build ulang.

const TTL = 15_000;
const FIRST_WAIT = 1500;
const state = (globalThis[SITE_STATE] ??= { value: null, at: 0, savedAt: 0, pending: null });

function refresh() {
  const started = (state.at = Date.now());
  state.pending ??= getSetting("site", DEFAULT_SITE_SETTINGS)
    .then((value) => {
      if (state.savedAt < started) state.value = normalizeSiteSettings(value);
    })
    .catch((error) => {
      console.error(`[situs] pengaturan kontak tidak terbaca: ${error.code ?? error.message}`);
    })
    .finally(() => {
      state.pending = null;
    });
  return state.pending;
}

/** Isian /admin/kontak saat ini. fresh = tunggu bacaan baru dari database (halaman admin). */
export async function getSiteSettings({ fresh = false } = {}) {
  if (!isDatabaseConfigured()) return structuredClone(DEFAULT_SITE_SETTINGS);
  if (fresh) await refresh();
  else if (Date.now() - state.at >= TTL) {
    const pending = refresh();
    if (!state.value) await Promise.race([pending, new Promise((resolve) => setTimeout(resolve, FIRST_WAIT))]);
  }
  return state.value ?? structuredClone(DEFAULT_SITE_SETTINGS);
}

export async function saveSiteSettings(value) {
  await saveSetting("site", value);
  state.value = value;
  state.at = state.savedAt = Date.now();
}
