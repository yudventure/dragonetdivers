import { isDatabaseConfigured } from "@/server/db-config.js";
import { packagesByIds } from "@/server/packages";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

// Data terbaru paket di keranjang tamu (/api/cart?ids=3,12): nama dua bahasa, harga, dan batas tamu.
// Paket yang sudah tidak aktif tidak dikembalikan, jadi keranjang membuangnya (refreshCart di src/lib/cart.js).
export async function GET(request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "").split(",").slice(0, 20);
  if (!isDatabaseConfigured()) return Response.json({ packages: [] }, { headers: noStore });
  try {
    const found = await packagesByIds(ids);
    const packages = Object.values(found).map((p) => ({
      id: p.id,
      service: p.service,
      name: { en: p.nameEn, id: p.nameId },
      price: p.price,
      unit: p.unit,
      minGuests: p.minGuests,
      maxGuests: p.maxGuests,
    }));
    return Response.json({ packages }, { headers: noStore });
  } catch (error) {
    console.error(`[keranjang] paket tidak terbaca: ${error.code ?? error.message}`);
    return Response.json({ error: "unavailable" }, { status: 503, headers: noStore });
  }
}
