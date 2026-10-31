import { site } from "@/lib/site";
import { sitemapEntries } from "@/lib/seo";
import { services } from "@/lib/services";
import { getSiteSettings } from "@/server/site-settings";

// sitemap.xml untuk Google Search Console: beranda dan halaman layanan yang tampil (layanan yang disimpan
// di /admin/paket tidak ikut) dalam English, Indonesia, Mandarin, dan Korea. Dibuat per permintaan supaya mengikuti
// pengaturan terbaru. Isi dan aturannya di src/lib/seo.js.
export const dynamic = "force-dynamic";

export default async function sitemap() {
  const { hiddenServices } = await getSiteSettings();
  const shown = services.map((s) => s.slug).filter((slug) => !hiddenServices.includes(slug));
  return sitemapEntries(site.url, shown);
}
