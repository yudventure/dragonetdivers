import { isOrderCode } from "@/lib/checkout";
import { cancelPaypal, orderPath, siteOrigin } from "@/server/checkout";

export const dynamic = "force-dynamic";

// Tamu meninggalkan PayPal tanpa membayar: pesanan ditutup dan halaman pesanannya mengatakan itu.
export async function GET(request) {
  const code = new URL(request.url).searchParams.get("code") ?? "";
  const order = isOrderCode(code) ? await cancelPaypal(code).catch((error) => console.error(`[paypal] cancel: ${error.message}`)) : null;
  return Response.redirect(`${siteOrigin(request)}${order ? orderPath(order) : "/"}`, 303);
}
