"use client";

import { useEffect, useRef } from "react";

// Video loop dekoratif tanpa suara (hero, latar panel kondisi laut). Diputar lewat JS hanya saat
// terlihat di layar, dan tidak sama sekali bila pengunjung memilih "kurangi animasi" atau
// memakai mode hemat data; selain itu yang tampil gambar poster.
export default function LoopVideo({ sources, poster, className }) {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = navigator.connection?.saveData === true;
    let visible = false;
    const sync = () => {
      if (visible && !reduce.matches && !saveData) video.play().catch(() => {});
      else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(video);
    reduce.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      reduce.removeEventListener("change", sync);
    };
  }, []);

  return (
    <video ref={ref} poster={poster} muted loop playsInline preload="none" aria-hidden="true" className={className}>
      {sources.map(({ src, type }) => (
        <source key={src} src={src} type={type} />
      ))}
    </video>
  );
}
