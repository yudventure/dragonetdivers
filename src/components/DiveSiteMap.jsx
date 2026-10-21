"use client";

// Peta titik selam & snorkel Raja Ampat di beranda, di antara grid layanan dan blok kursus.
// Komponen peta dari skill peta Raja Ampat (sumber DAMPIER, sama dengan situs Zanclus), disaring
// hanya titik selam & snorkel (src/lib/dive-map.js). Tema warna Dragonet: .peta-dragonet di
// app/globals.css. Client component karena prop `tautan` berupa fungsi. Teks dalam bahasa halaman (lang);
// data peta membawa keterangan English dan Indonesia.
import PetaRajaAmpat from "./peta-raja-ampat/PetaRajaAmpat.jsx";
import GARIS from "./peta-raja-ampat/data/garis-pantai.json";
import TANDA from "./peta-raja-ampat/data/tanda.json";
import WILAYAH from "./peta-raja-ampat/data/wilayah.json";
import "./peta-raja-ampat/peta-raja-ampat.css";
import { uiText } from "@/content/ui";
import { SITE_LINK, areasWithSites, mapText, pickDiveSites } from "@/lib/dive-map";
import { format, localeHref } from "@/lib/i18n";
import { Wave } from "./icons";

const sites = pickDiveSites(TANDA);
const areas = areasWithSites(WILAYAH, sites, GARIS.bingkai);
export default function DiveSiteMap({ lang }) {
  const t = uiText(lang).map;
  const siteLink = () => localeHref(lang, SITE_LINK);
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

        <PetaRajaAmpat bahasa={lang} tanda={sites} wilayah={areas} judul={false} teks={mapText[lang]} tautan={siteLink} className="peta-dragonet" />
      </div>
    </section>
  );
}
