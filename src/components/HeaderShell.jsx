"use client";

import { useEffect, useState } from "react";

// Pembungkus header: tanpa latar saat halaman di paling atas, lalu putih transparan + blur
// dan garis bawah Mist begitu halaman di-scroll. data-scrolled dipakai isi header (group/header),
// mis. menu desktop yang berlatar pil putih selama header masih transparan. overlay (beranda): header
// berada di atas video gelap hero selama belum di-scroll, jadi data-tone="dark" (isi header memakai
// warna terang, di semua ukuran layar).
export default function HeaderShell({ children, overlay = false }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      data-scrolled={scrolled}
      data-tone={overlay && !scrolled ? "dark" : "light"}
      className={`group/header sticky top-0 z-20 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ease-brand ${
        scrolled ? "border-mist/80 bg-white/70 backdrop-blur-md" : "border-transparent bg-transparent"
      }`}
    >
      {children}
    </header>
  );
}
