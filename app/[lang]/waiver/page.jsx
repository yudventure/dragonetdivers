import Image from "next/image";
import logoPlate from "../../../brand/logo/dragonet-divers-logo-plate.png";
import learnDiver from "@/assets/learn-diver.webp";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { CheckIcon } from "@/components/icons";
import WaiverForm from "@/components/waiver/WaiverForm";
import { uiText } from "@/content/ui";
import { defaultAgreements } from "@/content/waiver-agreement";
import { sameText } from "@/lib/admin-session";
import { isOrderCode, witToday } from "@/lib/checkout";
import { format, localeHref } from "@/lib/i18n";
import { contact, whatsappNumber } from "@/lib/site";
import { agreementBlocks, agreementFor, agreementTexts, diversIn, firstDiveDate } from "@/lib/waiver";
import { orderByCode } from "@/server/orders";
import { getSiteSettings } from "@/server/site-settings";
import { DEFAULT_AGREEMENT, getAgreement, waiverPhoto } from "@/server/waivers";

// Formulir selam (/waiver, /id/waiver, ...): tiap penyelam mengisi data diri, profil penyelam, kuesioner medis,
// dan menandatangani perjanjian (src/components/waiver/WaiverForm.jsx). Dibuka dari halaman dan email pesanan
// selam (?order=<kode>&t=<token>: formulir ditautkan ke pesanan dan tanggalnya terisi), dari footer, atau di
// dive center. Tidak diindeks mesin pencari.
// Tata letak dua kolom (permintaan pemilik 2 November 2026): kiri panel branding Dragonet dengan foto penyelam
// terbaik dari galeri (dipilih di /admin/formulir, bawaan src/assets/learn-diver.webp) yang menempel saat
// digulir, kanan formulir. Di ponsel panel foto di atas formulir.
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
  const saved = await getAgreement().catch((error) => {
    console.error(`[formulir] teks perjanjian tidak terbaca: ${error.code ?? error.message}`);
    return DEFAULT_AGREEMENT;
  });
  // Perjanjian dalam bahasa halaman; English bila bahasa ini belum punya teks.
  const shown = agreementFor(agreementTexts(saved, defaultAgreements), lang);
  const order = await linkedOrder(lang, code, token);
  const path = order ? `/waiver?order=${order.code}&t=${order.token}` : "/waiver";
  const today = witToday();
  const photo = (await waiverPhoto().catch(() => null)) ?? learnDiver;

  return (
    <>
      <SiteHeader lang={lang} path={path} />
      <main className="bg-foam">
        <div className="gutter mx-auto grid max-w-[1240px] gap-6 py-6 md:py-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-10">
          <aside className="relative isolate flex min-h-[440px] flex-col justify-between gap-8 overflow-hidden rounded-frame bg-abyss p-6 text-white sm:min-h-[480px] sm:p-8 lg:sticky lg:top-24 lg:h-[calc(100svh-8rem)] lg:min-h-[560px]">
            <Image
              src={photo}
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 480px, 100vw"
              placeholder={photo.blurDataURL ? "blur" : "empty"}
              className="-z-20 object-cover"
            />
            <span aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-abyss via-abyss/60 to-abyss/10" />
            <div className="flex items-center gap-3">
              <Image src={logoPlate} alt="" width={52} height={52} className="size-13" />
              <span className="grid leading-none">
                <span className="font-display text-xl font-semibold">Dragonet Divers</span>
                <span className="mt-2.5 text-[10px] font-bold tracking-[0.2em] text-white/80">RAJA AMPAT</span>
              </span>
            </div>
            <div className="grid gap-4">
              <p className="text-xs font-bold tracking-[0.18em] text-sunrise uppercase">{t.eyebrow}</p>
              <h1 className="text-[1.75rem] leading-[1.12] sm:text-[2.25rem]">{t.title}</h1>
              <p className="max-w-[46ch] text-[15px] text-white/85">{t.intro}</p>
              {order && <p className="w-fit rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold">{format(t.forOrder, { code: order.code })}</p>}
              <ul className="hidden gap-2 pt-1 sm:grid">
                {t.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-white/90">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-teal text-white">
                      <CheckIcon className="size-3" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
          <WaiverForm
            lang={lang}
            t={t}
            dateText={all.datePicker}
            enMedical={lang === "en" ? null : uiText("en").waiver.medical}
            agreement={{ blocks: agreementBlocks(shown.text), lang: shown.lang, fallback: shown.lang !== lang }}
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
