import { cleanGoogleVerification, SiteSettingsError } from "@/lib/site-settings";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { saveGoogleVerification } from "@/server/site-settings";

export const dynamic = "force-dynamic";

// Kode verifikasi Google Search Console dari /admin/google ({ code: satu atau beberapa "<meta ...>" atau kodenya
// saja, satu per baris; "" untuk menghapus}). Beberapa kode disimpan dipisah spasi. Disimpan di settings baris "site" tanpa mengubah isian lain, dan langsung dipasang di <head>
// beranda (app/[lang]/layout.jsx).
export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request);
  if (typeof input?.code !== "string" || input.code.length > 3000) return Response.json({ error: "Isian tidak valid." }, { status: 400 });
  let code;
  try {
    code = cleanGoogleVerification(input.code);
  } catch (e) {
    if (e instanceof SiteSettingsError) return Response.json({ error: e.message, field: e.field }, { status: 400 });
    throw e;
  }
  try {
    return Response.json({ ok: true, code: await saveGoogleVerification(code) });
  } catch (e) {
    console.error(`[admin/google] ${e.code ?? e.message}`);
    return Response.json({ error: "Database belum bisa diakses. Coba lagi sebentar." }, { status: 503 });
  }
}
