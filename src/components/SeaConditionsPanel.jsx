"use client";

import { useEffect, useState } from "react";
// Latar laut dalam dengan manta yang berenang bolak-balik (Higgsfield: GPT Image 2.5 + Kling 3.0).
// Cara membuat: brand/ocean/README.md.
import oceanPoster from "../assets/ocean-manta-loop.webp";
import LoopVideo from "./LoopVideo";
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

function Tile({ icon: Icon, label, value, unit, detail, arrow }) {
  return (
    <div className="grid content-start gap-1">
      <dt className="flex items-center gap-2 text-[11px] font-bold tracking-[0.12em] text-white/75 uppercase">
        <Icon className="size-[18px] text-white" />
        {label}
      </dt>
      <dd className="font-display text-2xl leading-tight font-semibold text-white tabular-nums">
        {value ?? "–"}
        {value != null && unit && <span className="ml-1 text-base">{unit}</span>}
      </dd>
      <dd className="flex min-h-5 items-center gap-1.5 text-[13px] text-white/80">
        {arrow != null && <ArrowNorthIcon className="size-3.5 shrink-0 text-sunrise" style={{ transform: `rotate(${arrow}deg)` }} />}
        {detail}
      </dd>
    </div>
  );
}

const join = (...parts) => parts.filter(Boolean).join(", ") || null;
const plus180 = (deg) => (deg == null ? null : (deg + 180) % 360);

// Strip kondisi laut di bawah hero (BRANDING.md §9.2, §9.7): kotak gelap dengan video laut dalam
// (sinar matahari, partikel) dan manta yang dari kejauhan tampak sebagai siluet, mendekat sampai perut
// putihnya terlihat, lalu kembali ke tempat awal, di belakang teks putih; lapisan Abyss menjaga
// keterbacaan. object-[center_35%]: di panel desktop yang pendek, pita video yang terlihat sedikit di
// atas tengah, jalur yang dilewati manta.
// Data awal dari server (cache 15 menit), lalu diperbarui tiap 10 menit selama tab terbuka.
export default function SeaConditionsPanel({ initial }) {
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

  const w = data?.weather;
  const s = data?.sea;
  const WeatherIcon = w?.kind === "clear" ? (w.isDay ? SunIcon : MoonIcon) : (WEATHER_ICONS[w?.kind] ?? CloudIcon);
  const updated = data?.time?.split("T")[1]?.slice(0, 5);

  return (
    <section id="conditions" aria-labelledby="sea-title" className="scroll-mt-24 bg-white">
      <div className="gutter mx-auto max-w-[1200px] pt-10 md:pt-14">
        <div className="relative isolate overflow-hidden rounded-card bg-abyss p-6 sm:p-8 lg:py-10 [text-shadow:0_1px_2px_rgb(10_50_59/0.65),0_0_18px_rgb(10_50_59/0.6)]">
          <LoopVideo
            sources={[
              { src: "/media/ocean-manta-loop.webm", type: "video/webm" },
              { src: "/media/ocean-manta-loop.mp4", type: "video/mp4" },
            ]}
            poster={oceanPoster.src}
            className="absolute inset-0 -z-10 size-full object-cover object-[center_35%]"
          />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(10_50_59/0.6)_0%,rgb(10_50_59/0.5)_45%,rgb(10_50_59/0.7)_100%)]" />
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 id="sea-title" className="flex items-center gap-2.5 text-xl text-white">
              <span className="relative flex size-2.5" aria-hidden="true">
                <span className="absolute inline-flex size-full rounded-full bg-sunrise opacity-70 motion-safe:animate-ping" />
                <span className="relative inline-flex size-2.5 rounded-full bg-sunrise" />
              </span>
              <span>
                Live sea conditions
                <span className="hidden sm:inline"> · </span>
                <span className="block sm:inline">{data?.place ?? "Dampier Strait"}</span>
              </span>
            </h2>
            <p className="text-sm text-white/80" aria-live="polite">
              {updated ? `Updated ${updated} WIT` : failed ? "Live data unavailable right now" : "Loading live data…"}
            </p>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
            <Tile icon={WeatherIcon} label="Weather" value={w?.tempC} unit="°C" detail={w?.label} />
            <Tile
              icon={WindIcon}
              label="Wind"
              value={w?.windKmh}
              unit="km/h"
              detail={join(w?.windFrom && `from ${w.windFrom}`, w?.gustKmh != null && `gusts ${w.gustKmh}`)}
              arrow={plus180(w?.windFromDeg)}
            />
            <Tile
              icon={WavesIcon}
              label="Waves"
              value={s?.waveM}
              unit="m"
              detail={join(s?.seaState, s?.waveFrom && `from ${s.waveFrom}`)}
              arrow={plus180(s?.waveFromDeg)}
            />
            <Tile
              icon={ArrowNorthIcon}
              label="Current"
              value={s?.currentKn}
              unit="kn"
              detail={s?.currentTo && `flowing ${s.currentTo}`}
              arrow={s?.currentToDeg}
            />
            <Tile icon={ThermometerIcon} label="Water" value={s?.waterC} unit="°C" detail="Sea surface" />
            <Tile icon={SunsetIcon} label="Sunset" value={data?.sunset} detail="WIT · mandarin hour" />
          </dl>

          <p className="mt-6 text-xs text-white/75">
            Forecast model data from{" "}
            <a href="https://open-meteo.com/" className="font-semibold text-white underline underline-offset-2" rel="noopener" target="_blank">
              Open-Meteo
            </a>
            , refreshed every 15 minutes. Conditions at each dive site can differ.
          </p>
        </div>
      </div>
    </section>
  );
}
