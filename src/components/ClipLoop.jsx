"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "@/lib/i18n";

/**
 * Petak video galeri dengan klip unggahan tim (src/lib/clips.js, /api/clips/<id>): video biasa tanpa suara,
 * diputar sendiri dan berulang, tanpa tombol apa pun di semua perangkat (permintaan pemilik 2 November 2026,
 * pemutar YouTube di ponsel selalu memunculkan tombol jeda).
 * - Video baru dimuat dan diputar saat petaknya mendekati layar, dijeda saat keluar layar.
 * - Video tidak terlihat sampai benar-benar berjalan (kejadian "playing"), jadi bila peramban menolak
 *   memutar sendiri (mis. iPhone dalam Mode Daya Rendah), yang tampil hanya sampulnya, tanpa tombol putar.
 * - "Kurangi animasi" atau hemat data: hanya sampul.
 * - Seluruh petak tautan ke video atau kanal aslinya (video.channel untuk YouTube, video.href lainnya).
 */
export default function ClipLoop({ video, title, t }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [poster, setPoster] = useState(video.poster ?? video.thumbnail ?? null);
  const href = video.channel ?? video.href;

  useEffect(() => {
    const el = ref.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = navigator.connection?.saveData === true;
    let visible = false;
    const sync = () => {
      if (visible && !reduce.matches && !saveData) el.play().catch(() => {});
      else el.pause();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    reduce.addEventListener("change", sync);
    const onVisible = () => !document.hidden && sync();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      observer.disconnect();
      reduce.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <div className="relative size-full overflow-hidden bg-abyss">
      {poster && (
        // Sampul dari platformnya (YouTube: gambar Shorts atau video), cadangan gambar mini bila tidak ada.
        <img
          src={poster}
          alt=""
          loading="lazy"
          onError={() => poster !== video.thumbnail && setPoster(video.thumbnail ?? null)}
          className="absolute inset-0 size-full object-cover"
        />
      )}
      <video
        ref={ref}
        src={video.clip.src}
        muted
        loop
        playsInline
        disablePictureInPicture
        disableRemotePlayback
        preload="none"
        aria-hidden="true"
        tabIndex={-1}
        onPlaying={() => setPlaying(true)}
        className={`pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-500 ease-brand ${playing ? "opacity-100" : "opacity-0"}`}
      />
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
