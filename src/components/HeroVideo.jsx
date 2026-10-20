"use client";

import { useEffect, useRef } from "react";

// Video loop penyelam (latar putih, tanpa suara). Diputar lewat JS hanya bila
// pengunjung tidak memilih "kurangi animasi" dan tidak memakai mode hemat data;
// selain itu yang tampil gambar poster.
export default function HeroVideo({ poster, className }) {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const saveData = navigator.connection?.saveData === true;
    const sync = () => {
      if (reduce.matches || saveData) video.pause();
      else video.play().catch(() => {});
    };
    sync();
    reduce.addEventListener("change", sync);
    return () => reduce.removeEventListener("change", sync);
  }, []);

  return (
    <video ref={ref} poster={poster} muted loop playsInline preload="none" aria-hidden="true" className={className}>
      <source src="/media/hero-diver.webm" type="video/webm" />
      <source src="/media/hero-diver.mp4" type="video/mp4" />
    </video>
  );
}
