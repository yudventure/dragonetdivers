import { CheckoutError } from "@/lib/checkout";
import { pageLocked } from "@/lib/developer";
import { format } from "@/lib/i18n";
import { uiText } from "@/content/ui";
import { contact } from "@/lib/site";
import { readJson, sameOrigin } from "@/server/admin-auth";
import { startCheckout } from "@/server/checkout";
import { developerView } from "@/server/developer";
import { getSiteSettings } from "@/server/site-settings";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };
// Tanggal tutup dan tanggal penuh punya pesan sendiri, tetapi yang disorot tetap kolom tanggal.
const FIELD = { closed: "date", full: "date" };

// Bayar dari jendela checkout di halaman layanan (src/components/booking/CheckoutDialog.jsx): simpan
// pesanan berisi satu atau beberapa paket, lalu kembalikan alamat pembayaran (Midtrans/PayPal) atau
// halaman pesanan (transfer bank). Salah isian satu paket dikembalikan dengan urutannya (index).
export async function POST(request) {
  await getSiteSettings(); // email dan kontak dari /admin/kontak
  const lang = new URL(request.url).searchParams.get("lang") === "id" ? "id" : "en";
  const errors = uiText(lang).checkout.errors;
  const fail = (field, status, index = null) =>
    Response.json({ error: FIELD[field] ?? field, index, message: format(errors[field] ?? errors.server, { email: contact.email }) }, { status, headers: noStore });
  if (!sameOrigin(request)) return fail("form", 403);
  // Mode developer: checkout (atau seluruh website) ditutup untuk pengunjung, operator tetap bisa mencoba.
  if (pageLocked((await developerView()).locks, "checkout")) return fail("maintenance", 503);
  const input = await readJson(request);
  if (!input) return fail("form", 400);
  try {
    return Response.json(await startCheckout(request, input, { lang }), { status: 201, headers: noStore });
  } catch (error) {
    if (error instanceof CheckoutError) return fail(error.field, error.status, error.index);
    console.error(`[checkout] pesanan tidak tersimpan: ${error.code ?? error.message}`);
    return fail("server", 503);
  }
}
