import { SiteSettingsError, validateSiteSettings } from "@/lib/site-settings";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { saveSiteSettings } from "@/server/site-settings";

export const dynamic = "force-dynamic";

// Simpan isian /admin/kontak ({ settings: { whatsapp, email, address, mapsUrl, instagram, ... } }).
// Berlaku langsung di proses ini, paling lama 15 detik di proses lain (src/server/site-settings.js).
export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request);
  let settings;
  try {
    settings = validateSiteSettings(input?.settings);
  } catch (e) {
    if (e instanceof SiteSettingsError) return Response.json({ error: e.message, field: e.field }, { status: 400 });
    throw e;
  }
  try {
    await saveSiteSettings(settings);
    return Response.json({ ok: true, settings });
  } catch (e) {
    console.error(`[admin/kontak] ${e.code ?? e.message}`);
    return Response.json({ error: "Database belum bisa diakses. Coba lagi sebentar." }, { status: 503 });
  }
}
