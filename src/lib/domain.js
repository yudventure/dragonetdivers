// Domain website (permintaan pemilik, Oktober 2026: dragonetdiversrajaampat.com jadi domain utama,
// dragonetdivers.com tetap tersambung ke website yang sama sebagai Parked Domain di hPanel). Domain utama
// = site.url (NEXT_PUBLIC_SITE_URL). Halaman yang dibuka lewat domain milik situs yang lain, atau lewat
// www., dialihkan 301 ke domain utama dengan alamat yang sama (proxy.js). Domain di luar daftar ini
// (localhost, domain sementara Hostinger) tidak pernah dialihkan. Fungsi murni, diuji tests/domain.test.js.
export const SITE_DOMAINS = ["dragonetdiversrajaampat.com", "dragonetdivers.com"];

/** Nama host tanpa port, huruf kecil. */
const hostname = (host) =>
  String(host ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");

const isSiteDomain = (name) => SITE_DOMAINS.some((domain) => name === domain || name === `www.${domain}`);

/**
 * Origin domain utama bila permintaan ini harus dialihkan ke sana, atau null. hosts = isian header
 * x-forwarded-host dan host (di belakang proxy Hostinger salah satunya bisa berisi alamat dalam); yang
 * dipakai adalah yang pertama berupa domain milik situs. Hanya domain milik situs yang dialihkan, dan hanya
 * bila domain utama juga milik situs (isian NEXT_PUBLIC_SITE_URL lain, mis. localhost, tidak mengalihkan
 * apa pun).
 */
export function canonicalRedirect(hosts, siteUrl) {
  const name = [hosts].flat().map(hostname).find(isSiteDomain);
  if (!name) return null;
  let main;
  try {
    main = new URL(siteUrl);
  } catch {
    return null;
  }
  if (!isSiteDomain(main.hostname) || main.hostname === name) return null;
  return main.origin;
}
