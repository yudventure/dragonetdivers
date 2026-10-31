"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "@/lib/i18n";
import {
  isYouTubeOrigin,
  readYouTubeEvent,
  YOUTUBE_STATE,
  youtubeCommand,
  youtubeEmbedFor,
  youtubeInfo,
  youtubeListening,
  youtubeLoopDue,
  youtubeReaction,
} from "@/lib/video-embed";

// Berapa kali video yang dijeda peramban (bukan oleh kita) diputar lagi sebelum dibiarkan.
const MAX_RESUMES = 5;
// Salam "listening" ke player diulang tiap 400 ms sampai dijawab. Player yang tidak pernah menjawab tidak
// dimunculkan (sampul saja), karena tanpa kendali dari halaman videonya tidak bisa diulang tanpa tombol.
const HELLO_TRIES = 20;
// Video baru dimunculkan setelah berjalan sekian lama setiap kali mulai atau lanjut, karena di sebagian
// perangkat (layar sentuh) YouTube sempat menampilkan tombol jeda di tengah video saat mulai berputar.
const REVEAL_MS = 2500;
// Player YouTube diperbesar ke atas dan bawah sejauh ini di luar petak, supaya judul, logo kanal, dan
// tombol bawaan YouTube (yang menempel di tepi player) tidak pernah terlihat.
const OVERSCAN_PX = 80;

/**
 * Video YouTube (biasa atau Shorts) di galeri, tampil seperti latar bergerak: tanpa tombol apa pun, tanpa
 * suara, berulang mulus. Permintaan pemilik Oktober 2026 ("tidak ada tombol play dan pause, smooth loop,
 * ketika diklik tetap menuju kanal YouTube-nya").
 * - Sampul (gambar YouTube) tampil dulu; player baru dimuat saat petak separuh terlihat dan baru
 *   dimunculkan pelan-pelan setelah videonya berjalan REVEAL_MS, jadi layar hitam, tombol putar merah,
 *   tombol jeda, dan judul YouTube tidak sempat terlihat.
 * - Bukan daftar putar (tanpa loop=1&playlist): daftar putar memunculkan tombol sebelumnya, jeda, dan
 *   berikutnya di tengah video (laporan pemilik 1 November 2026, "jangan tampilkan jeda next previous").
 * - Player tidak bisa disentuh (pointer-events none) dan lebih besar dari petak (OVERSCAN_PX), jadi
 *   kendali YouTube tidak muncul. Seluruh petak adalah tautan ke kanal YouTube pemilik video
 *   (video.channel dari oEmbed, src/server/youtube-channel.js), atau ke halaman videonya bila belum diketahui.
 * - Berulang lewat postMessage (youtubeReaction dan youtubeLoopDue di src/lib/video-embed.js): diputar ulang
 *   dari awal sedikit sebelum habis menurut jam sendiri, tanpa layar akhir YouTube. Selama dijeda yang tampil
 *   sampulnya. Keluar layar: dijeda, mulai terlihat lagi: lanjut tanpa dimuat ulang.
 * - "Kurangi animasi" atau hemat data aktif: hanya sampul, tetap bisa diketuk.
 */
export default function YouTubeLoop({ video, title, t }) {
  const box = useRef(null);
  const frame = useRef(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [auto, setAuto] = useState(false);
  const [shown, setShown] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [poster, setPoster] = useState(video.poster ?? video.thumbnail);
  const cover = useRef(null);
  const away = useRef(false);
  const ratio = video.vertical ? 9 / 16 : 16 / 9;
  const href = video.channel ?? video.href;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = navigator.connection?.saveData === true;
    setAuto(!reduce && !saveData);
    setOrigin(window.location.origin);
    // Dimuat pertama kali saat separuh petak terlihat; sesudah itu diputar selama ada bagian yang terlihat.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.5) setLoaded(true);
        setInView(entry.isIntersecting);
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

  // Percakapan dengan player: daftar sebagai pendengar, bisukan dan putar, ulang dari awal sebelum habis
  // (menurut jam sendiri, karena YouTube tidak selalu sering mengabarkan waktunya), putar lagi bila dijeda
  // peramban. Video hanya tampil selama berjalan (setelah REVEAL_MS): saat dijeda, habis, atau di luar layar
  // sampul yang tampil, jadi panel "Video lainnya" dan tombol YouTube tidak pernah terlihat.
  useEffect(() => {
    const iframe = frame.current;
    if (!live || !iframe) return;
    const send = (message) => iframe.contentWindow?.postMessage(message, "*");
    let heard = false;
    let duration = null;
    let previous = null;
    let resumes = 0;
    let clock = null; // { time, at } selama berjalan
    let lastTime = 0; // posisi terakhir saat dijeda, untuk melanjutkan jam
    let restartedAt = -Infinity;
    let hello;
    let reveal = null; // pengatur waktu sebelum video dimunculkan
    let visible = false;
    const show = () => {
      if (visible || reveal) return;
      reveal = setTimeout(() => {
        reveal = null;
        visible = true;
        setShown(true);
      }, REVEAL_MS);
    };
    const hide = () => {
      clearTimeout(reveal);
      reveal = null;
      visible = false;
      setShown(false);
    };
    const restart = () => {
      const now = performance.now();
      if (now - restartedAt < 1000) return; // baru saja diulang
      restartedAt = now;
      clock = { time: 0, at: now };
      send(youtubeCommand("seekTo", [0, true]));
    };
    // Kabar waktu yang masih menyebut posisi sebelum diulang (terkirim sebelum seek selesai) diabaikan.
    const stale = (time) => {
      const since = (performance.now() - restartedAt) / 1000;
      return since < 3 && time > since + 1;
    };
    const listen = () => {
      clearInterval(hello);
      let tries = 0;
      send(youtubeListening());
      hello = setInterval(() => {
        if (heard || ++tries > HELLO_TRIES) return clearInterval(hello);
        send(youtubeListening());
      }, 400);
    };
    const onMessage = (e) => {
      if (e.source !== iframe.contentWindow || !isYouTubeOrigin(e.origin)) return;
      const event = readYouTubeEvent(e.data);
      if (!event) return;
      if (!heard) {
        heard = true;
        send(youtubeCommand("addEventListener", ["onStateChange"]));
      }
      const info = youtubeInfo(event);
      if (info.duration) duration = info.duration;
      if (info.state === YOUTUBE_STATE.playing) {
        show();
        clock ??= { time: info.currentTime ?? lastTime, at: performance.now() };
      } else if (info.state === YOUTUBE_STATE.paused || info.state === YOUTUBE_STATE.ended) {
        hide();
        if (clock) lastTime = info.state === YOUTUBE_STATE.ended ? 0 : clock.time + (performance.now() - clock.at) / 1000;
        clock = null;
      }
      const old = info.currentTime != null && stale(info.currentTime);
      if (info.currentTime != null && !old && (info.state ?? previous) !== YOUTUBE_STATE.paused) {
        clock = { time: info.currentTime, at: performance.now() };
        if (info.currentTime > 0) show();
      }
      let commands = youtubeReaction(old ? { ...event, info: { ...event.info, currentTime: undefined } } : event, { duration, previous });
      if (info.state === YOUTUBE_STATE.paused && commands.length) {
        if (away.current || document.hidden || ++resumes > MAX_RESUMES) commands = [];
      }
      if (info.state != null) previous = info.state;
      for (const command of commands) {
        if (JSON.parse(command).func === "seekTo") restart();
        else send(command);
      }
    };
    const tick = setInterval(() => {
      if (clock && previous !== YOUTUBE_STATE.paused && youtubeLoopDue(clock, performance.now(), duration)) restart();
    }, 100);
    const onVisible = () => {
      if (!document.hidden && !away.current) send(youtubeCommand("playVideo"));
    };
    window.addEventListener("message", onMessage);
    iframe.addEventListener("load", listen);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(hello);
      clearInterval(tick);
      clearTimeout(reveal);
      window.removeEventListener("message", onMessage);
      iframe.removeEventListener("load", listen);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [live]);

  // Keluar layar sepenuhnya: jeda (hemat baterai dan data). Mulai terlihat lagi: lanjut dari posisi terakhir.
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
          className={`pointer-events-none absolute top-1/2 left-1/2 max-w-none -translate-1/2 border-0 transition-opacity duration-700 ease-brand ${shown ? "opacity-100" : "opacity-0"}`}
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
