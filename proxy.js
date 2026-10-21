import { NextResponse } from "next/server";
import { localeRoute } from "./src/lib/i18n.js";

// Bahasa dari alamat: English di akar ditulis ulang ke app/[lang] dengan lang "en", /id diteruskan,
// /en/... dialihkan ke alamat tanpa /en. Aturannya di src/lib/i18n.js (localeRoute).
export function proxy(request) {
  const route = localeRoute(request.nextUrl.pathname);
  if (!route.redirect && !route.rewrite) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = route.redirect ?? route.rewrite;
  return route.redirect ? NextResponse.redirect(url, 308) : NextResponse.rewrite(url);
}

// Tanpa API, admin, berkas Next.js, dan berkas berekstensi (media, ikon, favicon).
export const config = {
  matcher: ["/((?!api(?:/|$)|admin(?:/|$)|_next/|.*\\..*).*)"],
};
