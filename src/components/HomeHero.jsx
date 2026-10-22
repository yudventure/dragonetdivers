import { preload } from "react-dom";
// Laut dalam dengan manta karang yang berenang bolak-balik: ilustrasi AI buatan Higgsfield di akun
// pemilik (GPT Image 2.5 + Kling 3.0), bukan dokumentasi lokasi (BRANDING.md §7). Video yang sama dengan
// latar panel kondisi laut (public/media/ocean-manta-loop.*), poster = frame pertamanya (manta kecil di
// kiri). Cara membuat ulang: brand/ocean/README.md.
import poster from "../assets/ocean-manta-loop.webp";
import { uiText } from "@/content/ui";
import { format } from "@/lib/i18n";
import { site, whatsappLink } from "@/lib/site";
import LoopVideo from "./LoopVideo";
import { ArrowIcon, CapIcon, FishIcon, WavesIcon } from "./icons";

// Ikon tiga layanan utama dari BRANDING.md §1 (yang dijual); teksnya di src/content/ui.js (hero.services).
// Tanpa harga atau jadwal.
const ICONS = [FishIcon, CapIcon, WavesIcon];

// Gaya daftar layanan: kaca gelap di atas video (desktop) atau kartu terang di bawah video (ponsel, tablet).
const LIST = {
  dark: {
    item: "border-white/15 bg-abyss/35 backdrop-blur-md first:border-white/35 first:bg-abyss/55 hover:border-white/35",
    icon: "bg-white/15 text-white",
    number: "text-sunrise",
    title: "text-white",
    text: "text-white/80",
    link: "text-white",
  },
  light: {
    item: "border-transparent hover:border-mist hover:bg-foam first:border-mist first:bg-foam",
    icon: "bg-teal-soft text-teal",
    number: "text-ember",
    title: "text-abyss",
    text: "text-slate",
    link: "text-teal",
  },
};

function ServiceList({ t, tone, className }) {
  const s = LIST[tone];
  return (
    <ol className={`grid gap-2 ${className}`}>
      {t.hero.services.map(({ title, text, topic }, index) => {
        const Icon = ICONS[index];
        const link = whatsappLink(format(t.whatsapp.about, { topic }));
        return (
          <li key={title} className={`grid grid-cols-[48px_1fr] items-start gap-4 rounded-card border p-4 transition-colors duration-200 ease-brand ${s.item}`}>
            <span className={`grid size-12 place-items-center rounded-full ${s.icon}`}>
              <Icon className="size-6" />
            </span>
            <span className="grid gap-1">
              <span className={`text-xs font-bold tracking-[0.14em] tabular-nums ${s.number}`}>{String(index + 1).padStart(2, "0")}</span>
              <span className={`font-display text-xl leading-tight font-semibold ${s.title}`}>{title}</span>
              <span className={`text-sm leading-snug ${s.text}`}>{text}</span>
              {link && (
                <a href={link} className={`mt-1 inline-flex w-fit items-center gap-1.5 text-sm font-bold underline-offset-4 hover:underline ${s.link}`}>
                  {t.hero.ask}
                  <ArrowIcon className="size-4" />
                </a>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// Hero beranda (permintaan pemilik, Oktober 2026): video laut dalam dengan manta selebar layar, judul besar
// huruf kecil putih di kiri bawah, daftar layanan bernomor di kanan bawah. Teks di atas gradasi Abyss
// (BRANDING.md §9.2). Desktop: hero ditarik 72 px ke belakang header yang transparan (header berganti ke
// warna untuk latar gelap, SiteHeader overlay) dan selalu setinggi layar. Ponsel dan tablet: video di bawah
// header, daftar layanan di bawah video. "\n" di teks judul (src/content/ui.js) = pindah baris.
export default function HomeHero({ lang }) {
  preload(poster.src, { as: "image", fetchPriority: "high" });
  const t = uiText(lang);
  const [titleLead, titleAccent] = t.hero.title;
  const leadLines = titleLead.split("\n");
  return (
    <section className="relative isolate bg-white lg:-mt-[72px]" aria-labelledby="hero-title">
      <div className="relative isolate h-[min(74svh,640px)] min-h-[460px] overflow-hidden bg-abyss lg:h-[max(640px,100svh)]">
        {/* Manta mulai kecil di kiri; di layar tegak potongan video digeser ke kiri supaya manta tetap terlihat. */}
        <LoopVideo
          sources={[
            { src: "/media/ocean-manta-loop.webm", type: "video/webm" },
            { src: "/media/ocean-manta-loop.mp4", type: "video/mp4" },
          ]}
          poster={poster.src}
          className="absolute inset-0 -z-10 size-full object-cover object-[30%_40%] lg:object-[center_40%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(10_50_59/0.5)_0%,rgb(10_50_59/0)_24%,rgb(10_50_59/0)_42%,rgb(10_50_59/0.78)_100%)]"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 hidden bg-[linear-gradient(90deg,rgb(10_50_59/0.45)_0%,rgb(10_50_59/0)_50%)] lg:block" />

        <div className="gutter relative mx-auto flex h-full max-w-[max(1200px,85%)] items-end pb-10 lg:pb-24">
          <div className="flex w-full items-end justify-between gap-10">
            {/* Judul */}
            <div className="[text-shadow:0_2px_24px_rgb(10_50_59/0.55)]">
              <h1
                id="hero-title"
                className="font-display text-[clamp(3.25rem,min(6.8vw,12.5svh),10rem)] leading-[0.88] font-semibold tracking-[-0.02em] text-white lowercase"
              >
                {leadLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
                <span className="block text-sunrise">{titleAccent}</span>
              </h1>
              <p className="mt-5 pl-1 text-lg text-white/85 lg:mt-6 lg:pl-[0.35em] lg:text-xl">{site.name}</p>
            </div>

            {/* Daftar layanan bernomor di atas video (desktop) */}
            <ServiceList t={t} tone="dark" className="hidden w-[320px] shrink-0 lg:grid" />
          </div>
        </div>

        {/* Baris bawah: hak cipta & lokasi */}
        <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden lg:block">
          <div className="gutter mx-auto flex max-w-[max(1200px,85%)] items-end justify-between text-xs text-white/70">
            <span>© {new Date().getFullYear()} {site.shortName}</span>
            <span>Raja Ampat · Indonesia</span>
          </div>
        </div>

        {/* Penanda scroll */}
        <a href="#conditions" className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 text-white lg:flex" aria-label={t.hero.scrollLabel}>
          <span className="[writing-mode:vertical-rl] text-[11px] font-semibold tracking-[0.2em] uppercase">{t.hero.scroll}</span>
          <span className="h-12 w-px bg-white/60" aria-hidden="true" />
        </a>
      </div>

      {/* Daftar layanan bernomor di bawah video (ponsel, tablet) */}
      <div className="gutter mx-auto max-w-[max(1200px,85%)] lg:hidden">
        <ServiceList t={t} tone="light" className="py-8 sm:grid-cols-3" />
      </div>
    </section>
  );
}
