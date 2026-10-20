import HomeHero from "@/components/HomeHero";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { FishIcon, SunsetIcon, UsersIcon, Wave } from "@/components/icons";

// Halaman sementara selama website lengkap dibangun. Isinya hanya janji brand
// dan cerita logo (BRANDING.md §1); belum ada harga, jadwal, atau klaim lain.
const promises = [
  { icon: UsersIcon, title: "Small groups", text: "Fewer divers per guide, more time with the reef." },
  { icon: FishIcon, title: "Local guides", text: "Guides who know the Dampier Strait reefs by name." },
  { icon: SunsetIcon, title: "Dusk dives", text: "Watch mandarinfish pairs rise from the rubble at sunset." },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <HomeHero />

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
