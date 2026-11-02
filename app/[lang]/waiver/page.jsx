import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Wave } from "@/components/icons";
import WaiverForm from "@/components/waiver/WaiverForm";
import { uiText } from "@/content/ui";
import { defaultAgreement } from "@/content/waiver-agreement";
import { sameText } from "@/lib/admin-session";
import { isOrderCode, witToday } from "@/lib/checkout";
import { format, localeHref } from "@/lib/i18n";
import { contact, whatsappNumber } from "@/lib/site";
import { agreementBlocks, diversIn, firstDiveDate } from "@/lib/waiver";
import { orderByCode } from "@/server/orders";
import { getSiteSettings } from "@/server/site-settings";
import { DEFAULT_AGREEMENT, getAgreement } from "@/server/waivers";

// Formulir selam (/waiver, /id/waiver, ...): tiap penyelam mengisi data diri, profil penyelam, kuesioner medis,
// dan menandatangani perjanjian (src/components/waiver/WaiverForm.jsx). Dibuka dari halaman dan email pesanan
// selam (?order=<kode>&t=<token>: formulir ditautkan ke pesanan dan tanggalnya terisi), dari footer, atau di
// dive center. Tidak diindeks mesin pencari.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { title: uiText(lang).waiver.meta, robots: { index: false, follow: false } };
}

async function linkedOrder(lang, code, token) {
  if (!isOrderCode(code) || typeof token !== "string" || !/^[a-f0-9]{32}$/.test(token)) return null;
  const order = await orderByCode(code).catch(() => null);
  if (!order || !sameText(order.token, token) || diversIn(order.items) === 0) return null;
  return { code, token, date: firstDiveDate(order.items), href: localeHref(lang, `/order/${code}?t=${token}`) };
}

export default async function WaiverPage({ params, searchParams }) {
  const { lang } = await params;
  const { order: code, t: token } = await searchParams;
  await getSiteSettings(); // WhatsApp dan email dari /admin/kontak
  const all = uiText(lang);
  const t = all.waiver;
  const agreement = await getAgreement().catch((error) => {
    console.error(`[formulir] teks perjanjian tidak terbaca: ${error.code ?? error.message}`);
    return DEFAULT_AGREEMENT;
  });
  const order = await linkedOrder(lang, code, token);
  const path = order ? `/waiver?order=${order.code}&t=${order.token}` : "/waiver";
  const today = witToday();

  return (
    <>
      <SiteHeader lang={lang} path={path} />
      <main className="bg-foam">
        <div className="gutter mx-auto grid max-w-[820px] gap-6 py-10 md:py-16">
          <header className="grid gap-3">
            <p className="eyebrow">{t.eyebrow}</p>
            <h1 className="text-[2rem] leading-[1.1] text-abyss sm:text-[2.5rem]">{t.title}</h1>
            <Wave />
            <p className="max-w-[62ch] text-slate">{t.intro}</p>
            {order && (
              <p className="w-fit rounded-full bg-teal-soft px-4 py-1.5 text-sm font-bold text-teal-dark">{format(t.forOrder, { code: order.code })}</p>
            )}
          </header>
          <WaiverForm
            lang={lang}
            t={t}
            enMedical={lang === "en" ? null : uiText("en").waiver.medical}
            agreement={{
              en: agreementBlocks(agreement.en || defaultAgreement),
              translation: lang === "id" ? agreementBlocks(agreement.id) : [],
            }}
            order={order}
            today={today}
            contact={{ email: contact.email, whatsapp: whatsappNumber() }}
          />
        </div>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
