import "server-only";
import { cleanHiddenServices, shownServicesIn } from "@/lib/services";
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

/** Isian yang tersimpan di database (tanpa ingatan proses); galat database dilempar. */
export async function storedSiteSettings() {
  return normalizeSiteSettings(await getSetting("site", DEFAULT_SITE_SETTINGS));
}

export async function saveSiteSettings(value) {
  await saveSetting("site", value);
  state.value = value;
  state.at = state.savedAt = Date.now();
}

/** Layanan yang tampil di website dalam satu bahasa (yang disimpan di /admin/paket tidak ikut). */
export async function shownServices(lang) {
  return shownServicesIn(lang, (await getSiteSettings()).hiddenServices);
}

/** Apakah layanan ini tampil di website (bukan layanan yang disimpan). */
export async function isServiceShown(slug) {
  return !(await getSiteSettings()).hiddenServices.includes(slug);
}

/** Simpan kode verifikasi Google (/admin/google, sudah dibersihkan) tanpa mengubah isian lain. */
export async function saveGoogleVerification(code) {
  const value = { ...(await storedSiteSettings()), googleVerification: code };
  await saveSiteSettings(value);
  return value.googleVerification;
}

/** Simpan daftar layanan yang disimpan (/admin/paket) tanpa mengubah isian /admin/kontak. */
export async function saveHiddenServices(hidden) {
  const value = { ...(await storedSiteSettings()), hiddenServices: cleanHiddenServices(hidden) };
  await saveSiteSettings(value);
  return value.hiddenServices;
}
