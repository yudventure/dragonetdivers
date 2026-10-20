import { LeafIcon, MapPinIcon, SunsetIcon, UsersIcon } from "./icons";

// Empat janji brand (BRANDING.md §1, §7) dalam satu baris ikon, tepat di bawah hero.
// Hanya janji yang sudah ada di pedoman brand; tanpa angka, sertifikasi, atau klaim baru.
const features = [
  { icon: UsersIcon, title: "Small groups", text: "Fewer divers per guide, more time with the reef." },
  { icon: MapPinIcon, title: "Local guides", text: "Guides who know the Dampier Strait reefs by name." },
  { icon: LeafIcon, title: "Respect for the reef", text: "Good buoyancy, hands off the coral and space for marine life." },
  { icon: SunsetIcon, title: "Dusk dives", text: "Watch mandarinfish pairs rise from the rubble at sunset." },
];

export default function HomeFeatures() {
  return (
    <section aria-labelledby="features-title" className="bg-white">
      <h2 id="features-title" className="sr-only">
        Why dive with us
      </h2>
      <ul className="gutter mx-auto grid max-w-[1200px] gap-x-8 gap-y-12 py-16 sm:grid-cols-2 md:py-24 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, text }) => (
          <li key={title} className="group grid justify-items-center gap-3 text-center">
            <span className="mb-2 grid size-20 place-items-center rounded-full bg-white text-teal shadow-float ring-1 ring-mist transition-colors duration-200 ease-brand group-hover:ring-teal">
              <Icon className="size-8" />
            </span>
            <h3 className="text-xl leading-tight text-teal">{title}</h3>
            <p className="max-w-[26ch] text-[15px] leading-relaxed text-slate">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
