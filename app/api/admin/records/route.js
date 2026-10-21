import { revalidatePath } from "next/cache";
import { RecordError } from "@/lib/records";
import { schemaFor } from "@/lib/modules";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { deleteImage } from "@/server/media";
import { countReferences, deleteRecord, getRecord, saveRecord, validId } from "@/server/records";

export const dynamic = "force-dynamic";

// Simpan ({ kind, id, data }) dan hapus (?kind=&id=) catatan modul admin. Skema tiap jenis di
// src/lib/modules; kolom rujukan diperiksa masih ada, dan catatan yang masih dirujuk tidak bisa dihapus.

const failure = (e, where) => {
  if (e instanceof RecordError) return Response.json({ error: e.message, field: e.field }, { status: 400 });
  if (e.status) return Response.json({ error: e.message }, { status: e.status });
  console.error(`[admin/${where}] ${e.code ?? e.message}`);
  return Response.json({ error: "Database belum bisa diakses. Coba lagi sebentar." }, { status: 503 });
};

export async function POST(request) {
  const { admin, error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request, 40_000);
  const schema = schemaFor(input?.kind);
  if (!schema || typeof input.data !== "object" || !input.data) return Response.json({ error: "Data tidak valid." }, { status: 400 });
  const id = input.id ?? null;
  if (id !== null && !validId(schema, id)) return Response.json({ error: "Data tidak ditemukan." }, { status: 404 });
  try {
    const record = await saveRecord(schema, id, input.data, {
      by: admin.email,
      extra: async (clean) => {
        for (const field of schema.fields.filter((f) => f.type === "ref" && clean[f.key])) {
          if (!(await getRecord(field.refKind, clean[field.key]))) throw new RecordError(`${field.label} sudah dihapus. Pilih yang lain.`, field.key);
        }
      },
    });
    for (const path of schema.revalidate ?? []) revalidatePath(path, "page");
    return Response.json({ ok: true, record });
  } catch (e) {
    return failure(e, schema.kind);
  }
}

export async function DELETE(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const params = new URL(request.url).searchParams;
  const schema = schemaFor(params.get("kind"));
  const id = params.get("id");
  if (!schema || !validId(schema, id)) return Response.json({ error: "Data tidak ditemukan." }, { status: 404 });
  try {
    for (const use of schema.usedBy ?? []) {
      const count = await countReferences(use.kind, use.key, id);
      if (count) return Response.json({ error: `Masih dipakai di ${count} ${use.noun}. Hapus atau ubah data itu dulu.` }, { status: 409 });
    }
    const current = await getRecord(schema.kind, id);
    if (!current || !(await deleteRecord(schema.kind, id))) return Response.json({ error: "Data sudah tidak ada." }, { status: 404 });
    if (current.mediaId) await deleteImage(current.mediaId).catch(() => {}); // foto galeri ikut dihapus
    for (const path of schema.revalidate ?? []) revalidatePath(path, "page");
    return Response.json({ ok: true });
  } catch (e) {
    return failure(e, schema.kind);
  }
}
