import { cleanClientError, pushError } from "@/lib/client-errors";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { getSetting, saveSetting } from "@/server/settings";

export const dynamic = "force-dynamic";

// Laporan galat dari peramban admin (app/admin/error.jsx, dikirim lewat sendBeacon). Ditulis ke log server
// dan disimpan 20 terakhir di settings baris client_errors, tampil di /admin/developer. DELETE menghapus catatan.
export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const entry = cleanClientError(await readJson(request, 8_000));
  if (!entry) return Response.json({ error: "Laporan kosong." }, { status: 400 });
  console.error(`[admin/klien] ${entry.message} · ${entry.url}${entry.digest ? ` · ${entry.digest}` : ""}`);
  try {
    const { list } = await getSetting("client_errors", { list: [] });
    await saveSetting("client_errors", { list: pushError(list, entry) });
  } catch (e) {
    console.error(`[admin/klien] tidak tersimpan: ${e.code ?? e.message}`);
  }
  return Response.json({ ok: true });
}

export async function DELETE(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  try {
    await saveSetting("client_errors", { list: [] });
    return Response.json({ ok: true });
  } catch (e) {
    console.error(`[admin/klien] hapus: ${e.code ?? e.message}`);
    return Response.json({ error: "Database belum bisa diakses." }, { status: 503 });
  }
}
