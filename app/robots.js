import { headers } from "next/headers";
import { seoOrigin } from "@/lib/domain";
import { site } from "@/lib/site";
import { robotsRules } from "@/lib/seo";

// robots.txt: halaman publik boleh dibaca mesin pencari, dashboard tim tidak, dan alamat sitemap.xml
// disebut (src/lib/seo.js). Dibuat per permintaan supaya alamatnya selalu sama dengan sitemap.xml di domain
// yang sama (domain utama, atau domain lama selama pindah domain; seoOrigin di src/lib/domain.js).
export const dynamic = "force-dynamic";

export default async function robots() {
  const list = await headers();
  return robotsRules(seoOrigin([list.get("x-forwarded-host"), list.get("host")], site.url));
}
