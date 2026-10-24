import { redirect } from "next/navigation";
import { localeHref } from "@/lib/i18n";
import { isDatabaseConfigured } from "@/server/db-config.js";
import { packagesByIds } from "@/server/packages";

// Checkout sekarang jendela di halaman layanan (src/components/booking/CheckoutDialog.jsx, acuan Zanclus).
// Alamat lama /checkout?add=<id> (dan /checkout/<id>) dibawa ke halaman layanan paket itu, yang memasukkan
// paketnya ke keranjang lalu membuka checkout; tanpa paket (atau layanannya sedang disimpan) ke daftar
// layanan di beranda.
export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function CheckoutRedirect({ params, searchParams }) {
  const { lang } = await params;
  const add = (await searchParams).add;
  let pkg = null;
  if (/^\d{1,9}$/.test(add ?? "") && isDatabaseConfigured()) {
    pkg = (await packagesByIds([add]).catch(() => ({})))[Number(add)] ?? null;
  }
  redirect(pkg ? `${localeHref(lang, `/services/${pkg.service}`)}?add=${pkg.id}#packages` : localeHref(lang, "/#services"));
}
