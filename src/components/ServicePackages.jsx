import { uiText } from "@/content/ui";
import { format } from "@/lib/i18n";
import { contact, whatsappLink } from "@/lib/site";
import ServiceBooking from "./booking/ServiceBooking";
import { ChatIcon, MailIcon, Wave } from "./icons";

// Paket sebuah layanan di halaman layanannya (isi dari /admin/paket, tabel packages). Harga ditulis dalam
// Rupiah dan tampil sesuai mata uang pilihan tamu (<Price>). Alur pesan mengikuti Zanclus (ServiceBooking):
// keranjang, kalender tempat per tanggal di samping daftar, dan jendela checkout di atas halaman.
// Tanpa paket aktif, seksi menampilkan ajakan bertanya lewat WhatsApp atau email.
export default function ServicePackages({ lang, service, packages, booking }) {
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
            <ServiceBooking
              lang={lang}
              service={{ slug: service.slug, title: service.title }}
              packages={packages}
              slots={booking.slots}
              range={booking.range}
              pool={booking.pool}
              payments={booking.payments}
              text={{ packages: t, cart: all.cart, slots: all.slots, checkout: all.checkout }}
              ask={ask}
              email={contact.email}
            />
            <p className="text-xs text-slate">{t.usdNote}</p>
          </>
        )}
      </div>
    </section>
  );
}
