import { services } from "@/lib/services";
import { whatsappLink } from "@/lib/site";
import ServiceCard from "./ServiceCard";
import { ChatIcon } from "./icons";

// Grid layanan lengkap gaya "bento": dua kartu besar di atas, tiga di bawah (desktop).
// Tombol Teal, karena tombol oranye sudah dipakai di header.
export default function HomeServices() {
  const ask = whatsappLink("Hi Dragonet Divers, I'd like to ask about your dives and trips.");
  const [first, second, ...rest] = services;
  return (
    <section id="services" aria-labelledby="services-title" className="scroll-mt-24 bg-white">
      <div className="gutter mx-auto grid max-w-[1200px] gap-8 pt-16 md:pt-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="services-title" className="max-w-[24ch] text-[1.75rem] leading-[1.2] font-normal text-slate sm:text-[2.125rem]">
            Everything we offer in Raja Ampat, <span className="font-semibold text-abyss">in small groups with local guides.</span>
          </h2>
          {ask && (
            <a
              href={ask}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-teal px-6 font-bold text-white shadow-float transition-colors duration-200 ease-brand hover:bg-teal-dark"
            >
              <ChatIcon className="size-[18px]" />
              Ask on WhatsApp
            </a>
          )}
        </div>

        <ul className="grid gap-5 md:grid-cols-6">
          {[first, second].map((service) => (
            <li key={service.slug} className="grid md:col-span-3">
              <ServiceCard service={service} sizes="(min-width: 768px) 560px, 90vw" />
            </li>
          ))}
          {rest.map((service) => (
            <li key={service.slug} className="grid md:col-span-2">
              <ServiceCard service={service} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
