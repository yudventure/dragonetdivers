import { services } from "@/lib/services";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { saveHiddenServices } from "@/server/site-settings";

export const dynamic = "force-dynamic";

// Sakelar "Layanan di website" di /admin/paket ({ hidden: ["snorkeling", ...] }): layanan yang disimpan
// tidak tampil di website dan paketnya tidak bisa dipesan; paketnya tetap ada. Minimal satu layanan tampil.
export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request);
  if (!Array.isArray(input?.hidden) || !input.hidden.every((slug) => typeof slug === "string")) {
    return Response.json({ error: "Isian tidak valid." }, { status: 400 });
  }
  if (services.every((s) => input.hidden.includes(s.slug))) {
    return Response.json({ error: "Minimal satu layanan tetap tampil di website." }, { status: 400 });
  }
  try {
    return Response.json({ ok: true, hidden: await saveHiddenServices(input.hidden) });
  } catch (e) {
    console.error(`[admin/paket] layanan di website: ${e.code ?? e.message}`);
    return Response.json({ error: "Database belum bisa diakses. Coba lagi sebentar." }, { status: 503 });
  }
}
