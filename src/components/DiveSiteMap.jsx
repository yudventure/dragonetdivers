// Peta titik selam & snorkel Raja Ampat di beranda, di antara grid layanan dan blok kursus.
// Komponen peta dari skill peta Raja Ampat (sumber DAMPIER, sama dengan situs Zanclus), disaring
// hanya titik selam & snorkel (src/lib/dive-map.js). Tema warna Dragonet: .peta-dragonet di
// app/globals.css. Judul dan teks dirender di server dalam bahasa halaman (lang); peta interaktifnya
// client component (DiveSiteMapCanvas.jsx). Data peta membawa keterangan English, Indonesia, dan Mandarin
// (Korea memakai keterangan English).
import GARIS from "./peta-raja-ampat/data/garis-pantai.json";
import TANDA from "./peta-raja-ampat/data/tanda.json";
import WILAYAH from "./peta-raja-ampat/data/wilayah.json";
import { uiText } from "@/content/ui";
import { SITE_LINK, areasWithSites, mapText, pickDiveSites } from "@/lib/dive-map";
import { format, localeHref } from "@/lib/i18n";
import DiveSiteMapCanvas from "./DiveSiteMapCanvas";
import { Wave } from "./icons";

const sites = pickDiveSites(TANDA);
const areas = areasWithSites(WILAYAH, sites, GARIS.bingkai);
// Data peta bersama punya teks id, en, zh (dan ru); bahasa lain (Korea) memakai English untuk nama jenis
// dan keterangan tanda, sedangkan judul dan teks utama peta tetap dalam bahasa halaman (mapText).
const MAP_LANGS = ["id", "en", "zh"];

export default function DiveSiteMap({ lang }) {
  const t = uiText(lang).map;
  return (
    <section id="dive-sites" aria-labelledby="dive-sites-title" className="scroll-mt-24 bg-white">
      <div className="gutter mx-auto grid max-w-[1200px] gap-8 pt-16 md:pt-24">
        <div className="grid gap-5 md:grid-cols-[1.1fr_1fr] md:items-end md:gap-12">
          <div className="grid content-start gap-3">
            <p className="eyebrow">{t.eyebrow}</p>
            <h2 id="dive-sites-title" className="max-w-[22ch] text-[1.75rem] leading-[1.15] text-abyss sm:text-[2.125rem]">
              {t.title}
            </h2>
            <Wave />
          </div>
          <div className="grid max-w-[60ch] gap-2">
            <p className="text-slate">{format(t.intro, { n: sites.length })}</p>
            <p className="text-sm text-slate">{t.note}</p>
          </div>
        </div>

        <DiveSiteMapCanvas
          bahasa={MAP_LANGS.includes(lang) ? lang : "en"}
          sites={sites}
          areas={areas}
          teks={mapText[lang] ?? mapText.en}
          href={localeHref(lang, SITE_LINK)}
        />
      </div>
    </section>
  );
}
