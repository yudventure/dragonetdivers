import { BOAT_ROUTE, CROP, PLACES, ferryEntry, percentIn, steps } from "@/lib/getting-here";
import { contact, mapsLink, site, whatsappLink } from "@/lib/site";
import { ArrowIcon, ChatIcon, MapPinIcon, Wave } from "./icons";

const LABEL_ISLANDS = [
  ["Waigeo", [722, 447]],
  ["Gam", [418, 512]],
  ["Dampier Strait", [575, 682]],
];

const points = (pts) => pts.map(([x, y]) => `${x},${y}`).join(" ");

// Seksi "How to get here" (pengganti seksi nama dan ajakan rencana): empat langkah bernomor dari
// Sorong ke base di Kurkapa, plus peta rute dari garis pantai peta bersama
// (public/media/getting-here-map.svg, dibuat scripts/getting-here-map.mjs). Isi di src/lib/getting-here.js.
export default function GettingHere() {
  const chat = whatsappLink("Hi Dragonet Divers, I'd like help planning the boat from Waisai to Kurkapa.");
  const [x, y, w, h] = CROP;
  const entry = ferryEntry();
  return (
    <section id="getting-here" aria-labelledby="getting-here-title" className="scroll-mt-24 bg-foam">
      <div className="gutter mx-auto grid max-w-[1200px] gap-12 py-16 md:py-24 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div className="grid content-start gap-3">
          <p className="eyebrow">Getting here</p>
          <h2 id="getting-here-title" className="text-[1.75rem] leading-[1.15] text-abyss sm:text-[2.125rem]">
            How to get to Dragonet Divers
          </h2>
          <Wave />
          <p className="max-w-[60ch] text-slate">
            Our base is in Kurkapa on Mansuar island, in the heart of the Dampier Strait. Most guests reach Raja Ampat through Sorong and
            continue by sea.
          </p>

          <ol className="mt-5 grid gap-6">
            {steps.map((step, i) => (
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
          <p className="mt-3 text-sm text-slate">Flight and ferry times change often, so check them close to your travel date.</p>
        </div>

        <div className="grid content-start gap-4 lg:pt-10">
          <div
            role="img"
            aria-label="Route map. The fast ferry from Sorong arrives at Waisai harbour on Waigeo, then a speedboat crosses the Dampier Strait to Dragonet Divers in Kurkapa on the north coast of Mansuar."
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
                  name === "Dampier Strait" ? "text-teal/70" : "font-semibold text-white"
                }`}
              >
                {name}
              </span>
            ))}

            <span aria-hidden="true" style={percentIn(PLACES.waisai)} className="absolute -translate-x-1/2 -translate-y-1/2">
              <span className="block size-3 rounded-full bg-abyss ring-2 ring-white" />
              <span className="absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap text-abyss shadow-float sm:text-xs">
                Waisai harbour
              </span>
            </span>

            <span aria-hidden="true" style={percentIn(PLACES.base)} className="absolute -translate-x-1/2 -translate-y-1/2">
              <span className="block size-4 rounded-full bg-mandarin ring-[3px] ring-white" />
              <span className="absolute top-full left-1/2 mt-1.5 grid -translate-x-1/2 justify-items-center rounded-xl bg-white px-2.5 py-1 leading-tight whitespace-nowrap shadow-float">
                <span className="text-[11px] font-bold text-abyss sm:text-xs">{site.shortName}</span>
                <span className="text-[10px] text-slate sm:text-[11px]">Kurkapa, Mansuar</span>
              </span>
            </span>

            <span aria-hidden="true" style={{ top: percentIn(entry).top }} className="absolute right-3 mt-2 grid justify-items-end text-right leading-tight">
              <span className="text-[11px] font-bold text-abyss sm:text-xs">To Sorong</span>
              <span className="text-[10px] text-slate sm:text-[11px]">fast ferry, about 2 h</span>
            </span>

            <span aria-hidden="true" style={percentIn([548, 590])} className="absolute -translate-x-1/2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-ember sm:text-[11px]">
              speedboat, about 1 h
            </span>
          </div>

          <p className="-mt-2 text-right text-[11px] text-slate">
            Map data{" "}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener" className="underline-offset-2 hover:text-teal hover:underline">
              © OpenStreetMap contributors, GSHHG
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
                Open in Google Maps
                <ArrowIcon className="size-4" />
              </a>
              {chat && (
                <a
                  href={chat}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-teal px-4 text-sm font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark"
                >
                  <ChatIcon className="size-4" />
                  Plan the last leg
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
