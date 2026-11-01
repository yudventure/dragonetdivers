import { headers } from "next/headers";
import AdminGate from "@/admin/AdminGate";
import AdminShell, { DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import GoogleSearchConsole from "@/admin/GoogleSearchConsole";
import { oldOrigins } from "@/lib/domain";
import { site } from "@/lib/site";
import { services } from "@/lib/services";
import { locales } from "@/lib/i18n";
import { currentAdmin } from "@/server/admin-auth";
import { databaseStatus } from "@/server/db";
import { getSiteSettings } from "@/server/site-settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Google Search Console" };

const bare = (host) => String(host ?? "").toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");

/** Domain yang sedang dibuka bila berbeda dengan alamat website di pengaturan (sitemap memakai alamat itu). */
async function otherHost() {
  const list = await headers();
  const host = bare((list.get("x-forwarded-host") ?? list.get("host") ?? "").split(",")[0].trim());
  const real = host.includes(".") && !/^[\d.]+$/.test(host);
  return real && host !== bare(new URL(site.url).host) ? host : null;
}

// /admin/google: langkah mendaftarkan website di Google Search Console, kolom kode verifikasi tag HTML
// (dipasang di <head> beranda), dan alamat sitemap.xml serta robots.txt untuk dikirim ke Google.
export default async function GoogleSearchConsolePage() {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const database = await databaseStatus();
  const settings = database.ok ? await getSiteSettings({ fresh: true }) : null;
  const mismatch = await otherHost();
  // Halaman di sitemap.xml: beranda dan layanan yang tampil, dalam setiap bahasa (src/lib/seo.js).
  const shown = settings ? services.filter((s) => !settings.hiddenServices.includes(s.slug)).length : 0;
  return (
    <AdminShell admin={admin} active="google">
      <ModuleTitle title="Google Search Console">
        Daftarkan website ke Google supaya halaman Dragonet Divers bisa muncul di hasil pencarian, lalu pantau kata kunci dan halaman yang dibuka
        tamu dari Google. Cukup sekali, kodenya ditempel di sini tanpa perlu membuka hPanel.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {mismatch && (
        <p role="alert" className="rounded-card bg-danger/10 p-4 text-sm font-semibold text-danger ring-1 ring-danger/30">
          Alamat website di pengaturan ({site.url}) berbeda dengan alamat yang sedang dibuka ({mismatch}). Sitemap memakai alamat
          pengaturan, jadi isi NEXT_PUBLIC_SITE_URL di hPanel dengan alamat yang benar lalu jalankan ulang website sebelum mendaftar ke Google.
        </p>
      )}
      {settings && (
        <GoogleSearchConsole
          initial={settings.googleVerification}
          siteUrl={site.url}
          oldUrls={oldOrigins(site.url)}
          pages={(1 + shown) * locales.length}
        />
      )}
    </AdminShell>
  );
}
