import { cleanAgreement, WaiverError } from "@/lib/waiver";
import { guardAdmin, readJson } from "@/server/admin-auth";
import { saveAgreement } from "@/server/waivers";

export const dynamic = "force-dynamic";

// Teks perjanjian formulir selam dari /admin/formulir ({ en, id, zh, ko }; semua kosong = kembali ke teks bawaan
// src/content/waiver-agreement.js). Disimpan di settings baris "waiver" dan langsung dipakai /waiver, yang
// menampilkan teks bahasa halaman (English bila bahasa itu kosong).
const MESSAGES = {
  english: "Isi teks English dulu. Halaman yang bahasanya belum diisi memakai teks English.",
  length: "Teks terlalu panjang (paling banyak 40.000 huruf per bahasa).",
};

export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request, 200_000);
  if (!input) return Response.json({ error: "Isian tidak valid." }, { status: 400 });
  let value;
  try {
    value = cleanAgreement(input);
  } catch (e) {
    if (e instanceof WaiverError) return Response.json({ error: MESSAGES[e.field] ?? "Isian tidak valid." }, { status: 400 });
    throw e;
  }
  try {
    return Response.json({ ok: true, agreement: await saveAgreement(value) });
  } catch (e) {
    console.error(`[admin/formulir] ${e.code ?? e.message}`);
    return Response.json({ error: "Database belum bisa diakses. Coba lagi sebentar." }, { status: 503 });
  }
}
