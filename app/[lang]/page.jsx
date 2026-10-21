import DiveSiteMap from "@/components/DiveSiteMap";
import Faq from "@/components/Faq";
import Gallery from "@/components/Gallery";
import GettingHere from "@/components/GettingHere";
import HomeHero from "@/components/HomeHero";
import HomeServices from "@/components/HomeServices";
import LearnToDive from "@/components/LearnToDive";
import SeaConditions from "@/components/SeaConditions";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { alternates, localeHref } from "@/lib/i18n";

// Dibangun ulang paling lama tiap 15 menit agar kondisi laut di HTML tetap segar.
export const revalidate = 900;

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { alternates: { canonical: localeHref(lang, "/"), languages: { ...alternates("/"), "x-default": "/" } } };
}

// Beranda (/ dan /id): hero, kondisi laut live, layanan, peta titik selam, galeri, kursus, cara ke base
// di Kurkapa, dan FAQ. Belum ada harga, jadwal, atau klaim bisnis yang belum diberikan pemilik (CLAUDE.md).
export default async function HomePage({ params }) {
  const { lang } = await params;
  return (
    <>
      <SiteHeader lang={lang} path="/" />
      <main>
        <HomeHero lang={lang} />
        <SeaConditions lang={lang} />
        <HomeServices lang={lang} />
        <DiveSiteMap lang={lang} />
        <Gallery lang={lang} />
        <LearnToDive lang={lang} />
        <GettingHere lang={lang} />
        <Faq lang={lang} />
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
