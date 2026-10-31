"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "@/lib/i18n";
import {
  isYouTubeOrigin,
  isYouTubePlaying,
  readYouTubeEvent,
  YOUTUBE_STATE,
  youtubeCommand,
  youtubeEmbedFor,
  youtubeInfo,
  youtubeListening,
  youtubeReaction,
} from "@/lib/video-embed";

// Berapa kali video yang dijeda peramban (bukan oleh kita) diputar lagi sebelum dibiarkan.
const MAX_RESUMES = 5;
// Player YouTube diperbesar ke atas dan bawah sejauh ini di luar petak, supaya judul, logo kanal, dan
// tombol bawaan YouTube (yang menempel di tepi player) tidak pernah terlihat.
const OVERSCAN_PX = 80;

/**
 * Video YouTube (biasa atau Shorts) di galeri, tampil seperti latar bergerak: tanpa tombol apa pun, tanpa
 * suara, berulang mulus. Permintaan pemilik Oktober 2026 ("tidak ada tombol play dan pause, smooth loop,
 * ketika diklik tetap menuju kanal YouTube-nya").
 * - Sampul (gambar YouTube) tampil dulu; player baru dimuat saat petak separuh terlihat dan baru
 *   dimunculkan pelan-pelan setelah videonya benar-benar berjalan, jadi layar hitam, tombol putar merah,
 *   dan judul YouTube tidak sempat terlihat.
 * - Player tidak bisa disentuh (pointer-events none) dan lebih besar dari petak (OVERSCAN_PX), jadi
 *   kendali YouTube tidak muncul. Seluruh petak adalah tautan ke kanal YouTube pemilik video
 *   (video.channel dari oEmbed, src/server/youtube-channel.js), atau ke halaman videonya bila belum diketahui.
 * - Berulang lewat postMessage (youtubeReaction di src/lib/video-embed.js): diputar ulang dari awal sedikit
 *   sebelum habis, tanpa layar akhir YouTube. Keluar layar: dijeda, masuk lagi: lanjut tanpa dimuat ulang.
 * - "Kurangi animasi" atau hemat data aktif: hanya sampul, tetap bisa diketuk.
 */
export default function YouTubeLoop({ video, title, t }) {
  const box = useRef(null);
  const frame = useRef(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [auto, setAuto] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [poster, setPoster] = useState(video.poster ?? video.thumbnail);
  const cover = useRef(null);
  const ratio = video.vertical ? 9 / 16 : 16 / 9;
  const href = video.channel ?? video.href;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = navigator.connection?.saveData === true;
    setAuto(!reduce && !saveData);
    setOrigin(window.location.origin);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.5) {
          setInView(true);
          setLoaded(true);
        } else if (!entry.isIntersecting) setInView(false);
      },
      { threshold: [0, 0.5] },
    );
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);

  const live = auto && loaded && origin;

  // Sampul yang tidak ada (YouTube mengirim gambar abu-abu 120 px, atau gagal) diganti gambar mini 4:3.
  // Juga diperiksa setelah hydrate, karena sampul yang selesai dimuat sebelum itu tidak memicu onLoad.
  const checkCover = (img) => {
    if (img?.complete && img.naturalWidth <= 120 && poster !== video.thumbnail) setPoster(video.thumbnail);
  };
  useEffect(() => checkCover(cover.current));

  // Percakapan dengan player: daftar sebagai pendengar, bisukan dan putar, ulang sebelum habis, putar lagi
  // bila dijeda peramban. Selama petak di luar layar video dijeda dan kabar "dijeda" tidak dibalas.
  const away = useRef(false);
  useEffect(() => {
    const iframe = frame.current;
    if (!live || !iframe) return;
    const send = (message) => iframe.contentWindow?.postMessage(message, "*");
    let heard = false;
    let duration = null;
    let previous = null;
    let resumes = 0;
    let hello;
    const listen = () => {
      clearInterval(hello);
      let tries = 0;
      send(youtubeListening());
      hello = setInterval(() => {
        if (heard || ++tries > 20) return clearInterval(hello);
        send(youtubeListening());
      }, 400);
    };
    const onMessage = (e) => {
      if (e.source !== iframe.contentWindow || !isYouTubeOrigin(e.origin)) return;
      const event = readYouTubeEvent(e.data);
      if (!event) return;
      heard = true;
      const info = youtubeInfo(event);
      if (info.duration) duration = info.duration;
      if (isYouTubePlaying(event)) setPlaying(true);
      let commands = youtubeReaction(event, { duration, previous });
      if (info.state === YOUTUBE_STATE.paused && commands.length) {
        if (away.current || document.hidden || ++resumes > MAX_RESUMES) commands = [];
      }
      if (info.state != null) previous = info.state;
      commands.forEach(send);
    };
    const onVisible = () => {
      if (!document.hidden && !away.current) send(youtubeCommand("playVideo"));
    };
    window.addEventListener("message", onMessage);
    iframe.addEventListener("load", listen);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(hello);
      window.removeEventListener("message", onMessage);
      iframe.removeEventListener("load", listen);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [live]);

  // Keluar layar: jeda (hemat baterai dan data). Masuk lagi: lanjut dari posisi terakhir.
  useEffect(() => {
    const iframe = frame.current;
    if (!live || !iframe) return;
    away.current = !inView;
    iframe.contentWindow?.postMessage(youtubeCommand(inView ? "playVideo" : "pauseVideo"), "*");
  }, [inView, live]);

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
          src={youtubeEmbedFor(video.embed, origin)}
          title={title}
          inert
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          className={`pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-1/2 border-0 transition-opacity duration-700 ease-brand ${playing ? "opacity-100" : "opacity-0"}`}
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
