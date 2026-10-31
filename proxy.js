import { NextResponse } from "next/server";
import { ADMIN_COOKIE, pageForPath, pageLocked, PREVIEW_COOKIE, PREVIEW_MINUTES, visitorLocks } from "./src/lib/developer.js";
import { canonicalRedirect } from "./src/lib/domain.js";
import { isLocale, LANG_COOKIE, LANG_COOKIE_DAYS, LANG_PARAM, languageChoice, localeRoute } from "./src/lib/i18n.js";
import { site } from "./src/lib/site.js";
import { adminFromToken } from "./src/server/admin-auth.js";
import { getDeveloper } from "./src/server/developer-state.js";

// Alamat English tanpa awalan ditulis ulang ke /en/... (aturan di src/lib/i18n.js), bahasa pilihan tamu
// (?lang= dari tombol EN / ID, diingat di cookie dd_lang) mengalihkan ke alamat dalam bahasa itu, lalu mode developer
// (src/lib/developer.js): halaman yang ditutup dijawab halaman perawatan 503 (app/maintenance), kecuali
// untuk operator yang masuk di /admin. ?pratinjau=pengunjung membuat operator melihat seperti pengunjung
// selama 30 menit, ?pratinjau=admin mengembalikannya. Halaman status pesanan tidak pernah ditutup.
// Sebelum semua itu: halaman (termasuk /admin) yang dibuka lewat domain lain milik situs atau lewat www.
// dialihkan 301 ke domain utama (src/lib/domain.js). /api tidak dialihkan, jadi notifikasi Midtrans ke
// domain lama tetap sampai.
export async function proxy(request) {
  if (request.method === "GET" || request.method === "HEAD") {
    const main = canonicalRedirect([request.headers.get("x-forwarded-host"), request.headers.get("host")], site.url);
    if (main) {
      const response = NextResponse.redirect(new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, main), 301);
      // Tanpa Cache-Control peramban mengingat 301 selamanya; dibatasi sejam supaya salah atur domain cepat pulih.
      response.headers.set("Cache-Control", "public, max-age=3600");
      return response;
    }
  }
  const { pathname } = request.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return NextResponse.next();

  const preview = request.nextUrl.searchParams.get("pratinjau");
  if (preview === "pengunjung" || preview === "admin") {
    const url = request.nextUrl.clone();
    url.searchParams.delete("pratinjau");
    const response = NextResponse.redirect(url, 303);
    if (preview === "pengunjung") {
      response.cookies.set(PREVIEW_COOKIE, "1", { path: "/", maxAge: PREVIEW_MINUTES * 60, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    } else {
      response.cookies.delete(PREVIEW_COOKIE);
    }
    return response;
  }

  const route = localeRoute(request.nextUrl.pathname);
  if (route.redirect) {
    const url = request.nextUrl.clone();
    url.pathname = route.redirect;
    return NextResponse.redirect(url, 308);
  }

  if (request.method === "GET" || request.method === "HEAD") {
    const choice = languageChoice(request.nextUrl.pathname, {
      param: request.nextUrl.searchParams.get(LANG_PARAM),
      cookie: request.cookies.get(LANG_COOKIE)?.value,
    });
    if (choice) {
      const url = request.nextUrl.clone();
      url.pathname = choice.redirect;
      url.searchParams.delete(LANG_PARAM);
      const response = NextResponse.redirect(url, 307);
      response.headers.set("Cache-Control", "private, no-store");
      if (choice.remember) {
        response.cookies.set(LANG_COOKIE, choice.remember, {
          path: "/",
          maxAge: LANG_COOKIE_DAYS * 86_400,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      }
      return response;
    }
  }

  const lock = await maintenanceLock(request, route.rewrite ?? request.nextUrl.pathname);
  if (lock) {
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    url.search = "";
    const headers = new Headers(request.headers);
    headers.set("x-dd-lock", lock.kind);
    headers.set("x-dd-lang", lock.lang);
    headers.set("x-dd-path", lock.path);
    return NextResponse.rewrite(url, { request: { headers } });
  }

  if (!route.rewrite) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = route.rewrite;
  return NextResponse.rewrite(url);
}

/** { kind, lang, path } bila halaman ini ditutup untuk penampil ini, atau null. target = /en/... atau /id/... */
async function maintenanceLock(request, target) {
  if (request.method !== "GET" && request.method !== "HEAD") return null;
  const [, lang, ...rest] = target.split("/");
  const path = `/${rest.join("/")}`;
  if (path === "/order" || path.startsWith("/order/")) return null;
  const developer = await getDeveloper();
  const page = pageForPath(path);
  if (!pageLocked(visitorLocks(developer), page)) return null;
  const { cookies } = request;
  if (!cookies.has(PREVIEW_COOKIE) && (await adminFromToken(cookies.get(ADMIN_COOKIE)?.value))) return null;
  return { kind: developer.site ? "site" : "page", lang: isLocale(lang) ? lang : "en", path };
}

// /admin ikut lewat sini hanya untuk pengalihan domain; selebihnya diteruskan apa adanya.
export const config = { matcher: ["/((?!api(?:/|$)|maintenance(?:/|$)|_next/|.*\\..*).*)"] };
