import { preload } from "react-dom";
// Laut dalam dengan manta karang yang berenang bolak-balik: ilustrasi AI buatan Higgsfield di akun
// pemilik (GPT Image 2.5 + Kling 3.0), bukan dokumentasi lokasi (BRANDING.md §7). Video yang sama dengan
// latar panel kondisi laut (public/media/ocean-manta-loop.*), poster = frame pertamanya (manta kecil di
// kiri). Cara membuat ulang: brand/ocean/README.md.
import poster from "../assets/ocean-manta-loop.webp";
import { uiText } from "@/content/ui";
import { site } from "@/lib/site";
import { getSeaConditions } from "@/server/sea-conditions";
import LoopVideo from "./LoopVideo";
import { HeroConditions } from "./SeaConditionsPanel";

// Hero beranda (permintaan pemilik, Oktober 2026): video laut dalam dengan manta selebar layar, judul besar
// huruf kecil putih di kiri bawah, kondisi laut live di kanan bawah (menggantikan daftar layanan, yang tetap
// ada di seksi Services; data dari Open-Meteo lewat src/server/sea-conditions.js). Teks di atas gradasi Abyss
// (BRANDING.md §9.2). Hero ditarik ke belakang header yang transparan (64 px di ponsel, 72 px dari 640 px,
// ditambah garis bawah header 1 px); header berganti ke warna untuk latar gelap (SiteHeader overlay).
// Desktop: selalu setinggi layar. Ponsel dan tablet: kondisi laut di bawah video. conditionsLocked = bagian
// "conditions" ditutup mode developer, kartunya tidak ditampilkan. "\n" di teks judul (src/content/ui.js) = pindah baris.
export default async function HomeHero({ lang, conditionsLocked = false }) {
  preload(poster.src, { as: "image", fetchPriority: "high" });
  const t = uiText(lang);
  const conditions = conditionsLocked ? null : await getSeaConditions();
  const [titleLead, titleAccent] = t.hero.title;
  const leadLines = titleLead.split("\n");
  return (
    <section className="relative isolate -mt-[65px] bg-white sm:-mt-[73px]" aria-labelledby="hero-title">
      <div className="relative isolate h-[min(84svh,720px)] min-h-[520px] overflow-hidden bg-abyss lg:h-[max(640px,100svh)]">
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
          {/* Judul */}
          <div className="[text-shadow:0_2px_24px_rgb(10_50_59/0.55)] lg:pr-[380px]">
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
        </div>

        {/* Baris bawah: hak cipta & lokasi */}
        <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden lg:block">
          <div className="gutter mx-auto flex max-w-[max(1200px,85%)] items-end justify-between text-xs text-white/70">
            <span>© {new Date().getFullYear()} {site.shortName}</span>
            <span>Raja Ampat · Indonesia</span>
          </div>
        </div>

        {/* Penanda scroll */}
        <a href="#services" className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 text-white lg:flex" aria-label={t.hero.scrollLabel}>
          <span className="[writing-mode:vertical-rl] text-[11px] font-semibold tracking-[0.2em] uppercase">{t.hero.scroll}</span>
          <span className="h-12 w-px bg-white/60" aria-hidden="true" />
        </a>
      </div>

      {/* Kondisi laut live: di atas video kanan bawah sejajar judul (desktop, tepi kanan isi = 85% layar,
          minimal 1200 px, dikurangi gutter), di bawah video (ponsel, tablet). */}
      {!conditionsLocked && (
        <div className="gutter mx-auto max-w-[max(1200px,85%)] pt-8 lg:absolute lg:right-[max(32px,calc((100%-max(1200px,85%))/2+32px))] lg:bottom-24 lg:w-[340px] lg:max-w-none lg:p-0">
          <HeroConditions initial={conditions} lang={lang} t={t.conditions} />
        </div>
      )}
    </section>
  );
}
