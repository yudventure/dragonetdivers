import Image from "next/image";
import plate from "../../brand/logo/dragonet-divers-logo-plate.png";
import { site } from "@/lib/site";

// Satu-satunya area gelap: Abyss + pita garis mandarin (BRANDING.md §9.10).
// Logo versi plate karena pita tulisan di file asli transparan.
export default function SiteFooter() {
  return (
    <footer className="bg-abyss text-white">
      <div className="mandarin-stripe h-2" aria-hidden="true" />
      <div className="gutter mx-auto grid max-w-[1200px] gap-6 py-12 sm:grid-cols-[auto_1fr] sm:items-center">
        <Image src={plate} alt={site.name} width={72} height={72} className="size-[72px]" />
        <div className="grid gap-1">
          <p className="font-display text-xl font-semibold">{site.tagline}</p>
          <p className="text-sm text-on-dark-muted">Raja Ampat · Papua Barat Daya · Indonesia</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="gutter mx-auto max-w-[1200px] py-4 text-[13px] text-on-dark-muted">
          © {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  );
}
