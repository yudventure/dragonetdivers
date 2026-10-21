import { faqs } from "@/content/faq";
import { uiText } from "@/content/ui";
import { formatMoney, formatRateDate } from "@/lib/currency";
import { format } from "@/lib/i18n";
import { contact, whatsappLink } from "@/lib/site";
import { getUsdIdrRate } from "@/server/exchange-rate";
import { ArrowIcon, ChevronIcon, Wave } from "./icons";

/** "Kurs: US$1 sekitar Rp 16.312 (kurs referensi Bank Sentral Eropa, 20 Okt 2026)." atau null. */
function rateLine(rate, t, lang) {
  if (!rate) return null;
  const date = formatRateDate(rate.date, lang);
  const source = rate.source === "ecb" && date ? format(t.rateEcb, { date }) : t.rateManual;
  return format(t.rate, { idr: formatMoney(rate.idrPerUsd, "IDR", lang), source });
}

// FAQ di bawah "How to get here": daftar lipat <details> (tanpa JavaScript, bisa dibuka dengan papan
// ketik), plus data terstruktur FAQPage untuk mesin pencari. Isi di src/content/faq.js; pertanyaan
// terakhir tentang cara memesan memakai kontak dari src/lib/site.js. Jawaban bertanda `rate` diberi
// kurs US$ ke Rupiah hari ini (src/server/exchange-rate.js), di luar data terstruktur.
export default async function Faq({ lang }) {
  const all = uiText(lang);
  const t = all.faq;
  const chat = whatsappLink(all.whatsapp.question);
  const rate = rateLine(await getUsdIdrRate(), t, lang);
  const items = [
    ...faqs[lang],
    {
      q: t.bookQ,
      a: format(t.bookA, { how: chat ? t.bookWhatsapp : "", email: contact.email }),
      link: chat ? { href: chat, label: t.chat } : { href: `mailto:${contact.email}`, label: t.email },
    },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang,
    mainEntity: items.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };

  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24 bg-white">
      <div className="gutter mx-auto grid max-w-[1200px] gap-10 py-16 md:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="grid content-start gap-3 lg:sticky lg:top-28">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 id="faq-title" className="text-[1.75rem] leading-[1.15] text-abyss sm:text-[2.125rem]">
            {t.title}
          </h2>
          <Wave />
          <p className="max-w-[44ch] text-slate">
            {t.still}{" "}
            <a href={`mailto:${contact.email}`} className="font-semibold text-teal underline-offset-4 hover:underline">
              {contact.email}
            </a>
            .
          </p>
        </div>

        <div className="grid gap-3">
          {items.map(({ q, a, link, rate: withRate }) => (
            <details key={q} className="group rounded-card bg-foam ring-1 ring-mist open:bg-white open:shadow-float">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-card px-5 py-4 font-display text-lg leading-snug font-semibold text-abyss [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronIcon className="size-5 shrink-0 text-teal transition-transform duration-200 ease-brand group-open:rotate-90" />
              </summary>
              <div className="grid gap-2 px-5 pb-5 text-[15px] text-slate">
                <p>{a}</p>
                {withRate && rate && <p className="w-fit rounded-input bg-foam px-3 py-2 text-sm font-semibold text-abyss tabular-nums">{rate}</p>}
                {link && (
                  <a
                    href={link.href}
                    {...(link.href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}
                    className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-teal underline-offset-4 hover:underline"
                  >
                    {link.label}
                    <ArrowIcon className="size-4" />
                  </a>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </section>
  );
}
