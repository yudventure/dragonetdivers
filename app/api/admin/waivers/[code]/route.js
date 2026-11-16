import { isWaiverCode } from "@/lib/waiver";
import { isArrival } from "@/lib/waiver-review";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { markSheetDeleted, resyncWaiver } from "@/server/waiver-sheet";
import { deleteWaiver, restoreWaiver, setArrival, trashWaiver, waiverByCode } from "@/server/waivers";

export const dynamic = "force-dynamic";

// Meja peninjauan formulir selam (permintaan pemilik 16 November 2026): konfirmasi kedatangan dan sampah.
// POST { action: "arrival", arrival } dengan arrival "", "datang", "tidak", atau "uji";
// POST { action: "trash" } hanya untuk yang tidak datang atau uji coba; POST { action: "restore" };
// DELETE = hapus permanen, hanya untuk yang sudah di sampah. Status baru ikut ke Google Sheets (kolom Status).
const noStore = { "Cache-Control": "no-store" };
const fail = (error, status) => Response.json({ error }, { status, headers: noStore });

async function target(params) {
  const { code } = await params;
  return isWaiverCode(code) ? code : null;
}

export async function POST(request, { params }) {
  const { admin, error } = await guardAdmin(request);
  if (error) return error;
  const code = await target(params);
  if (!code) return fail("Nomor formulir tidak valid.", 400);
  const input = await readJson(request);
  try {
    if (input?.action === "arrival") {
      if (!isArrival(input.arrival)) return fail("Pilihan kedatangan tidak dikenal.", 400);
      if (!(await setArrival(code, input.arrival, admin.email))) return fail("Formulir tidak ditemukan.", 404);
    } else if (input?.action === "trash") {
      if (!(await trashWaiver(code, admin.email))) {
        return fail("Hanya formulir uji coba atau tamu yang tidak datang yang bisa dipindahkan ke sampah. Ubah kedatangannya dulu.", 409);
      }
    } else if (input?.action === "restore") {
      if (!(await restoreWaiver(code))) return fail("Formulir ini tidak ada di sampah.", 409);
    } else {
      return fail("Perintah tidak dikenal.", 400);
    }
    await resyncWaiver(code).catch(() => {});
    return Response.json({ ok: true }, { headers: noStore });
  } catch (e) {
    console.error(`[admin/formulir] ${input?.action ?? "?"} ${code}: ${e.code ?? e.message}`);
    return fail("Database belum bisa diakses. Coba lagi sebentar.", 503);
  }
}

export async function DELETE(request, { params }) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const code = await target(params);
  if (!code) return fail("Nomor formulir tidak valid.", 400);
  try {
    const w = await waiverByCode(code);
    if (!w) return fail("Formulir tidak ditemukan.", 404);
    if (!w.trashedAt) return fail("Pindahkan formulir ke sampah dulu sebelum dihapus permanen.", 409);
    await markSheetDeleted(w);
    await deleteWaiver(code);
    return Response.json({ ok: true }, { headers: noStore });
  } catch (e) {
    console.error(`[admin/formulir] hapus ${code}: ${e.code ?? e.message}`);
    return fail("Database belum bisa diakses. Coba lagi sebentar.", 503);
  }
}
