import { uiText } from "@/content/ui";
import { whatsappLink } from "@/lib/site";
import { servicePrices } from "@/server/packages";
import { shownServices } from "@/server/site-settings";
import ServiceCard from "./ServiceCard";
import { ChatIcon } from "./icons";

// Lebar kartu di grid 6 kolom (desktop) menurut jumlah layanan yang tampil: lima = "bento" dua kartu besar
// di atas dan tiga di bawah, tiga atau enam = sebaris tiga, selain itu dua per baris (satu = selebar grid).
function spanOf(index, count) {
  if (count === 1) return "md:col-span-6";
  if (count === 5) return index < 2 ? "md:col-span-3" : "md:col-span-2";
  return count % 3 === 0 ? "md:col-span-2" : "md:col-span-3";
}

// Grid layanan yang tampil (yang disimpan di /admin/paket tidak ikut). Tiap kartu menampilkan harga mulai
// dari paket aktif termurahnya (/admin/paket) sebagai ajakan melihat paket. Tombol Teal, karena tombol
// oranye sudah dipakai di header.
export default async function HomeServices({ lang }) {
  const t = uiText(lang);
  const [prices, services] = await Promise.all([servicePrices(), shownServices(lang)]);
  const ask = whatsappLink(t.whatsapp.services);
  return (
    <section id="services" aria-labelledby="services-title" className="scroll-mt-24 bg-white">
      <div className="gutter mx-auto grid max-w-[1200px] gap-8 pt-16 md:pt-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="services-title" className="max-w-[24ch] text-[1.75rem] leading-[1.2] font-normal text-slate sm:text-[2.125rem]">
            {t.services.titleLead} <span className="font-semibold text-abyss">{t.services.titleRest}</span>
          </h2>
          {ask && (
            <a
              href={ask}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-teal px-6 font-bold text-white shadow-float transition-colors duration-200 ease-brand hover:bg-teal-dark"
            >
              <ChatIcon className="size-[18px]" />
              {t.services.ask}
            </a>
          )}
        </div>

        <ul className="grid gap-5 md:grid-cols-6">
          {services.map((service, index) => {
            const span = spanOf(index, services.length);
            return (
              <li key={service.slug} className={`grid ${span}`}>
                <ServiceCard
                  service={service}
                  lang={lang}
                  from={prices[service.slug]}
                  sizes={span === "md:col-span-2" ? undefined : "(min-width: 768px) 560px, 90vw"}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
