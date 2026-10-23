import Image from "next/image";
import Link from "next/link";
// Ilustrasi 3D (Higgsfield GPT Image 2.5, latar transparan), satu per layanan di src/lib/services.js.
import funDives from "../assets/services/fun-dives.webp";
import diveCourses from "../assets/services/dive-courses.webp";
import snorkeling from "../assets/services/snorkeling.webp";
import islandTrips from "../assets/services/island-trips.webp";
import duskDives from "../assets/services/dusk-dives.webp";
import { uiText } from "@/content/ui";
import { localeHref } from "@/lib/i18n";
import { Price } from "./currency";
import { ArrowIcon } from "./icons";

export const serviceArt = {
  "fun-dives": funDives,
  "dive-courses": diveCourses,
  snorkeling,
  "island-trips": islandTrips,
  "dusk-dives": duskDives,
};

// Panel ilustrasi: gradasi laguna seperti gelembung + chip teks putih yang melayang.
export function ServiceVisual({ service, className = "", sizes, priority = false, chips = true }) {
  const [first, second] = chips ? service.chips : [];
  return (
    <div
      className={`relative overflow-hidden bg-[radial-gradient(ellipse_at_50%_42%,var(--color-white)_0%,var(--color-lagoon-wash)_48%,color-mix(in_srgb,var(--color-lagoon)_30%,var(--color-white))_100%)] ${className}`}
    >
      <Image
        src={serviceArt[service.slug]}
        alt=""
        sizes={sizes}
        priority={priority}
        className="absolute inset-0 m-auto h-[74%] w-auto max-w-[80%] object-contain drop-shadow-[0_14px_18px_rgb(10_50_59/0.14)] transition-transform duration-300 ease-brand motion-safe:group-hover:scale-105"
      />
      {first && <span className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-teal shadow-float">{first}</span>}
      {second && <span className="absolute right-4 bottom-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-teal shadow-float">{second}</span>}
    </div>
  );
}

// Kartu layanan: seluruh kartu adalah tautan ke halaman detail. service = layanan dalam bahasa lang
// (localizeService di src/lib/services.js). compact = kartu kecil tanpa chip. from = harga mulai
// { price, unit } dari paket aktif termurah (servicePrices di src/server/packages.js, diisi tim di
// /admin/paket); dengan harga, kaki kartu berisi "From US$25 per person" dan tombol See packages,
// tanpa harga cukup tautan View details. Harga mengikuti mata uang pilihan tamu (<Price>).
export default function ServiceCard({ service, lang = "en", className = "", visualClassName = "h-52 md:h-56", sizes = "(min-width: 768px) 360px, 90vw", compact = false, from = null }) {
  const t = uiText(lang);
  const arrow = <ArrowIcon className="size-4 transition-transform duration-200 ease-brand motion-safe:group-hover:translate-x-0.5" />;
  return (
    <Link
      href={localeHref(lang, `/services/${service.slug}`)}
      className={`group flex flex-col overflow-hidden rounded-card border border-mist bg-white transition duration-200 ease-brand hover:border-teal hover:shadow-float motion-safe:hover:-translate-y-0.5 ${className}`}
    >
      <ServiceVisual service={service} className={visualClassName} sizes={sizes} chips={!compact} />
      <span className="flex flex-1 flex-col gap-1 p-5 sm:p-6">
        <span className="font-display text-xl leading-tight font-semibold text-abyss">{service.title}</span>
        <span className="text-[15px] text-slate">{service.summary}</span>
        {from ? (
          <>
            {/* Pengisi: kaki kartu sejajar di bawah walau ringkasan kartu sebelahnya lebih panjang. */}
            <span aria-hidden="true" className="min-h-3 flex-1" />
            <span className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-t border-mist pt-4">
              <span className="grid leading-tight">
                <span className="text-[11px] font-bold tracking-[0.14em] text-ember uppercase">{t.services.from}</span>
                <span className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
                  <Price idr={from.price} className="font-display text-[1.625rem] leading-none font-semibold text-abyss tabular-nums" />
                  <span className="text-sm text-slate">{from.unit === "group" ? t.packages.perGroup : t.packages.perPerson}</span>
                </span>
              </span>
              <span className="inline-flex h-10 items-center gap-1.5 rounded-full bg-teal px-4 text-sm font-bold whitespace-nowrap text-white transition-colors duration-200 ease-brand group-hover:bg-teal-dark">
                {t.packages.see}
                {arrow}
              </span>
            </span>
          </>
        ) : (
          <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-teal">
            {t.services.viewDetails}
            {arrow}
          </span>
        )}
      </span>
    </Link>
  );
}
