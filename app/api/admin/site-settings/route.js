import { SiteSettingsError, validateSiteSettings } from "@/lib/site-settings";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { saveSiteSettings, storedSiteSettings } from "@/server/site-settings";

export const dynamic = "force-dynamic";

const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const unavailable = (e) => {
  console.error(`[admin/kontak] ${e.code ?? e.message}`);
  return Response.json({ error: "Database belum bisa diakses. Coba lagi sebentar." }, { status: 503 });
};

// Simpan isian /admin/kontak ({ settings: { whatsapp, email, address, mapsUrl, instagram, ... } }).
// Daftar layanan yang disimpan (/admin/paket) dan kode verifikasi Google (/admin/google) tetap seperti
// yang tersimpan, bukan dari form ini.
// Berlaku langsung di proses ini, paling lama 15 detik di proses lain (src/server/site-settings.js).
export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request);
  let stored;
  try {
    stored = await storedSiteSettings();
  } catch (e) {
    return unavailable(e);
  }
  let settings;
  try {
    settings = validateSiteSettings(isObject(input?.settings) ? { ...input.settings, hiddenServices: stored.hiddenServices, googleVerification: stored.googleVerification } : null);
  } catch (e) {
    if (e instanceof SiteSettingsError) return Response.json({ error: e.message, field: e.field }, { status: 400 });
    throw e;
  }
  try {
    await saveSiteSettings(settings);
    return Response.json({ ok: true, settings });
  } catch (e) {
    return unavailable(e);
  }
}
