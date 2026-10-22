import { connection } from "next/server";
import DiveSiteMap from "@/components/DiveSiteMap";
import Faq from "@/components/Faq";
import Gallery from "@/components/Gallery";
import GettingHere from "@/components/GettingHere";
import HomeHero from "@/components/HomeHero";
import HomeServices from "@/components/HomeServices";
import LockedSection from "@/components/LockedSection";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { sectionLocked } from "@/lib/developer";
import { alternates, localeHref } from "@/lib/i18n";
import { developerView } from "@/server/developer";

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { alternates: { canonical: localeHref(lang, "/"), languages: { ...alternates("/"), "x-default": "/" } } };
}

// Bagian beranda berurutan, dengan kunci mode developer masing-masing (src/lib/developer.js). Kondisi laut
// live ada di dalam hero (kunci "conditions" menyembunyikan kartunya).
const SECTIONS = [
  ["services", HomeServices],
  ["dive-sites", DiveSiteMap],
  ["gallery", Gallery],
  ["getting-here", GettingHere],
  ["faq", Faq],
];

// Beranda (/ dan /id): hero, kondisi laut live, layanan, peta titik selam, galeri, cara ke base
// di Kurkapa, dan FAQ. Belum ada harga, jadwal, atau klaim bisnis yang belum diberikan pemilik (CLAUDE.md).
// Dirender per permintaan karena bagian yang ditutup mode developer berbeda untuk operator dan pengunjung;
// kondisi laut dan kurs tetap diambil dari data cache Next.js (15 menit dan 12 jam).
export default async function HomePage({ params }) {
  await connection();
  const { lang } = await params;
  const { locks } = await developerView();
  return (
    <>
      <SiteHeader lang={lang} path="/" overlay />
      <main>
        <HomeHero lang={lang} conditionsLocked={sectionLocked(locks, "conditions")} />
        {SECTIONS.map(([id, Section]) => (sectionLocked(locks, id) ? <LockedSection key={id} id={id} lang={lang} /> : <Section key={id} lang={lang} />))}
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
