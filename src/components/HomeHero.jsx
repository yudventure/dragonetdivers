import Image from "next/image";
// Potongan penyelam + gelembung tanpa latar laut (WebP transparan).
// Sumber: foto pada desain referensi yang diberikan pemilik. Ganti dengan foto
// milik sendiri / berlisensi jelas sebelum peluncuran resmi (BRANDING.md §7).
import diver from "../assets/hero-diver.webp";
import { site, whatsappLink } from "@/lib/site";
import { ArrowIcon, CapIcon, FishIcon, WavesIcon } from "./icons";

// Layanan dari BRANDING.md §1 (yang dijual). Tanpa harga atau jadwal.
const services = [
  { icon: FishIcon, title: "Fun dives", text: "Guided dives on the reefs of the Dampier Strait.", ask: "fun dives" },
  { icon: CapIcon, title: "Dive courses", text: "From your first breath underwater to the next level.", ask: "dive courses" },
  { icon: WavesIcon, title: "Snorkeling & trips", text: "Reef snorkeling and island days for the whole family.", ask: "snorkeling and trips" },
];

// Hero beranda: judul besar huruf kecil di kiri menimpa sebagian gambar,
// penyelam di tengah di atas putih, daftar layanan bernomor di kanan.
export default function HomeHero() {
  return (
    <section className="relative isolate overflow-hidden bg-white" aria-labelledby="hero-title">
      <div className="gutter relative mx-auto flex max-w-[1200px] flex-col lg:block lg:h-[clamp(640px,calc(100svh-72px),880px)]">
        {/* Penyelam: di tengah, menempel ke bawah */}
        <div className="order-2 mx-auto w-[min(78vw,420px)] lg:absolute lg:inset-y-0 lg:left-1/2 lg:w-auto lg:-translate-x-[46%]">
          <Image
            src={diver}
            alt="Diver in a mask breathing out a cloud of bubbles"
            priority
            sizes="(min-width: 1024px) 640px, 78vw"
            className="h-auto w-full lg:h-full lg:w-auto lg:max-w-none"
          />
        </div>

        {/* Judul */}
        <div className="relative z-10 order-1 pt-10 pb-6 lg:absolute lg:top-1/2 lg:left-[max(32px,env(safe-area-inset-left,0px))] lg:-translate-y-[58%] lg:p-0">
          <h1
            id="hero-title"
            className="font-display text-[clamp(3.25rem,8.2vw,7.75rem)] leading-[0.88] font-semibold tracking-[-0.02em] text-abyss lowercase [text-shadow:0_0_28px_rgb(255_255_255/0.9)]"
          >
            dive into
            <br />
            <span className="text-teal">colour.</span>
          </h1>
          <p className="mt-5 pl-1 text-lg text-slate lg:mt-6 lg:pl-[0.35em] lg:text-xl">{site.name}</p>
        </div>

        {/* Daftar layanan bernomor */}
        <ol className="relative z-10 order-3 grid gap-2 py-8 lg:absolute lg:top-1/2 lg:right-[max(32px,env(safe-area-inset-right,0px))] lg:w-[300px] lg:-translate-y-1/2 lg:py-0">
          {services.map(({ icon: Icon, title, text, ask }, index) => {
            const link = whatsappLink(`Hi Dragonet Divers, I'd like to ask about ${ask}.`);
            return (
              <li
                key={title}
                className="group grid grid-cols-[56px_1fr] items-start gap-4 rounded-card border border-transparent p-4 transition-colors duration-200 ease-brand hover:border-mist hover:bg-foam first:border-mist first:bg-foam"
              >
                <span className="grid size-14 place-items-center rounded-full bg-teal-soft text-teal ring-2 ring-white ring-offset-2 ring-offset-transparent group-first:ring-teal group-hover:ring-teal">
                  <Icon className="size-6" />
                </span>
                <span className="grid gap-1">
                  <span className="text-xs font-bold tracking-[0.14em] text-ember tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                  <span className="font-display text-xl leading-tight font-semibold text-abyss">{title}</span>
                  <span className="text-sm leading-snug text-slate">{text}</span>
                  {link && (
                    <a href={link} className="mt-1 inline-flex w-fit items-center gap-1.5 text-sm font-bold text-teal underline-offset-4 hover:underline">
                      Ask on WhatsApp
                      <ArrowIcon className="size-4" />
                    </a>
                  )}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Baris bawah: hak cipta, scroll, lokasi */}
        <div className="pointer-events-none absolute inset-x-[max(32px,env(safe-area-inset-left,0px))] bottom-6 z-10 hidden items-end justify-between text-xs text-slate lg:flex">
          <span>© {new Date().getFullYear()} {site.shortName}</span>
          <a href="#story" className="pointer-events-auto flex flex-col items-center gap-3 text-abyss" aria-label="Scroll down to our story">
            <span className="[writing-mode:vertical-rl] text-[11px] font-semibold tracking-[0.2em] uppercase">Scroll down</span>
            <span className="h-12 w-px bg-abyss/40" aria-hidden="true" />
          </a>
          <span>Raja Ampat · Indonesia</span>
        </div>
      </div>
    </section>
  );
}
