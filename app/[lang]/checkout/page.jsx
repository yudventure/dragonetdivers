import CartCheckout from "@/components/checkout/CartCheckout";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { uiText } from "@/content/ui";
import { dateRange } from "@/lib/checkout";
import { servicesIn } from "@/lib/services";
import { contact } from "@/lib/site";
import { paymentOptions } from "@/server/checkout";

// Checkout keranjang: /checkout dan /id/checkout. Isi keranjang ada di peramban tamu (src/components/cart.jsx);
// halaman ini hanya membawa cara bayar yang aktif, kurs PayPal, dan rentang tanggal, jadi selalu per permintaan.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { title: uiText(lang).checkout.cartTitle, robots: { index: false, follow: false } };
}

export default async function CartCheckoutPage({ params }) {
  const { lang } = await params;
  const all = uiText(lang);
  const t = all.checkout;
  const { methods, status, rate, settings } = await paymentOptions();
  return (
    <>
      <SiteHeader lang={lang} path="/checkout" />
      <main className="bg-foam">
        <div className="gutter mx-auto grid max-w-[1200px] gap-6 py-8 md:py-12">
          <div className="grid gap-3">
            <p className="eyebrow">{t.eyebrow}</p>
            <h1 className="text-[2rem] leading-[1.1] text-abyss sm:text-[2.75rem]">{t.cartTitle}</h1>
            <p className="max-w-[60ch] text-slate">{t.cartIntro}</p>
          </div>
          <CartCheckout
            lang={lang}
            t={t}
            cartText={all.cart}
            unitText={all.packages}
            serviceTitles={Object.fromEntries(servicesIn(lang).map((s) => [s.slug, s.title]))}
            methods={methods.map((m) => ({ id: m, sandbox: Boolean(status[m].sandbox) }))}
            rate={rate?.idrPerUsd ?? null}
            dueHours={settings.dueHours}
            range={dateRange()}
            email={contact.email}
          />
        </div>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
