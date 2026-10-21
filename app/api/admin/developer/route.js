import { validateDeveloper } from "@/lib/developer";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { saveDeveloper } from "@/server/developer-state";

export const dynamic = "force-dynamic";

// Pengaturan mode developer dari /admin/developer ({ developer: { enabled, site, pages, sections, message, until } }).
// Berlaku langsung di proses ini, dan paling lama 15 detik di proses lain (src/server/developer-state.js).
export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request);
  let developer;
  try {
    developer = validateDeveloper(input?.developer);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 });
  }
  try {
    await saveDeveloper(developer);
    return Response.json({ ok: true, developer });
  } catch (e) {
    console.error(`[admin/developer] ${e.code ?? e.message}`);
    return Response.json({ error: "Database belum bisa diakses. Coba lagi sebentar." }, { status: 503 });
  }
}
