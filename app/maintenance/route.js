import { PREVIEW_COOKIE, retryAfter } from "@/lib/developer";
import { isLocale, localeHref } from "@/lib/i18n";
import { maintenanceHtml } from "@/lib/maintenance-page";
import { contact, whatsappNumber } from "@/lib/site";
import { getDeveloper } from "@/server/developer-state";
import { getSiteSettings } from "@/server/site-settings";

export const dynamic = "force-dynamic";

// Halaman perawatan mode developer. Hanya dibuka lewat proxy.js (header x-dd-lock) untuk halaman yang
// ditutup; status 503 dan Retry-After memberi tahu mesin pencari bahwa ini sementara.
export async function GET(request) {
  await getSiteSettings(); // email dan kontak dari /admin/kontak
  const kind = request.headers.get("x-dd-lock");
  if (kind !== "site" && kind !== "page") return new Response(null, { status: 307, headers: { location: "/" } });
  const lang = isLocale(request.headers.get("x-dd-lang")) ? request.headers.get("x-dd-lang") : "en";
  const asked = request.headers.get("x-dd-path") ?? "";
  const path = /^\/(?![/\\])/.test(asked) ? asked : "/";
  const developer = await getDeveloper();
  const preview = request.headers.get("cookie")?.split(/;\s*/).some((part) => part.startsWith(`${PREVIEW_COOKIE}=`));
  const html = maintenanceHtml({
    kind,
    lang,
    path,
    // Pesan dari /admin/developer hanya ditulis dalam English dan Indonesia; bahasa lain memakai English.
    message: developer.message[lang] || developer.message.en,
    until: developer.until,
    whatsapp: whatsappNumber(),
    email: contact.email,
    previewExit: preview ? `${localeHref(lang, path)}?pratinjau=admin` : "",
  });
  return new Response(html, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": String(retryAfter(developer.until)),
      "x-robots-tag": "noindex",
    },
  });
}
