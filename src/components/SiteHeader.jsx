import Image from "next/image";
import Link from "next/link";
import logo from "../../brand/logo/dragonet-divers-logo.png";
import { site, whatsappLink } from "@/lib/site";
import { ChatIcon } from "./icons";

// Header putih 72 px dengan lockup horizontal (BRANDING.md §2.1, §9.1).
export default function SiteHeader() {
  const booking = whatsappLink("Hi Dragonet Divers, I'd like to ask about diving in Raja Ampat.");
  return (
    <header className="sticky top-0 z-20 border-b border-mist bg-white/95 backdrop-blur">
      <div className="gutter mx-auto flex h-16 max-w-[1200px] items-center gap-4 sm:h-[72px]">
        <Link href="/" className="flex items-center gap-3" aria-label={`${site.name}, home`}>
          <Image src={logo} alt="" width={44} height={44} priority className="size-11" />
          <span className="hidden leading-none whitespace-nowrap min-[360px]:grid">
            <span className="font-display text-lg font-semibold text-teal sm:text-xl">{site.shortName}</span>
            <span className="mt-1.5 text-[10px] font-bold tracking-[0.2em] text-slate">RAJA AMPAT</span>
          </span>
        </Link>
        <div className="ml-auto">
          {booking ? (
            <a href={booking} className="inline-flex h-10 items-center gap-2 rounded-full bg-mandarin px-4 text-sm font-bold whitespace-nowrap text-abyss sm:px-[18px] transition-colors duration-200 ease-brand hover:bg-mandarin-hover">
              <ChatIcon className="size-[18px]" />
              <span>Book a dive</span>
            </a>
          ) : (
            <span className="inline-flex h-[26px] items-center rounded-full bg-teal-soft px-3 text-[11px] font-bold uppercase tracking-[0.08em] text-teal">
              Coming soon
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
