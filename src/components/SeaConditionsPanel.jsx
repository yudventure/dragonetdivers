"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
// Latar: penyelam bersiap turun ke air dari perahu kayu di Raja Ampat (permintaan pemilik, Oktober 2026).
// Ilustrasi AI buatan Higgsfield (GPT Image 2.5), bukan dokumentasi lokasi. Cara membuat: brand/boat/README.md.
import boatPhoto from "../assets/boat-divers.webp";
import { format, intlLocale } from "@/lib/i18n";
import { arahDari } from "@/lib/compass";
import {
  ArrowNorthIcon,
  CloudFogIcon,
  CloudIcon,
  CloudLightningIcon,
  CloudRainIcon,
  CloudSunIcon,
  MoonIcon,
  SunIcon,
  SunsetIcon,
  ThermometerIcon,
  WavesIcon,
  WindIcon,
} from "./icons";

const REFRESH_MS = 10 * 60 * 1000;
const WEATHER_ICONS = { partly: CloudSunIcon, cloud: CloudIcon, rain: CloudRainIcon, storm: CloudLightningIcon, fog: CloudFogIcon };

function Tile({ icon: Icon, label, value, unit, detail, arrow, compact }) {
  return (
    <div className="grid content-start gap-1">
      <dt className={`flex items-center gap-2 font-bold tracking-[0.12em] text-white/75 uppercase ${compact ? "text-[10px]" : "text-[11px]"}`}>
        <Icon className={`text-white ${compact ? "size-4" : "size-[18px]"}`} />
        {label}
      </dt>
      <dd className={`font-display leading-tight font-semibold text-white tabular-nums ${compact ? "text-xl" : "text-2xl"}`}>
        {value ?? "–"}
        {value != null && unit && <span className={`ml-1 ${compact ? "text-sm" : "text-base"}`}>{unit}</span>}
      </dd>
      <dd className={`flex items-center gap-1.5 text-white/80 ${compact ? "min-h-4 text-xs" : "min-h-5 text-[13px]"}`}>
        {arrow != null && <ArrowNorthIcon className="size-3.5 shrink-0 text-sunrise" style={{ transform: `rotate(${arrow}deg)` }} />}
        {detail}
      </dd>
    </div>
  );
}

// Pemisah keterangan: koma Tionghoa untuk Mandarin, koma biasa untuk bahasa lain.
const join = (lang, ...parts) => parts.filter(Boolean).join(lang === "zh" ? "，" : ", ") || null;
const plus180 = (deg) => (deg == null ? null : (deg + 180) % 360);

/** Data kondisi laut: awal dari server (cache 15 menit), lalu diperbarui tiap 10 menit selama tab terbuka. */
function useSeaConditions(initial) {
  const [data, setData] = useState(initial);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let last = Date.now();
    const refresh = async () => {
      last = Date.now();
      try {
        const response = await fetch("/api/conditions");
        const body = await response.json();
        if (body.conditions) setData(body.conditions);
        setFailed(!body.conditions);
      } catch {
        setFailed(true);
      }
    };
    if (!initial) refresh();
    const timer = setInterval(() => document.visibilityState === "visible" && refresh(), REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && Date.now() - last > REFRESH_MS && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [initial]);

  return { data, failed };
}

/** Keterangan waktu data ("Updated 14:05") atau pesan saat data belum atau tidak tersedia. */
function statusText(data, failed, lang, t) {
  const clock = data?.time?.split("T")[1]?.slice(0, 5);
  const updated = clock && (lang === "id" ? clock.replace(":", ".") : clock);
  return updated ? format(t.updated, { time: updated }) : failed ? t.failed : t.loading;
}

/** Enam ukuran kondisi laut: cuaca, angin, gelombang, arus, suhu air, matahari terbenam. */
function Tiles({ data, lang, t, words, compact = false }) {
  const w = data?.weather;
  const s = data?.sea;
  const WeatherIcon = w?.kind === "clear" ? (w.isDay ? SunIcon : MoonIcon) : (WEATHER_ICONS[w?.kind] ?? CloudIcon);
  const sunset = data?.sunset && (lang === "id" ? data.sunset.replace(":", ".") : data.sunset);
  const label = (value) => (value ? (words?.labels?.[value] ?? value) : value);
  const n = (value) => (typeof value === "number" ? value.toLocaleString(intlLocale[lang]) : value);
  const dir = (short, degrees) => (words ? arahDari(degrees, words.compass) : short);
  return (
    <>
      <Tile compact={compact} icon={WeatherIcon} label={t.weather} value={n(w?.tempC)} unit="°C" detail={label(w?.label)} />
      <Tile
        compact={compact}
        icon={WindIcon}
        label={t.wind}
        value={n(w?.windKmh)}
        unit={t.kmh}
        detail={join(lang, w?.windFrom && format(t.from, { dir: dir(w.windFrom, w.windFromDeg) }), w?.gustKmh != null && format(t.gusts, { n: n(w.gustKmh) }))}
        arrow={plus180(w?.windFromDeg)}
      />
      <Tile
        compact={compact}
        icon={WavesIcon}
        label={t.waves}
        value={n(s?.waveM)}
        unit="m"
        detail={join(lang, label(s?.seaState), s?.waveFrom && format(t.from, { dir: dir(s.waveFrom, s.waveFromDeg) }))}
        arrow={plus180(s?.waveFromDeg)}
      />
      <Tile
        compact={compact}
        icon={ArrowNorthIcon}
        label={t.current}
        value={n(s?.currentKn)}
        unit={t.knots}
        detail={s?.currentTo && format(t.flowing, { dir: dir(s.currentTo, s.currentToDeg) })}
        arrow={s?.currentToDeg}
      />
      <Tile compact={compact} icon={ThermometerIcon} label={t.water} value={n(s?.waterC)} unit="°C" detail={t.seaSurface} />
      <Tile compact={compact} icon={SunsetIcon} label={t.sunset} value={sunset} detail={t.sunsetDetail} />
    </>
  );
}

function LiveDot() {
  return (
    <span className="relative flex size-2.5 shrink-0" aria-hidden="true">
      <span className="absolute inline-flex size-full rounded-full bg-sunrise opacity-70 motion-safe:animate-ping" />
      <span className="relative inline-flex size-2.5 rounded-full bg-sunrise" />
    </span>
  );
}

function SourceNote({ t, className }) {
  return (
    <p className={`text-white/75 ${className}`}>
      {t.sourceBefore}{" "}
      <a href="https://open-meteo.com/" className="font-semibold text-white underline underline-offset-2" rel="noopener" target="_blank">
        Open-Meteo
      </a>
      {t.sourceAfter}
    </p>
  );
}

// Strip kondisi laut di halaman layanan (BRANDING.md §9.7): kotak gelap dengan foto penyelam yang
// bersiap turun dari perahu di belakang teks putih; lapisan Abyss menjaga keterbacaan.
// Label dan satuan dari src/content/ui.js (t); label cuaca, gelombang, dan arah delapan penjuru untuk bahasa
// selain English dari seaWords() di src/lib/sea-conditions.js (words, dikirim server).
export default function SeaConditionsPanel({ initial, lang, t, words }) {
  const { data, failed } = useSeaConditions(initial);

  return (
    <section id="conditions" aria-labelledby="sea-title" className="scroll-mt-24 bg-white">
      <div className="gutter mx-auto max-w-[1200px] pt-10 md:pt-14">
        <div className="relative isolate overflow-hidden rounded-card bg-abyss p-6 sm:p-8 lg:py-10 [text-shadow:0_1px_2px_rgb(10_50_59/0.65),0_0_18px_rgb(10_50_59/0.6)]">
          {/* Di layar lebar terlihat penyelam di tepi perahu dan pulau karst; di ponsel potongan foto digeser ke penyelam. */}
          <Image
            src={boatPhoto}
            alt=""
            fill
            sizes="(min-width: 1232px) 1200px, 100vw"
            placeholder="blur"
            className="-z-10 object-cover object-[32%_center] sm:object-[center_40%]"
          />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(10_50_59/0.62)_0%,rgb(10_50_59/0.5)_45%,rgb(10_50_59/0.72)_100%)]" />
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 id="sea-title" className="flex items-center gap-2.5 text-xl text-white">
              <LiveDot />
              <span>
                {t.title}
                <span className="hidden sm:inline"> · </span>
                <span className="block sm:inline">{t.place}</span>
              </span>
            </h2>
            <p className="text-sm text-white/80" aria-live="polite">
              {statusText(data, failed, lang, t)}
            </p>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            <Tiles data={data} lang={lang} t={t} words={words} />
          </dl>

          <SourceNote t={t} className="mt-6 text-xs" />
        </div>
      </div>
    </section>
  );
}

/**
 * Kondisi laut live di hero beranda (permintaan pemilik, Oktober 2026: menggantikan daftar layanan di kanan
 * hero). Desktop: kartu transparan (lapisan Abyss tipis, garis putih, bayangan teks) di atas video manta,
 * tanpa foto. Ponsel dan tablet: kartu Abyss di bawah video, karena latar di sana putih. Enam ukuran dalam
 * dua kolom (tiga di tablet). id "conditions" untuk tautan footer.
 */
export function HeroConditions({ initial, lang, t, words, className = "" }) {
  const { data, failed } = useSeaConditions(initial);

  return (
    <section
      id="conditions"
      aria-labelledby="hero-sea-title"
      className={`grid scroll-mt-24 gap-4 rounded-card bg-abyss p-4 text-white sm:p-5 lg:border lg:border-white/25 lg:bg-abyss/15 lg:backdrop-blur-[2px] lg:[text-shadow:0_1px_2px_rgb(10_50_59/0.7),0_0_14px_rgb(10_50_59/0.55)] ${className}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="hero-sea-title" className="flex items-center gap-2.5 text-lg leading-tight text-white">
          <LiveDot />
          <span>
            {t.title}
            <span className="block text-sm font-semibold text-white/85">{t.place}</span>
          </span>
        </h2>
        <p className="text-xs text-white/80" aria-live="polite">
          {statusText(data, failed, lang, t)}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-2">
        <Tiles data={data} lang={lang} t={t} words={words} compact />
      </dl>
      <SourceNote t={t} className="text-[11px] leading-snug" />
    </section>
  );
}
