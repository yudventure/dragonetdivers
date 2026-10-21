import { validateTax } from "@/lib/modules/finance";
import { RecordError } from "@/lib/records";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { saveSetting } from "@/server/settings";

export const dynamic = "force-dynamic";

// Pengaturan pajak dari /admin/laporan ({ tax: { taxRate, taxLabel } }).
export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request);
  try {
    await saveSetting("finance", validateTax(input?.tax));
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof RecordError) return Response.json({ error: e.message }, { status: 400 });
    console.error(`[admin/laporan] ${e.code ?? e.message}`);
    return Response.json({ error: "Database belum bisa diakses. Coba lagi sebentar." }, { status: 503 });
  }
}
