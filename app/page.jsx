import Image from "next/image";
import plate from "../brand/logo/dragonet-divers-logo-plate.png";
import HomeFeatures from "@/components/HomeFeatures";
import HomeHero from "@/components/HomeHero";
import HomeServices from "@/components/HomeServices";
import LearnToDive from "@/components/LearnToDive";
import SeaConditions from "@/components/SeaConditions";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { ArrowIcon, Wave } from "@/components/icons";
import { whatsappLink } from "@/lib/site";

// Dibangun ulang paling lama tiap 15 menit agar kondisi laut di HTML tetap segar.
export const revalidate = 900;

// Halaman sementara selama website lengkap dibangun. Isinya hanya janji brand,
// layanan, dan cerita logo (BRANDING.md §1); belum ada harga, jadwal, atau klaim lain.
export default function HomePage() {
  const chat = whatsappLink("Hi Dragonet Divers, I'd like to plan some diving in Raja Ampat.");
  return (
    <>
      <SiteHeader />
      <main>
        <HomeHero />
        <SeaConditions />
        <HomeServices />
        <HomeFeatures />
        <LearnToDive />

        <section id="story" className="scroll-mt-24 bg-foam">
          <div className="gutter mx-auto grid max-w-[1200px] items-center gap-10 py-16 md:grid-cols-[1fr_auto] md:gap-16 md:py-24">
            <div className="grid content-start gap-3">
              <p className="eyebrow">Our name</p>
              <h2 className="text-[1.75rem] leading-[1.15] text-abyss sm:text-[2.125rem]">Named after the fish that dances at dusk</h2>
              <Wave />
              <p className="max-w-[60ch] text-slate">
                Dragonets are a family of small reef fish, and the mandarinfish is the most famous of them. At sunset, mandarinfish pairs rise from
                the coral rubble to dance together. Our badge captures that moment: two mandarinfish, the sun over a karst island, and the sea of
                Raja Ampat.
              </p>
            </div>
            {/* Versi plate: pita tulisan logo asli transparan, latar section Foam (BRANDING.md §2) */}
            <Image src={plate} alt="Dragonet Divers badge: two mandarinfish under a sunset over Raja Ampat" className="mx-auto size-52 md:size-64" />
          </div>
        </section>

        <section aria-labelledby="plan-title" className="bg-white">
          <div className="gutter mx-auto grid max-w-[1200px] justify-items-center gap-4 py-16 text-center md:py-24">
            <p className="eyebrow">Fun dives · Courses · Snorkeling</p>
            <h2 id="plan-title" className="text-[1.75rem] leading-[1.15] text-abyss sm:text-[2.25rem]">
              Plan your days in Raja Ampat
            </h2>
            <Wave />
            <p className="max-w-[52ch] text-slate">Fun dives, dive courses and snorkeling trips around the Dampier Strait.</p>
            {chat ? (
              <a
                href={chat}
                className="mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-teal px-6 font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark"
              >
                Chat on WhatsApp
                <ArrowIcon className="size-[18px]" />
              </a>
            ) : (
              <span className="mt-4 inline-flex h-[26px] items-center rounded-full bg-teal-soft px-3 text-[11px] font-bold tracking-[0.08em] text-teal uppercase">
                Bookings open soon
              </span>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
