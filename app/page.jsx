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

// Dibangun ulang paling lama tiap 15 menit agar kondisi laut di HTML tetap segar.
export const revalidate = 900;

// Beranda: hero, kondisi laut live, layanan, peta titik selam, galeri, kursus, cara ke base di Kurkapa, dan FAQ.
// Belum ada harga, jadwal, atau klaim bisnis yang belum diberikan pemilik (CLAUDE.md).
export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HomeHero />
        <SeaConditions />
        <HomeServices />
        <DiveSiteMap />
        <Gallery />
        <LearnToDive />
        <GettingHere />
        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}
