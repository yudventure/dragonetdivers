import { notFound } from "next/navigation";
import { CartProvider } from "@/components/cart";
import { CurrencyProvider } from "@/components/currency";
import DeveloperBar from "@/components/DeveloperBar";
import { uiText } from "@/content/ui";
import { htmlLang, isLocale, localeHref, locales, ogLocale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { getUsdIdrRate } from "@/server/exchange-rate";
import { getSiteSettings } from "@/server/site-settings";
import { fontVariables } from "../fonts";
import "../globals.css";

// Root layout situs publik dalam empat bahasa: /en/... (alamat English di akar, lewat proxy.js), /id/...,
// /zh/..., dan /ko/... (<html lang> dari htmlLang). Bahasa lain 404. Kurs USD → IDR untuk pilihan mata uang diambil sekali di sini.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }) {
  const { lang } = await params;
  const meta = uiText(lang).meta;
  // Kode verifikasi Google Search Console dari /admin/google (tag HTML di <head>, dibaca Google di beranda).
  // Bisa beberapa kode dipisah spasi (properti domain lama dan baru saat pindah domain): satu tag per kode.
  const { googleVerification } = await getSiteSettings();
  return {
    metadataBase: new URL(site.url),
    title: { default: `${site.name} · ${meta.title}`, template: `%s · ${site.shortName}` },
    description: meta.description,
    openGraph: {
      type: "website",
      siteName: site.name,
      title: site.name,
      description: meta.description,
      locale: ogLocale[lang],
      url: localeHref(lang, "/"),
    },
    ...(googleVerification ? { verification: { google: googleVerification.split(" ") } } : {}),
  };
}

export const viewport = { themeColor: "#FFFFFF", viewportFit: "cover" };

export default async function SiteLayout({ children, params }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  // Kontak dan media sosial dari /admin/kontak dimuat ke memori sebelum halaman memakainya (src/lib/site.js);
  // showUsd dari halaman yang sama menentukan apakah tamu bisa memilih dolar.
  const [rate, settings] = await Promise.all([getUsdIdrRate(), getSiteSettings()]);
  return (
    <html lang={htmlLang[lang]} className={fontVariables}>
      <body className="min-h-dvh font-sans">
        <CurrencyProvider lang={lang} rate={rate} usd={settings.showUsd}>
          <CartProvider>{children}</CartProvider>
        </CurrencyProvider>
        <DeveloperBar />
      </body>
    </html>
  );
}
