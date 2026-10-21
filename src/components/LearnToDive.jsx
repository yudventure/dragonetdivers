import Image from "next/image";
// Ilustrasi AI (Higgsfield, GPT Image 2.5): penyelam di air terbuka, bukan
// dokumentasi lokasi (BRANDING.md §7). Ganti dengan foto kursus asli bila ada.
import photo from "../assets/learn-diver.webp";
import { uiText } from "@/content/ui";
import { format, localeHref } from "@/lib/i18n";
import { whatsappLink } from "@/lib/site";
import { ArrowIcon, GaugeIcon, LifeBuoyIcon, Wave } from "./icons";

// Ikon dua langkah; teksnya di src/content/ui.js (learn.steps).
const ICONS = [LifeBuoyIcon, GaugeIcon];

// Blok kursus: foto berbingkai di atas lingkaran gelembung, teks + dua langkah + satu tombol Teal
// (tombol oranye tetap satu per layar, di header).
export default function LearnToDive({ lang }) {
  const all = uiText(lang);
  const t = all.learn;
  const ask = whatsappLink(format(all.whatsapp.about, { topic: t.topic }));
  return (
    <section id="learn" aria-labelledby="learn-title" className="scroll-mt-24 overflow-hidden bg-white">
      <div className="gutter mx-auto grid max-w-[1200px] items-center gap-12 py-20 md:py-28 lg:grid-cols-2 lg:gap-16">
        <div className="relative mx-auto w-full max-w-[520px]">
          {/* Lingkaran gelembung di belakang foto */}
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-0 aspect-square w-[82%] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_32%_28%,var(--color-white)_0%,var(--color-lagoon-wash)_34%,color-mix(in_srgb,var(--color-lagoon)_38%,var(--color-white))_100%)] ring-1 ring-lagoon/25"
          />
          <div aria-hidden="true" className="absolute top-[18%] left-[9%] size-5 rounded-full bg-white/80 ring-1 ring-lagoon/25" />
          <div className="relative ml-auto w-[68%] overflow-hidden rounded-frame shadow-float">
            <Image
              src={photo}
              alt={t.photoAlt}
              sizes="(min-width: 1024px) 354px, 62vw"
              className="h-auto w-full"
            />
          </div>
        </div>

        <div className="grid content-start gap-4">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 id="learn-title" className="text-[1.75rem] leading-[1.15] text-abyss sm:text-[2.25rem]">
            {t.title}
          </h2>
          <Wave />
          <p className="max-w-[56ch] text-slate">{t.text}</p>

          <ul className="mt-2 grid gap-5">
            {t.steps.map(({ title, text }, index) => {
              const Icon = ICONS[index];
              return (
                <li key={title} className="grid grid-cols-[48px_1fr] items-start gap-4">
                  <span className="grid size-12 place-items-center rounded-full bg-teal-soft text-teal">
                    <Icon className="size-6" />
                  </span>
                  <span className="grid gap-0.5">
                    <span className="font-display text-xl leading-tight font-semibold text-teal">{title}</span>
                    <span className="text-[15px] text-slate">{text}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <a
            href={ask ?? localeHref(lang, "/#getting-here")}
            className="mt-4 inline-flex h-12 w-fit items-center gap-2 rounded-full bg-teal px-6 font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark"
          >
            {ask ? t.ask : t.fallback}
            <ArrowIcon className="size-[18px]" />
          </a>
        </div>
      </div>
    </section>
  );
}
