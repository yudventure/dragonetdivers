import { CheckoutError } from "@/lib/checkout";
import { format } from "@/lib/i18n";
import { uiText } from "@/content/ui";
import { contact } from "@/lib/site";
import { readJson, sameOrigin } from "@/server/admin-auth";
import { startCheckout } from "@/server/checkout";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store" };

// Bayar sekarang dari halaman checkout (src/components/checkout/CheckoutForm.jsx): simpan pesanan,
// lalu kembalikan alamat pembayaran (Midtrans/PayPal) atau halaman pesanan (transfer bank).
export async function POST(request) {
  const lang = new URL(request.url).searchParams.get("lang") === "id" ? "id" : "en";
  const errors = uiText(lang).checkout.errors;
  const fail = (field, status) => Response.json({ error: field, message: format(errors[field] ?? errors.server, { email: contact.email }) }, { status, headers: noStore });
  if (!sameOrigin(request)) return fail("form", 403);
  const input = await readJson(request);
  if (!input) return fail("form", 400);
  try {
    return Response.json(await startCheckout(request, input, { lang }), { status: 201, headers: noStore });
  } catch (error) {
    if (error instanceof CheckoutError) return fail(error.field, error.status);
    console.error(`[checkout] pesanan tidak tersimpan: ${error.code ?? error.message}`);
    return fail("server", 503);
  }
}
