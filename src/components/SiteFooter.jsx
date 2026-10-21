import Image from "next/image";
import Link from "next/link";
import plate from "../../brand/logo/dragonet-divers-logo-plate.png";
import { services } from "@/lib/services";
import { contact, mapsLink, site, socialLinks, whatsappLink } from "@/lib/site";
import { ChatIcon, FacebookIcon, InstagramIcon, LockIcon, MailIcon, MapPinIcon, TikTokIcon, YouTubeIcon } from "./icons";

const SOCIAL_ICONS = { instagram: InstagramIcon, tiktok: TikTokIcon, facebook: FacebookIcon, youtube: YouTubeIcon };

const PLAN_LINKS = [
  { href: "/#conditions", label: "Live sea conditions" },
  { href: "/#dive-sites", label: "Dive site map" },
  { href: "/#learn", label: "Learn to dive" },
  { href: "/#getting-here", label: "How to get here" },
  { href: "/#faq", label: "FAQ" },
];

function Column({ id, title, children }) {
  return (
    <div className="grid content-start gap-4">
      <h2 id={id} className="font-sans text-xs font-bold tracking-[0.14em] text-on-dark-muted uppercase">
        {title}
      </h2>
      {children}
    </div>
  );
}

const linkClass = "text-[15px] text-white/90 transition-colors duration-200 ease-brand hover:text-sunrise";

// Area gelap utama: Abyss + pita garis mandarin (BRANDING.md §9.10). Empat kolom: brand + ikon kontak
// dan media sosial, layanan, rencana perjalanan, kontak. Ikon media sosial muncul hanya bila akunnya
// diisi (NEXT_PUBLIC_INSTAGRAM dst., src/lib/site.js). Logo versi plate karena pita tulisan asli transparan.
// Bagian bawah dipisah dengan latar sedikit lebih terang, tanpa garis pemisah; kanan bawah tautan
// "Operator sign in" ke dashboard tim.
export default function SiteFooter() {
  const chat = whatsappLink("Hi Dragonet Divers, I'd like to ask about diving in Raja Ampat.");
  const icons = [
    { id: "email", label: `Email ${contact.email}`, href: `mailto:${contact.email}`, Icon: MailIcon },
    { id: "maps", label: "Find us on Google Maps", href: mapsLink(), Icon: MapPinIcon },
    ...(chat ? [{ id: "whatsapp", label: "WhatsApp", href: chat, Icon: ChatIcon }] : []),
    ...socialLinks().map((s) => ({ ...s, Icon: SOCIAL_ICONS[s.id] })),
  ];
  return (
    <footer className="bg-abyss text-white">
      <div className="mandarin-stripe h-2" aria-hidden="true" />
      <div className="gutter mx-auto grid max-w-[1200px] gap-x-10 gap-y-12 py-14 sm:grid-cols-2 md:py-16 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
        <div className="grid content-start gap-5">
          <Link href="/" className="flex w-fit items-center gap-3" aria-label={`${site.name}, home`}>
            <Image src={plate} alt="" width={56} height={56} className="size-14" />
            <span className="grid leading-none">
              <span className="font-display text-xl font-semibold">{site.shortName}</span>
              <span className="mt-1.5 text-[10px] font-bold tracking-[0.2em] text-on-dark-muted">RAJA AMPAT</span>
            </span>
          </Link>
          <div className="grid gap-2">
            <p className="font-display text-lg font-semibold text-sunrise">{site.tagline}</p>
            <p className="max-w-[38ch] text-sm text-on-dark-muted">{site.description}</p>
          </div>
          <ul className="flex flex-wrap gap-2" aria-label="Contact and social media">
            {icons.map(({ id, label, href, Icon }) => (
              <li key={id}>
                <a
                  href={href}
                  aria-label={label}
                  title={label}
                  {...(href.startsWith("http") ? { target: "_blank", rel: "noopener" } : {})}
                  className="grid size-9 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition-colors duration-200 ease-brand hover:bg-white hover:text-abyss"
                >
                  <Icon className="size-[18px]" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <Column id="footer-services" title="Services">
          <nav aria-labelledby="footer-services">
            <ul className="grid gap-2.5">
              {services.map((service) => (
                <li key={service.slug}>
                  <Link href={`/services/${service.slug}`} className={linkClass}>
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Column>

        <Column id="footer-plan" title="Plan your trip">
          <nav aria-labelledby="footer-plan">
            <ul className="grid gap-2.5">
              {PLAN_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Column>

        <Column title="Contact">
          <ul className="grid gap-4 text-[15px]">
            <li className="flex gap-3">
              <MapPinIcon className="mt-0.5 size-5 shrink-0 text-sunrise" />
              <address className="grid not-italic">
                {contact.address.map((line) => (
                  <span key={line} className="text-white/90">
                    {line}
                  </span>
                ))}
                <a href={mapsLink()} target="_blank" rel="noopener" className="mt-1 w-fit text-sm font-bold text-sunrise underline-offset-4 hover:underline">
                  Open in Google Maps
                </a>
              </address>
            </li>
            <li className="flex gap-3">
              <MailIcon className="mt-0.5 size-5 shrink-0 text-sunrise" />
              <a href={`mailto:${contact.email}`} className={linkClass}>
                {contact.email}
              </a>
            </li>
            {chat && (
              <li className="flex gap-3">
                <ChatIcon className="mt-0.5 size-5 shrink-0 text-sunrise" />
                <a href={chat} className={linkClass}>
                  Chat on WhatsApp
                </a>
              </li>
            )}
          </ul>
        </Column>
      </div>

      <div className="bg-white/5">
        <div className="gutter mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5 text-[13px] text-on-dark-muted">
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
          {/* Masuk ke dashboard tim (/admin) di tab baru, seperti di situs Zanclus. */}
          <a
            href="/admin"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 font-semibold text-white/90 transition-colors duration-200 ease-brand hover:text-sunrise"
          >
            <LockIcon className="size-4" />
            Operator sign in
          </a>
        </div>
      </div>
    </footer>
  );
}
