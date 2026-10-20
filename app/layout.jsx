import localFont from "next/font/local";
import { site } from "@/lib/site";
import "./globals.css";

// Font brand disimpan lokal di brand/fonts (SIL OFL), tanpa CDN saat runtime.
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

export const metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} · Diving & snorkeling in Raja Ampat`, template: `%s · ${site.shortName}` },
  description: site.description,
  openGraph: { type: "website", siteName: site.name, title: site.name, description: site.description, url: "/" },
};

export const viewport = { themeColor: "#FFFFFF", viewportFit: "cover" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${jakarta.variable}`}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
