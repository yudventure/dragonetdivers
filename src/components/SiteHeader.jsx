import Image from "next/image";
import Link from "next/link";
import logo from "../../brand/logo/dragonet-divers-logo.png";
import logoPlate from "../../brand/logo/dragonet-divers-logo-plate.png";
import { uiText } from "@/content/ui";
import { format, localeHref, localeNames, locales } from "@/lib/i18n";
import { site, whatsappLink } from "@/lib/site";
import { shownServices } from "@/server/site-settings";
import HeaderShell from "./HeaderShell";
import SiteNav from "./SiteNav";

// Header 72 px dengan lockup horizontal dan menu (BRANDING.md §2.1, §9.1). Latarnya diatur HeaderShell:
// transparan di paling atas, putih transparan saat di-scroll. path = alamat halaman ini tanpa awalan
// bahasa ("/" atau "/services/fun-dives"), untuk tombol EN / ID dan menu aktif. overlay = header di atas
// video gelap hero beranda: logo versi plate dan nama putih selama belum di-scroll (BRANDING.md §2).
// Menu Layanan hanya berisi layanan yang tampil (yang disimpan di /admin/paket tidak ikut).
export default async function SiteHeader({ lang, path = "/", overlay = false }) {
  const t = uiText(lang);
  const nav = t.nav;
  const booking = whatsappLink(t.whatsapp.general);
  const home = localeHref(lang, "/");
  const homeLabel = format(nav.home, { name: site.name });
  const services = (await shownServices(lang)).map(({ slug, title, summary }) => {
    const servicePath = `/services/${slug}`;
    return { slug, title, summary, href: localeHref(lang, servicePath), current: path === servicePath };
  });
  const links = [
    { href: localeHref(lang, "/#dive-sites"), label: nav.diveSites },
    { href: localeHref(lang, "/#gallery"), label: nav.gallery },
    { href: localeHref(lang, "/#getting-here"), label: nav.gettingHere },
    { href: localeHref(lang, "/#faq"), label: nav.faq },
  ];
  const languages = locales.map((code) => ({ lang: code, short: code.toUpperCase(), name: localeNames[code], href: localeHref(code, path) }));

  return (
    <HeaderShell overlay={overlay}>
      {/* Selebar hero beranda: 85% layar, minimal 1200 px. */}
      <div className="gutter mx-auto flex h-16 max-w-[max(1200px,85%)] items-center gap-4 sm:h-[72px] xl:gap-6">
        <Link href={home} className="flex shrink-0 items-center gap-3" aria-label={homeLabel}>
          <Image src={logo} alt="" width={44} height={44} priority className="size-11 group-data-[tone=dark]/header:hidden" />
          {overlay && <Image src={logoPlate} alt="" width={44} height={44} priority className="hidden size-11 group-data-[tone=dark]/header:block" />}
          {/* Nama disembunyikan di 1024–1279 px agar menu desktop muat di satu baris. */}
          <span className="hidden leading-none whitespace-nowrap min-[360px]:grid lg:hidden xl:grid">
            <span className="font-display text-lg font-semibold text-teal transition-colors duration-300 ease-brand sm:text-xl group-data-[tone=dark]/header:text-white">
              {site.shortName}
            </span>
            <span className="mt-1.5 text-[10px] font-bold tracking-[0.2em] text-slate transition-colors duration-300 ease-brand group-data-[tone=dark]/header:text-white/80">
              RAJA AMPAT
            </span>
          </span>
        </Link>
        <SiteNav
          lang={lang}
          t={nav}
          brand={site.shortName}
          home={home}
          homeLabel={homeLabel}
          services={services}
          allServicesHref={localeHref(lang, "/#services")}
          links={links}
          languages={languages}
          booking={booking}
          servicesActive={path.startsWith("/services/")}
        />
      </div>
    </HeaderShell>
  );
}
