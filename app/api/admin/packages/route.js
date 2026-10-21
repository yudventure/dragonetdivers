import { revalidatePath } from "next/cache";
import { validatePackage } from "@/lib/checkout";
import { services } from "@/lib/services";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { deletePackage, savePackage } from "@/server/packages";

export const dynamic = "force-dynamic";

// Simpan dan hapus paket dari /admin/paket. Halaman layanan dibangun ulang supaya paket langsung tampil.
const refresh = () => revalidatePath("/[lang]/services/[slug]", "page");
const slugs = services.map((s) => s.slug);

export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request);
  if (!input) return Response.json({ error: "Data paket tidak valid." }, { status: 400 });
  try {
    const id = input.id == null ? null : Number(input.id);
    if (id !== null && (!Number.isSafeInteger(id) || id < 1)) throw new Error("Paket tidak ditemukan.");
    const saved = await savePackage(id, validatePackage(input, slugs));
    refresh();
    return Response.json({ ok: true, id: saved });
  } catch (e) {
    if (e.code) console.error(`[admin/paket] ${e.code}`);
    return Response.json({ error: e.code ? "Database belum bisa diakses. Coba lagi sebentar." : e.message }, { status: e.code ? 503 : 400 });
  }
}

export async function DELETE(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) return Response.json({ error: "Paket tidak ditemukan." }, { status: 400 });
  try {
    await deletePackage(id);
    refresh();
    return Response.json({ ok: true });
  } catch (e) {
    console.error(`[admin/paket] hapus: ${e.code ?? e.message}`);
    return Response.json({ error: "Database belum bisa diakses. Coba lagi sebentar." }, { status: 503 });
  }
}
