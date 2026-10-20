import { getSeaConditions } from "@/server/sea-conditions";

export const dynamic = "force-dynamic";

// Kondisi laut terbaru untuk panel live di beranda (dipanggil ulang tiap 10 menit oleh browser).
export async function GET() {
  const conditions = await getSeaConditions();
  return Response.json(
    { ok: Boolean(conditions), conditions },
    { status: conditions ? 200 : 503, headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } },
  );
}
