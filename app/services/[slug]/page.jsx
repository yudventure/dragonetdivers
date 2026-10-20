import Link from "next/link";
import { notFound } from "next/navigation";
import SeaConditions from "@/components/SeaConditions";
import ServiceCard, { ServiceVisual } from "@/components/ServiceCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { CheckIcon, ChatIcon, Wave } from "@/components/icons";
import { serviceBySlug, services } from "@/lib/services";
import { whatsappLink } from "@/lib/site";

// Halaman detail layanan: /services/fun-dives, /services/dive-courses, dst. (isi di src/lib/services.js).
// Dibangun saat build; kondisi laut di dalamnya diperbarui paling lama tiap 15 menit.
export const dynamicParams = false;
export const revalidate = 900;

export function generateStaticParams() {
  return services.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const service = serviceBySlug((await params).slug);
  if (!service) return {};
  return {
    title: service.title,
    description: `${service.summary} ${service.intro[0]}`.slice(0, 160),
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: { title: service.title, description: service.summary, url: `/services/${service.slug}` },
  };
}

export default async function ServicePage({ params }) {
  const service = serviceBySlug((await params).slug);
  if (!service) notFound();
  const ask = whatsappLink(`Hi Dragonet Divers, I'd like to ask about ${service.ask}.`);
  const others = services.filter(({ slug }) => slug !== service.slug);

  return (
    <>
      <SiteHeader />
      <main>
        <section aria-labelledby="service-title" className="bg-white">
          <div className="gutter mx-auto grid max-w-[1200px] items-center gap-10 pt-8 pb-4 md:pt-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
            <div className="grid content-start gap-4">
              <nav aria-label="Breadcrumb" className="text-sm text-slate">
                <ol className="flex flex-wrap items-center gap-2">
                  <li>
                    <Link href="/" className="hover:text-teal hover:underline">
                      Home
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li>
                    <Link href="/#services" className="hover:text-teal hover:underline">
                      Services
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li aria-current="page" className="font-semibold text-abyss">
                    {service.title}
                  </li>
                </ol>
              </nav>
              <p className="eyebrow mt-4">Raja Ampat · Dampier Strait</p>
              <h1 id="service-title" className="text-[2.5rem] leading-[1.05] text-abyss sm:text-[3.5rem]">
                {service.title}
              </h1>
              <p className="max-w-[46ch] text-lg text-slate">{service.summary}</p>
              <ul className="flex flex-wrap gap-2">
                {service.chips.map((chip) => (
                  <li key={chip} className="rounded-full bg-teal-soft px-3 py-1 text-xs font-bold text-teal">
                    {chip}
                  </li>
                ))}
              </ul>
              <div className="mt-2">
                {ask ? (
                  <a
                    href={ask}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-teal px-6 font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark"
                  >
                    <ChatIcon className="size-[18px]" />
                    Ask about {service.title.toLowerCase()}
                  </a>
                ) : (
                  <span className="inline-flex h-[26px] items-center rounded-full bg-teal-soft px-3 text-[11px] font-bold tracking-[0.08em] text-teal uppercase">
                    Bookings open soon
                  </span>
                )}
              </div>
            </div>
            <ServiceVisual service={service} className="aspect-[4/3] rounded-frame" sizes="(min-width: 1024px) 600px, 90vw" priority />
          </div>
        </section>

        <SeaConditions />

        <section aria-labelledby="about-title" className="bg-white">
          <div className="gutter mx-auto grid max-w-[1200px] gap-10 py-16 md:py-20 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <div className="grid content-start gap-3">
              <p className="eyebrow">About</p>
              <h2 id="about-title" className="text-[1.75rem] leading-[1.15] text-abyss sm:text-[2.125rem]">
                What to expect
              </h2>
              <Wave />
              {service.intro.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="max-w-[60ch] text-slate">
                  {paragraph}
                </p>
              ))}
              <p className="mt-2 max-w-[60ch] rounded-card bg-foam p-4 text-[15px] text-abyss">
                <span className="font-bold">Who it is for: </span>
                {service.forWho}
              </p>
            </div>
            <div className="grid content-start gap-4 rounded-card border border-mist p-6 sm:p-8">
              <h2 className="text-xl text-abyss">Good to know</h2>
              <ul className="grid gap-4">
                {service.goodToKnow.map((item) => (
                  <li key={item} className="grid grid-cols-[28px_1fr] items-start gap-3 text-[15px] text-slate">
                    <span className="mt-0.5 grid size-7 place-items-center rounded-full bg-teal-soft text-teal">
                      <CheckIcon className="size-4" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <p className="border-t border-mist pt-4 text-sm text-slate">Prices and schedules will be published here soon. Until then, just ask us.</p>
            </div>
          </div>
        </section>

        <section aria-labelledby="others-title" className="bg-foam">
          <div className="gutter mx-auto grid max-w-[1200px] gap-8 py-16 md:py-20">
            <h2 id="others-title" className="text-[1.75rem] leading-[1.15] text-abyss sm:text-[2.125rem]">
              More in Raja Ampat
            </h2>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((other) => (
                <li key={other.slug} className="grid">
                  <ServiceCard service={other} compact visualClassName="h-44" sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw" />
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
