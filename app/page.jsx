import Image from "next/image";
import plate from "../brand/logo/dragonet-divers-logo-plate.png";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { ArrowIcon, ChatIcon, FishIcon, SunsetIcon, UsersIcon, Wave } from "@/components/icons";
import { whatsappLink } from "@/lib/site";

// Halaman sementara selama website lengkap dibangun. Isinya hanya janji brand
// dan cerita logo (BRANDING.md §1); belum ada harga, jadwal, atau klaim lain.
const promises = [
  { icon: UsersIcon, title: "Small groups", text: "Fewer divers per guide, more time with the reef." },
  { icon: FishIcon, title: "Local guides", text: "Guides who know the Dampier Strait reefs by name." },
  { icon: SunsetIcon, title: "Dusk dives", text: "Watch mandarinfish pairs rise from the rubble at sunset." },
];

export default function HomePage() {
  const booking = whatsappLink("Hi Dragonet Divers, I'd like to ask about diving in Raja Ampat.");
  return (
    <>
      <SiteHeader />
      <main>
        <section className="gutter mx-auto grid max-w-[1200px] items-center gap-12 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div className="grid gap-5">
            <p className="eyebrow">Raja Ampat · Dampier Strait</p>
            <h1 className="text-[2.5rem] leading-[1.05] tracking-[-0.01em] text-abyss sm:text-6xl">
              Dive into <span className="text-teal">colour.</span>
            </h1>
            <p className="max-w-[56ch] text-lg text-slate">
              Small-group diving, courses and snorkeling trips in Raja Ampat. Our full website is on its way.
            </p>
            <p className="text-[15px] italic text-teal">Menyelam ke dalam warna. Website lengkap kami segera hadir.</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {booking && (
                <a href={booking} className="inline-flex h-12 items-center gap-2 rounded-full bg-mandarin px-6 text-[15px] font-bold text-abyss transition-colors duration-200 ease-brand hover:bg-mandarin-hover">
                  <ChatIcon className="size-[18px]" />
                  Chat on WhatsApp
                </a>
              )}
              <a href="#story" className="inline-flex h-12 items-center gap-2 rounded-full border-[1.5px] border-teal px-6 text-[15px] font-bold text-teal transition-colors duration-200 ease-brand hover:bg-teal-soft">
                Our story
                <ArrowIcon className="size-4" />
              </a>
            </div>
          </div>
          <div className="grid aspect-square w-full max-w-[440px] place-items-center justify-self-center rounded-frame bg-foam">
            <Image src={plate} alt="Dragonet Divers Raja Ampat badge: two mandarinfish facing each other at sunset" priority className="w-[68%]" />
          </div>
        </section>

        <section id="story" className="scroll-mt-24 bg-foam">
          <div className="gutter mx-auto grid max-w-[1200px] gap-10 py-16 md:grid-cols-[1fr_1fr] md:py-24">
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
            <ul className="grid content-start gap-4">
              {promises.map(({ icon: Icon, title, text }) => (
                <li key={title} className="grid grid-cols-[44px_1fr] items-start gap-4 rounded-card border border-mist bg-white p-5">
                  <span className="grid size-11 place-items-center rounded-full bg-teal-soft text-teal">
                    <Icon className="size-[22px]" />
                  </span>
                  <span className="grid gap-1">
                    <span className="text-lg font-bold">{title}</span>
                    <span className="text-[15px] text-slate">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
