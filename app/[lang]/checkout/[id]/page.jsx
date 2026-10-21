import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { ArrowIcon } from "@/components/icons";
import { uiText } from "@/content/ui";
import { DIVE_SERVICES, dateRange } from "@/lib/checkout";
import { format, localeHref } from "@/lib/i18n";
import { localizePackage } from "@/lib/packages";
import { serviceBySlug } from "@/lib/services";
import { contact } from "@/lib/site";
import { paymentOptions } from "@/server/checkout";
import { packageById } from "@/server/packages";

// Checkout satu paket: /checkout/12 dan /id/checkout/12. Selalu dirender per permintaan karena
// harga, cara bayar yang aktif, dan kurs PayPal bisa berubah dari admin.
export const dynamic = "force-dynamic";
export const dynamicParams = true;

const loadPackage = cache(async (id) => {
  if (!/^\d{1,9}$/.test(id)) return null;
  try {
    return await packageById(Number(id), { activeOnly: true });
  } catch (error) {
    console.error(`[checkout] paket ${id} tidak terbaca: ${error.code ?? error.message}`);
    return null;
  }
});

export async function generateMetadata({ params }) {
  const { lang, id } = await params;
  const pkg = await loadPackage(id);
  return {
    title: pkg ? format(uiText(lang).checkout.title, { name: lang === "id" ? pkg.nameId : pkg.nameEn }) : "Checkout",
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage({ params }) {
  const { lang, id } = await params;
  const row = await loadPackage(id);
  if (!row) notFound();
  const pkg = localizePackage(row, lang);
  const service = serviceBySlug(pkg.service, lang);
  const t = uiText(lang).checkout;
  const { methods, status, rate, settings } = await paymentOptions();
  const serviceHref = localeHref(lang, `/services/${pkg.service}#packages`);

  return (
    <>
      <SiteHeader lang={lang} path={`/checkout/${pkg.id}`} />
      <main className="bg-foam">
        <div className="gutter mx-auto grid max-w-[1200px] gap-6 py-8 md:py-12">
          <div className="grid gap-3">
            <Link href={serviceHref} className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-teal hover:underline">
              <ArrowIcon className="size-4 rotate-180" />
              {format(t.back, { service: service?.title ?? pkg.service })}
            </Link>
            <p className="eyebrow">{t.eyebrow}</p>
            <h1 className="text-[2rem] leading-[1.1] text-abyss sm:text-[2.75rem]">{format(t.title, { name: pkg.name })}</h1>
          </div>
          <CheckoutForm
            lang={lang}
            t={t}
            pkg={pkg}
            serviceTitle={service?.title ?? pkg.service}
            methods={methods.map((m) => ({ id: m, sandbox: Boolean(status[m].sandbox) }))}
            rate={rate?.idrPerUsd ?? null}
            dueHours={settings.dueHours}
            range={dateRange()}
            isDive={DIVE_SERVICES.includes(pkg.service)}
            email={contact.email}
          />
        </div>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
