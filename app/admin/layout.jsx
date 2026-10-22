import { site } from "@/lib/site";
import { getSiteSettings } from "@/server/site-settings";
import { fontVariables } from "../fonts";
import "../globals.css";

// Root layout dashboard tim (/admin), terpisah dari situs publik dua bahasa (app/[lang]). Hanya
// Bahasa Indonesia dan tidak diindeks mesin pencari.
export const metadata = {
  metadataBase: new URL(site.url),
  title: { default: `Admin · ${site.shortName}`, template: `%s · ${site.shortName}` },
  robots: { index: false, follow: false },
};

export const viewport = { themeColor: "#FFFFFF", viewportFit: "cover" };

export default async function AdminLayout({ children }) {
  await getSiteSettings(); // kontak dari /admin/kontak untuk pratinjau email dan ringkasan
  return (
    <html lang="id" className={fontVariables}>
      <body className="min-h-dvh font-sans">{children}</body>
    </html>
  );
}
