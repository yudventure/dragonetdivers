import { site } from "@/lib/site";
import { robotsRules } from "@/lib/seo";

// robots.txt: halaman publik boleh dibaca mesin pencari, dashboard tim tidak, dan alamat sitemap.xml
// disebut (src/lib/seo.js). Dibuat per permintaan supaya alamatnya selalu sama dengan sitemap.xml
// (NEXT_PUBLIC_SITE_URL saat website berjalan).
export const dynamic = "force-dynamic";

export default function robots() {
  return robotsRules(site.url);
}
