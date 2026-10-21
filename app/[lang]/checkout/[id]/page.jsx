import { notFound, redirect } from "next/navigation";
import { localeHref } from "@/lib/i18n";

// Tautan lama checkout satu paket (/checkout/12): paketnya dimasukkan ke keranjang di halaman checkout.
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function PackageCheckoutRedirect({ params }) {
  const { lang, id } = await params;
  if (!/^\d{1,9}$/.test(id)) notFound();
  redirect(`${localeHref(lang, "/checkout")}?add=${id}`);
}
