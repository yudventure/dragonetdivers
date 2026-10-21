import localFont from "next/font/local";

// Font brand disimpan lokal di brand/fonts (SIL OFL), tanpa CDN saat runtime. Dipakai kedua root
// layout: situs publik (app/[lang]/layout.jsx) dan dashboard tim (app/admin/layout.jsx).
const fredoka = localFont({
  src: "../brand/fonts/Fredoka-Variable.woff2",
  weight: "300 700",
  variable: "--font-fredoka",
  display: "swap",
});

const jakarta = localFont({
  src: [
    { path: "../brand/fonts/PlusJakartaSans-Variable.woff2", weight: "200 800", style: "normal" },
    { path: "../brand/fonts/PlusJakartaSans-Italic-Variable.woff2", weight: "200 800", style: "italic" },
  ],
  variable: "--font-jakarta",
  display: "swap",
});

export const fontVariables = `${fredoka.variable} ${jakarta.variable}`;
