import Link from "next/link";
import { lang as rootLang } from "next/root-params";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { ArrowIcon, Wave } from "@/components/icons";
import { uiText } from "@/content/ui";
import { isLocale, localeHref } from "@/lib/i18n";

// Halaman 404 situs publik dalam bahasa alamatnya (/id/... → Indonesia), dengan header dan footer.
export default async function NotFound() {
  const value = await rootLang();
  const lang = isLocale(value) ? value : "en";
  const t = uiText(lang).notFound;
  return (
    <>
      <SiteHeader lang={lang} path="/" />
      <main className="bg-white">
        <section className="gutter mx-auto grid max-w-[1200px] justify-items-start gap-4 py-24 md:py-32">
          <p className="eyebrow">404</p>
          <h1 className="max-w-[18ch] text-[2.5rem] leading-[1.05] text-abyss sm:text-[3.5rem]">{t.title}</h1>
          <Wave />
          <p className="max-w-[52ch] text-lg text-slate">{t.text}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={localeHref(lang, "/")}
              className="inline-flex h-12 items-center gap-2 rounded-full bg-teal px-6 font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark"
            >
              {t.home}
              <ArrowIcon className="size-[18px]" />
            </Link>
            <Link
              href={localeHref(lang, "/#services")}
              className="inline-flex h-12 items-center rounded-full border-[1.5px] border-teal px-6 font-bold text-teal transition-colors duration-200 ease-brand hover:bg-teal-soft"
            >
              {t.services}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
