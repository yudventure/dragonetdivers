import { revalidatePath } from "next/cache";
import { PRICE_LIST } from "@/content/price-list";
import { validatePackage } from "@/lib/checkout";
import { services } from "@/lib/services";
import { guardAdmin } from "@/server/admin-auth";
import { importPackages } from "@/server/packages";

export const dynamic = "force-dynamic";

// Tombol "Tambahkan paket" di /admin/paket: paket dari daftar harga pemilik (src/content/price-list.js)
// yang belum ada ditambahkan, yang sudah ada dilewati.
export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const slugs = services.map((s) => s.slug);
  try {
    const result = await importPackages(PRICE_LIST.packages.map((pkg) => validatePackage(pkg, slugs)));
    revalidatePath("/[lang]/services/[slug]", "page");
    return Response.json({ ok: true, ...result });
  } catch (e) {
    console.error(`[admin/paket] impor daftar harga: ${e.code ?? e.message}`);
    return Response.json({ error: e.code ? "Database belum bisa diakses. Coba lagi sebentar." : e.message }, { status: e.code ? 503 : 400 });
  }
}
