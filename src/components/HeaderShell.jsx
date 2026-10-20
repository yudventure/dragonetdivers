"use client";

import { useEffect, useState } from "react";

// Pembungkus header: tanpa latar saat halaman di paling atas, lalu putih transparan + blur
// dan garis bawah Mist begitu halaman di-scroll.
export default function HeaderShell({ children }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      className={`sticky top-0 z-20 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ease-brand ${
        scrolled ? "border-mist/80 bg-white/70 backdrop-blur-md" : "border-transparent bg-transparent"
      }`}
    >
      {children}
    </header>
  );
}
