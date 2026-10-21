import { validateCapacity } from "@/lib/modules/calendar";
import { RecordError } from "@/lib/records";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { saveSetting } from "@/server/settings";

export const dynamic = "force-dynamic";

// Kapasitas tamu per hari dari /admin/kalender ({ capacity: { diving, snorkeling } }). 0 = tanpa batas.
export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request);
  try {
    await saveSetting("calendar", validateCapacity(input?.capacity));
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof RecordError) return Response.json({ error: e.message }, { status: 400 });
    console.error(`[admin/kalender] ${e.code ?? e.message}`);
    return Response.json({ error: "Database belum bisa diakses. Coba lagi sebentar." }, { status: 503 });
  }
}
