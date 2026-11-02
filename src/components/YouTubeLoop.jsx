"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "@/lib/i18n";
import { YOUTUBE_ORIGIN, youtubeCommand } from "@/lib/video-embed";

// Jeda setelah iframe termuat sebelum video dimunculkan: player butuh sebentar sebelum bingkai pertamanya tampil
// (angka yang sama dengan mambetron).
const READY_MS = 600;
// Player YouTube diperbesar ke atas dan bawah sejauh ini di luar petak, supaya judul dan bilah kendali YouTube
// (yang menempel di tepi player) tidak pernah terlihat.
const OVERSCAN_PX = 80;

/**
 * Video YouTube (biasa atau Shorts) di galeri, diputar sendiri tanpa suara dan berulang, tanpa tombol apa pun.
 * Meniru pemutar mambetron (yudventure/mambetronhomestay, website/components/VideoTentang.tsx) atas permintaan
 * pemilik 2 November 2026 ("coba liat repo mambetron dan tiru karena mambetron rapih sekali"):
 * - Parameter embed sama dengan mambetron (src/lib/video-embed.js): kendali bawaan YouTube, BUKAN controls=0
 *   yang memunculkan tombol bulat jeda di tengah video; pengulangan bawaan YouTube (loop=1&playlist).
 * - Sampul YouTube tampil dulu. Player dimuat saat petak seperempat terlihat, lalu dimunculkan pelan-pelan
 *   READY_MS setelah termuat. Setelah dimuat player tidak dilepas lagi: dijeda saat keluar layar dan diputar
 *   lagi saat terlihat, lewat postMessage seperti mambetron. Di ponsel juga diputar.
 * - Player tidak bisa disentuh dan lebih besar dari petak (OVERSCAN_PX), jadi kendali YouTube yang muncul saat
 *   kursor di atas player tidak pernah tampil. Seluruh petak adalah tautan ke kanal YouTube pemilik video
 *   (video.channel dari oEmbed, src/server/youtube-channel.js), atau ke halaman videonya bila belum diketahui.
 * - "Kurangi animasi" atau hemat data aktif: hanya sampul, tetap bisa diketuk.
 * Klip MP4 unggahan tim (bila ada) diputar ClipLoop.jsx sebagai gantinya.
 */
export default function YouTubeLoop({ video, title, t }) {
  const box = useRef(null);
  const frame = useRef(null);
  const [auto, setAuto] = useState(false);
  const [seen, setSeen] = useState(false);
  const [inView, setInView] = useState(false);
  const [ready, setReady] = useState(false);
  const [poster, setPoster] = useState(video.poster ?? video.thumbnail);
  const cover = useRef(null);
  const ratio = video.vertical ? 9 / 16 : 16 / 9;
  const href = video.channel ?? video.href;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = navigator.connection?.saveData === true;
    setAuto(!reduce && !saveData);
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setSeen(true);
      },
      { threshold: 0.25 },
    );
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);

  // Sampul yang tidak ada (YouTube mengirim gambar abu-abu 120 px, atau gagal) diganti gambar mini 4:3.
  // Juga diperiksa setelah hydrate, karena sampul yang selesai dimuat sebelum itu tidak memicu onLoad.
  const checkCover = (img) => {
    if (img?.complete && img.naturalWidth <= 120 && poster !== video.thumbnail) setPoster(video.thumbnail);
  };
  useEffect(() => checkCover(cover.current));

  // Putar yang terlihat, jeda yang keluar layar (mambetron: kirimPerintah play/pause).
  useEffect(() => {
    frame.current?.contentWindow?.postMessage(youtubeCommand(inView ? "playVideo" : "pauseVideo"), YOUTUBE_ORIGIN);
  }, [inView]);

  const live = auto && seen;
  // Ukuran video menutupi petak seperti object-cover (satuan cq dari petak); player lebih tinggi lagi.
  const width = `max(100cqw, calc(100cqh * ${ratio}))`;
  const height = `max(100cqh, calc(100cqw / ${ratio}))`;

  return (
    <div ref={box} className="relative size-full overflow-hidden bg-abyss [container-type:size]">
      {poster && (
        // Sampul dari YouTube, tanpa optimasi next/image. Kotak seukuran video memotong pita hitam
        // gambar mini 4:3, jadi yang tampil hanya gambar videonya.
        <img
          ref={cover}
          src={poster}
          alt=""
          loading="lazy"
          onLoad={(e) => checkCover(e.currentTarget)}
          onError={(e) => checkCover(e.currentTarget)}
          className="absolute top-1/2 left-1/2 max-w-none -translate-1/2 object-cover"
          style={{ width, height }}
        />
      )}

      {live && (
        <iframe
          ref={frame}
          src={video.embed}
          title={title}
          inert
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setTimeout(() => setReady(true), READY_MS)}
          className={`pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-1/2 border-0 transition-opacity duration-700 ease-brand ${ready ? "opacity-100" : "opacity-0"}`}
          style={{ width, height: `calc(${height} + ${OVERSCAN_PX * 2}px)` }}
        />
      )}

      <a
        href={href}
        target="_blank"
        rel="noopener"
        aria-label={`${title}. ${format(t.watchOn, { platform: video.label })}`}
        className="absolute inset-0 z-10 rounded-card focus-visible:-outline-offset-4 focus-visible:outline-white"
      />
    </div>
  );
}
