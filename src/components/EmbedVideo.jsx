"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "@/lib/i18n";
import { isTikTokOrigin, isTikTokPlaying, readTikTokEvent, TIKTOK_STATE, tiktokReaction } from "@/lib/video-embed";
import { FacebookIcon, InstagramIcon, PlayIcon, TikTokIcon, YouTubeIcon } from "./icons";

const PLATFORM_ICONS = { youtube: YouTubeIcon, tiktok: TikTokIcon, instagram: InstagramIcon, facebook: FacebookIcon };
// TikTok yang belum berjalan selama ini setelah iframe-nya termuat dianggap ditolak peramban, lalu
// dimuat ulang dengan tombol putar.
const STALL_MS = 8000;
// Berapa kali TikTok yang dijeda peramban diputar lagi sebelum dibiarkan.
const MAX_RESUMES = 3;

// Video YouTube, TikTok, Instagram, atau Facebook di galeri. Supaya halaman tetap ringan, player pihak
// ketiga baru dimuat saat petaknya setidaknya separuh terlihat, lalu dilepas lagi begitu keluar layar
// (videonya berhenti dan memori dibebaskan). Yang bisa diputar otomatis (YouTube, TikTok, Facebook)
// jalan tanpa suara dan tanpa tombol, seperti latar bergerak; tombol platform di pojok membuka video
// aslinya dengan suara. Instagram, atau saat "kurangi animasi"/hemat data aktif, diputar saat diketuk.
// Ukuran player menutupi petak seperti object-cover (satuan cq dari petak).
// TikTok dikendalikan lewat postMessage (lihat tiktokReaction di src/lib/video-embed.js): dibisukan dan
// diputar begitu siap, diulang dari awal bila habis. Bila tetap tidak berjalan dalam STALL_MS, player
// dimuat ulang dengan tombol putar TikTok dan bisa disentuh, jadi petaknya tidak pernah diam mati.
export default function EmbedVideo({ video, title, t }) {
  const ref = useRef(null);
  const frame = useRef(null);
  const [inView, setInView] = useState(false);
  const [auto, setAuto] = useState(false);
  const [tapped, setTapped] = useState(false);
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = navigator.connection?.saveData === true;
    setAuto(video.autoplay && !reduce && !saveData);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.5) setInView(true);
        else if (!entry.isIntersecting) {
          setInView(false);
          setTapped(false);
        }
      },
      { threshold: [0, 0.5] },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [video.autoplay]);

  const live = (inView && auto) || tapped;
  const interactive = tapped || stalled || !video.autoplay;
  const src = (tapped || stalled) && video.embedControls ? video.embedControls : video.embed;
  const tiktok = video.platform === "tiktok";
  const Icon = PLATFORM_ICONS[video.platform];
  const ratio = video.vertical ? 9 / 16 : 16 / 9;

  useEffect(() => {
    const iframe = frame.current;
    if (!live || !tiktok || !iframe) return;
    const send = (commands) => commands.forEach((command) => iframe.contentWindow?.postMessage(command, "*"));
    let playing = false;
    let resumes = 0;
    let timer;
    const watch = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (playing) return;
        if (document.hidden) return watch(); // tab di belakang memang tidak memutar video
        setStalled(true);
      }, STALL_MS);
    };
    const onMessage = (e) => {
      if (!isTikTokOrigin(e.origin) || e.source !== iframe.contentWindow) return;
      const event = readTikTokEvent(e.data);
      if (!event) return;
      if (isTikTokPlaying(event)) playing = true;
      const paused = event.type === "onStateChange" && Number(event.value) === TIKTOK_STATE.paused;
      if (paused && !interactive && ++resumes > MAX_RESUMES) return;
      send(tiktokReaction(event, { interactive }));
    };
    // Cadangan bila onPlayerReady terlewat: perintah yang sama saat iframe termuat (diabaikan bila player belum siap).
    const onLoad = () => {
      send(tiktokReaction({ type: "onPlayerReady" }));
      if (!interactive) watch();
    };
    window.addEventListener("message", onMessage);
    iframe.addEventListener("load", onLoad);
    return () => {
      window.removeEventListener("message", onMessage);
      iframe.removeEventListener("load", onLoad);
      clearTimeout(timer);
    };
  }, [live, tiktok, interactive, src]);

  return (
    <div ref={ref} className="relative size-full overflow-hidden bg-abyss [container-type:size]">
      {video.thumbnail ? (
        // Gambar mini dari platform (YouTube), tanpa optimasi next/image.
        <img src={video.thumbnail} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      ) : (
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--color-lagoon)_0%,var(--color-teal)_45%,var(--color-abyss)_100%)]" />
      )}

      {live && (
        <iframe
          key={src}
          ref={frame}
          src={src}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className={`absolute top-1/2 left-1/2 -translate-1/2 border-0 ${interactive ? "" : "pointer-events-none"}`}
          style={{ width: `max(100%, calc(100cqh * ${ratio}))`, height: `max(100%, calc(100cqw / ${ratio}))` }}
        />
      )}

      {!live && (
        <button
          type="button"
          onClick={() => setTapped(true)}
          className="group absolute inset-0 grid place-items-center text-white"
          aria-label={format(t.play, { title })}
        >
          <span className="grid size-14 place-items-center rounded-full bg-abyss/60 ring-1 ring-white/40 transition-transform duration-200 ease-brand group-hover:scale-110">
            <PlayIcon className="ml-0.5 size-6" />
          </span>
          {!video.thumbnail && <span className="absolute inset-x-4 bottom-4 text-left text-sm font-semibold text-white/90">{title}</span>}
        </button>
      )}

      <a
        href={video.href}
        target="_blank"
        rel="noopener"
        className="absolute top-2.5 left-2.5 inline-flex h-8 items-center gap-1.5 rounded-full bg-abyss/70 px-3 text-xs font-bold text-white ring-1 ring-white/25 transition-colors duration-200 ease-brand hover:bg-white hover:text-abyss"
        aria-label={format(t.watchOn, { platform: video.label })}
      >
        {Icon && <Icon className="size-4" />}
        {video.label}
      </a>
    </div>
  );
}
