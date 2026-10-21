import Link from "next/link";
import { uiText } from "@/content/ui";
import { format, localeHref } from "@/lib/i18n";
import { contact, whatsappLink } from "@/lib/site";
import { Price, RupiahNote } from "./currency";
import { ArrowIcon, ChatIcon, CheckIcon, MailIcon, Wave } from "./icons";

// Paket sebuah layanan di halaman layanannya (isi dari /admin/paket, tabel packages). Harga ditulis
// dalam Rupiah dan tampil sesuai mata uang pilihan tamu (<Price>); "Pesan sekarang" membuka checkout.
// Tanpa paket aktif, seksi menampilkan ajakan bertanya lewat WhatsApp atau email.
export default function ServicePackages({ lang, service, packages }) {
  const all = uiText(lang);
  const t = all.packages;
  const ask = whatsappLink(format(all.whatsapp.about, { topic: service.ask }));

  return (
    <section id="packages" aria-labelledby="packages-title" className="scroll-mt-24 bg-white">
      <div className="gutter mx-auto grid max-w-[1200px] gap-8 pt-12 pb-4 md:pt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="grid content-start gap-3">
            <p className="eyebrow">{t.eyebrow}</p>
            <h2 id="packages-title" className="text-[1.75rem] leading-[1.15] text-abyss sm:text-[2.125rem]">
              {t.title}
            </h2>
            <Wave />
          </div>
          {packages.length > 0 && <p className="max-w-[46ch] text-sm text-slate">{t.intro}</p>}
        </div>

        {packages.length === 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-foam p-6 ring-1 ring-mist">
            <p className="max-w-[56ch] text-slate">{t.empty}</p>
            <a
              href={ask ?? `mailto:${contact.email}`}
              className="inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-teal px-5 text-sm font-bold text-teal transition-colors duration-200 ease-brand hover:bg-teal-soft"
            >
              {ask ? <ChatIcon className="size-[18px]" /> : <MailIcon className="size-[18px]" />}
              {ask ? all.footer.chat : contact.email}
            </a>
          </div>
        ) : (
          <>
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <li key={pkg.id} className="grid">
                  <article className="flex flex-col gap-4 rounded-card border border-mist bg-white p-6 transition-shadow duration-200 ease-brand hover:shadow-float">
                    <div className="grid gap-1.5">
                      <h3 className="text-xl leading-tight text-abyss">{pkg.name}</h3>
                      {pkg.summary && <p className="text-[15px] text-slate">{pkg.summary}</p>}
                    </div>
                    {pkg.includes.length > 0 && (
                      <ul className="grid gap-2">
                        {pkg.includes.map((item) => (
                          <li key={item} className="grid grid-cols-[20px_1fr] items-start gap-2.5 text-sm text-slate">
                            <CheckIcon className="mt-0.5 size-4 text-teal" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-auto grid gap-4 border-t border-mist pt-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <div className="grid">
                          <p className="flex items-baseline gap-1.5">
                            <Price idr={pkg.price} className="font-display text-2xl font-semibold text-abyss tabular-nums" />
                            <span className="text-sm text-slate">{pkg.unit === "group" ? t.perGroup : t.perPerson}</span>
                          </p>
                          <RupiahNote idr={pkg.price} className="text-xs text-slate tabular-nums" />
                        </div>
                        <p className="text-xs font-semibold text-slate">
                          {pkg.minGuests > 1
                            ? format(t.guestsRange, { min: pkg.minGuests, max: pkg.maxGuests })
                            : format(t.guestsUpTo, { max: pkg.maxGuests })}
                        </p>
                      </div>
                      <Link
                        href={localeHref(lang, `/checkout/${pkg.id}`)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-teal px-5 font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark"
                      >
                        {t.book}
                        <ArrowIcon className="size-[18px]" />
                      </Link>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate">{t.usdNote}</p>
          </>
        )}
      </div>
    </section>
  );
}
