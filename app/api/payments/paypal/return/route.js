import { isOrderCode } from "@/lib/checkout";
import { completePaypal, orderPath, siteOrigin } from "@/server/checkout";

export const dynamic = "force-dynamic";

// PayPal mengembalikan tamu ke sini setelah menyetujui: uang diambil, lalu tamu ke halaman pesanannya.
export async function GET(request) {
  const code = new URL(request.url).searchParams.get("code") ?? "";
  const order = isOrderCode(code) ? await completePaypal(code).catch((error) => console.error(`[paypal] return: ${error.message}`)) : null;
  return Response.redirect(`${siteOrigin(request)}${order ? orderPath(order) : "/"}`, 303);
}
