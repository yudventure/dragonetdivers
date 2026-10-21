import { BOAT_ROUTE, CROP, PLACES, ferryEntry, percentIn, steps } from "@/lib/getting-here";
import { uiText } from "@/content/ui";
import { contact, mapsLink, site, whatsappLink } from "@/lib/site";
import { ArrowIcon, ChatIcon, MapPinIcon, Wave } from "./icons";

// Nama pulau tetap; "strait" diganti teks Selat Dampier dalam bahasa halaman.
const LABEL_ISLANDS = [
  ["Waigeo", [722, 447]],
  ["Gam", [418, 512]],
  ["strait", [575, 682]],
];

const points = (pts) => pts.map(([x, y]) => `${x},${y}`).join(" ");

// Seksi "How to get here" (pengganti seksi nama dan ajakan rencana): empat langkah bernomor dari
// Sorong ke base di Kurkapa, plus peta rute dari garis pantai peta bersama
// (public/media/getting-here-map.svg, dibuat scripts/getting-here-map.mjs). Isi di src/lib/getting-here.js,
// teks seksi dan label peta di src/content/ui.js (gettingHere).
export default function GettingHere({ lang }) {
  const all = uiText(lang);
  const t = all.gettingHere;
  const chat = whatsappLink(all.whatsapp.lastLeg);
  const [x, y, w, h] = CROP;
  const entry = ferryEntry();
  return (
    <section id="getting-here" aria-labelledby="getting-here-title" className="scroll-mt-24 bg-foam">
      <div className="gutter mx-auto grid max-w-[1200px] gap-12 py-16 md:py-24 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div className="grid content-start gap-3">
          <p className="eyebrow">{t.eyebrow}</p>
          <h2 id="getting-here-title" className="text-[1.75rem] leading-[1.15] text-abyss sm:text-[2.125rem]">
            {t.title}
          </h2>
          <Wave />
          <p className="max-w-[60ch] text-slate">{t.intro}</p>

          <ol className="mt-5 grid gap-6">
            {steps[lang].map((step, i) => (
              <li key={step.title} className="grid grid-cols-[auto_1fr] gap-4">
                <span className="grid size-9 place-items-center rounded-full bg-teal font-display text-base font-semibold text-white" aria-hidden="true">
                  {i + 1}
                </span>
                <div className="grid gap-1">
                  <h3 className="text-lg leading-snug text-abyss">{step.title}</h3>
                  <p className="text-[15px] text-slate">{step.text}</p>
                  {step.link && (
                    <a
                      href={step.link.href}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-teal underline-offset-4 hover:underline"
                    >
                      {step.link.label}
                      <ArrowIcon className="size-4" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-slate">{t.note}</p>
        </div>

        <div className="grid content-start gap-4 lg:pt-10">
          <div
            role="img"
            aria-label={t.mapLabel}
            className="relative overflow-hidden rounded-frame bg-[radial-gradient(120%_100%_at_50%_45%,var(--color-white)_0%,var(--color-lagoon-wash)_60%,var(--color-teal-wash)_100%)] shadow-float ring-1 ring-mist"
            style={{ aspectRatio: `${w} / ${h}` }}
          >
            {/* SVG statis: <img> biasa, tanpa optimasi next/image */}
            <img src="/media/getting-here-map.svg" alt="" width={w * 2} height={h * 2} loading="lazy" className="absolute inset-0 size-full" />
            <svg viewBox={`${x} ${y} ${w} ${h}`} className="absolute inset-0 size-full" aria-hidden="true">
              <polyline points={points([PLACES.waisai, entry])} fill="none" stroke="var(--color-abyss)" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              <polyline points={points(BOAT_ROUTE)} fill="none" stroke="var(--color-mandarin)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>

            {LABEL_ISLANDS.map(([name, at]) => (
              <span
                key={name}
                aria-hidden="true"
                style={percentIn(at)}
                className={`absolute -translate-1/2 font-display text-[11px] tracking-[0.08em] whitespace-nowrap italic sm:text-xs ${
                  name === "strait" ? "text-teal/70" : "font-semibold text-white"
                }`}
              >
                {name === "strait" ? t.strait : name}
              </span>
            ))}

            <span aria-hidden="true" style={percentIn(PLACES.waisai)} className="absolute -translate-x-1/2 -translate-y-1/2">
              <span className="block size-3 rounded-full bg-abyss ring-2 ring-white" />
              <span className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap text-abyss shadow-float sm:text-xs">
                {t.waisai}
              </span>
            </span>

            <span aria-hidden="true" style={percentIn(PLACES.base)} className="absolute -translate-x-1/2 -translate-y-1/2">
              <span className="block size-4 rounded-full bg-mandarin ring-[3px] ring-white" />
              <span className="absolute top-full left-1/2 mt-1.5 grid -translate-x-1/2 justify-items-center rounded-xl bg-white px-2.5 py-1 leading-tight whitespace-nowrap shadow-float">
                <span className="text-[11px] font-bold text-abyss sm:text-xs">{site.shortName}</span>
                <span className="text-[10px] text-slate sm:text-[11px]">{t.base}</span>
              </span>
            </span>

            <span aria-hidden="true" style={{ top: percentIn(entry).top }} className="absolute right-3 mt-2 grid justify-items-end text-right leading-tight">
              <span className="text-[11px] font-bold text-abyss sm:text-xs">{t.toSorong}</span>
              <span className="text-[10px] text-slate sm:text-[11px]">{t.ferry}</span>
            </span>

            <span aria-hidden="true" style={percentIn([548, 590])} className="absolute -translate-x-1/2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-ember sm:text-[11px]">
              {t.speedboat}
            </span>
          </div>

          <p className="-mt-2 text-right text-[11px] text-slate">
            {t.mapData}{" "}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" className="underline-offset-2 hover:text-teal hover:underline">
              {t.attribution}
            </a>
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-white p-5 ring-1 ring-mist">
            <address className="flex gap-3 text-sm text-slate not-italic">
              <MapPinIcon className="mt-0.5 size-5 shrink-0 text-teal" />
              <span>
                <span className="block font-bold text-abyss">{site.name}</span>
                {contact.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </address>
            <div className="flex flex-wrap gap-2">
              <a
                href={mapsLink()}
                target="_blank"
                rel="noopener"
                className="inline-flex h-10 items-center gap-2 rounded-full border-[1.5px] border-teal px-4 text-sm font-bold text-teal transition-colors duration-200 ease-brand hover:bg-teal-soft"
              >
                {t.openMaps}
                <ArrowIcon className="size-4" />
              </a>
              {chat && (
                <a
                  href={chat}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-teal px-4 text-sm font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark"
                >
                  <ChatIcon className="size-4" />
                  {t.lastLeg}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
