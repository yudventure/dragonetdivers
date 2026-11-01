import { headers } from "next/headers";
import { seoOrigin } from "@/lib/domain";
import { site } from "@/lib/site";
import { sitemapEntries } from "@/lib/seo";
import { services } from "@/lib/services";
import { getSiteSettings } from "@/server/site-settings";

// sitemap.xml untuk Google Search Console: beranda dan halaman layanan yang tampil (layanan yang disimpan
// di /admin/paket tidak ikut) dalam English, Indonesia, Mandarin, dan Korea. Dibuat per permintaan supaya mengikuti
// pengaturan terbaru. Isi dan aturannya di src/lib/seo.js.
// Pindah domain (pemilik, akhir Oktober 2026): di domain utama berisi alamat domain utama; dibuka lewat domain
// lama (dragonetdivers.com) berisi alamat domain lama yang dialihkan 301 ke domain utama, jadi sitemap di
// properti Search Console lama tetap sah dan Google menemukan pengalihannya (seoOrigin di src/lib/domain.js).
export const dynamic = "force-dynamic";

export default async function sitemap() {
  const list = await headers();
  const origin = seoOrigin([list.get("x-forwarded-host"), list.get("host")], site.url);
  const { hiddenServices } = await getSiteSettings();
  const shown = services.map((s) => s.slug).filter((slug) => !hiddenServices.includes(slug));
  return sitemapEntries(origin, shown);
}
