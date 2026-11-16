import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import CourseCard, { CourseIcon } from "@/components/courses/CourseCard";
import { ServiceVisual } from "@/components/ServiceCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { CapIcon, ChatIcon, CheckIcon, FormIcon, Wave, WavesIcon } from "@/components/icons";
import { courseBySlug, coursesIn } from "@/content/courses";
import { uiText } from "@/content/ui";
import { COURSE_SLUGS, COURSES_SERVICE, coursePath } from "@/lib/course-slugs";
import { alternates, format, localeHref, locales } from "@/lib/i18n";
import { serviceBySlug } from "@/lib/services";
import { whatsappLink } from "@/lib/site";
import { isServiceShown, serviceWithImage } from "@/server/site-settings";

// Halaman satu kursus SSI (permintaan pemilik 16 November 2026): /services/dive-courses/open-water-diver,
// /id/services/dive-courses/react-right, dst. Isi dari dokumen pemilik di src/content/courses.js (en, id, zh, ko).
// Ikut layanan Kursus selam: disimpan di /admin/paket = 404, ditutup di mode developer = halaman perawatan
// (pageForPath). Dirender per permintaan supaya pengaturan tampil/simpan langsung berlaku. Tanpa harga dan jadwal
// (belum diberikan pemilik), pemesanan lewat WhatsApp.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((lang) => COURSE_SLUGS.map((course) => ({ lang, slug: COURSES_SERVICE, course })));
}

const H2 = "text-[1.75rem] leading-[1.15] text-abyss sm:text-[2.125rem]";

export async function generateMetadata({ params }) {
  const { lang, slug, course: courseSlug } = await params;
  const course = slug === COURSES_SERVICE ? courseBySlug(courseSlug, lang) : null;
  if (!course || !(await isServiceShown(COURSES_SERVICE))) return {};
  const path = coursePath(course.slug);
  return {
    title: course.name,
    description: course.summary.slice(0, 160),
    alternates: { canonical: localeHref(lang, path), languages: { ...alternates(path), "x-default": path } },
    openGraph: { title: course.name, description: course.summary, url: localeHref(lang, path) },
  };
}

export default async function CoursePage({ params }) {
  await connection();
  const { lang, slug, course: courseSlug } = await params;
  const course = slug === COURSES_SERVICE ? courseBySlug(courseSlug, lang) : null;
  if (!course || !(await isServiceShown(COURSES_SERVICE))) notFound();
  const service = await serviceWithImage(serviceBySlug(COURSES_SERVICE, lang));
  const t = uiText(lang);
  const text = t.courses;
  const page = t.servicePage;
  const path = coursePath(course.slug);
  const book = whatsappLink(format(t.whatsapp.about, { topic: course.name }));
  const waiver = localeHref(lang, "/waiver");
  const others = coursesIn(lang).filter((other) => other.slug !== course.slug);
  const steps = [
    ...course.structure.map((step) => ({ title: step.title ?? text.step, text: step.text })),
    { title: text.certification, text: course.certification, final: true },
  ];
  const closing = course.closing ?? { title: text.bookTitle, text: text.bookText };
  const learnCards = typeof course.learn[0] === "object";

  return (
    <>
      <SiteHeader lang={lang} path={path} />
      <main>
        <section aria-labelledby="course-title" className="bg-white">
          <div className="gutter mx-auto grid max-w-[1200px] items-center gap-10 pt-8 pb-14 md:pt-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="grid min-w-0 content-start gap-4">
              <nav aria-label={page.breadcrumb} className="text-sm text-slate">
                <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <li>
                    <Link href={localeHref(lang, "/")} className="hover:text-teal hover:underline">
                      {page.home}
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li>
                    <Link href={localeHref(lang, `/services/${COURSES_SERVICE}`)} className="hover:text-teal hover:underline">
                      {service.title}
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li aria-current="page" className="font-semibold text-abyss">
                    {course.short}
                  </li>
                </ol>
              </nav>
              <p className="eyebrow mt-4">{format(text.courseEyebrow, { level: course.level })}</p>
              <h1 id="course-title" className="text-[2.375rem] leading-[1.05] text-abyss sm:text-[3.25rem]">
                {course.name}
              </h1>
              <p className="font-display text-xl text-teal sm:text-2xl">{course.tagline}</p>
              {course.intro.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="max-w-[58ch] text-slate">
                  {paragraph}
                </p>
              ))}
              <div className="mt-2 flex flex-wrap gap-3">
                {book && (
                  <a
                    href={book}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-teal px-6 font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark"
                  >
                    <ChatIcon className="size-[18px]" />
                    {text.book}
                  </a>
                )}
                <Link
                  href={waiver}
                  className="inline-flex h-12 items-center gap-2 rounded-full border-[1.5px] border-teal px-6 font-bold text-teal transition-colors duration-200 ease-brand hover:bg-teal-soft"
                >
                  <FormIcon className="size-[18px]" />
                  {text.waiver}
                </Link>
              </div>
            </div>
            <ServiceVisual
              service={{ ...service, chips: [course.level, format(text.minAge, { n: course.minAge })] }}
              className="aspect-[4/3] rounded-frame"
              sizes="(min-width: 1024px) 560px, 90vw"
              priority
            />
          </div>
        </section>

        <section aria-labelledby="facts-title" className="bg-foam">
          <div className="gutter mx-auto grid max-w-[1200px] gap-8 py-14 md:py-16 lg:grid-cols-[1fr_1.5fr] lg:gap-14">
            <div className="grid content-start gap-3">
              <p className="eyebrow">{course.overview ? text.overview : text.eyebrow}</p>
              <h2 id="facts-title" className={H2}>
                {text.facts}
              </h2>
              <Wave />
              {course.overview && <p className="max-w-[56ch] text-slate">{course.overview}</p>}
            </div>
            <div className="grid content-start gap-4">
              <dl className="grid gap-3 sm:grid-cols-2">
                {course.facts.map(([label, value], i) => (
                  <div key={label} className={`grid gap-1 rounded-card bg-white p-5 ring-1 ring-mist ${i === 0 ? "sm:col-span-2" : ""}`}>
                    <dt className="text-xs font-bold tracking-[0.06em] text-slate uppercase">{label}</dt>
                    <dd className={`font-bold text-abyss ${i === 0 ? "font-display text-xl font-semibold text-teal" : ""}`}>{value}</dd>
                  </div>
                ))}
              </dl>
              {course.notes.map((note) => (
                <p key={note} className="text-sm text-slate">
                  {note}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="learn-title" className="bg-white">
          <div className="gutter mx-auto grid max-w-[1200px] gap-8 pt-16 pb-10 md:pt-20">
            <div className="grid gap-3">
              <h2 id="learn-title" className={H2}>
                {text.learn}
              </h2>
              <Wave />
            </div>
            {learnCards ? (
              <ul className={`grid gap-4 sm:grid-cols-2 ${course.learn.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
                {course.learn.map((item) => (
                  <li key={item.title} className="flex flex-col gap-2 rounded-card p-6 ring-1 ring-mist">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="grid size-10 place-items-center rounded-full bg-teal-soft text-teal">
                        <CheckIcon className="size-5" />
                      </span>
                      {item.tag && <span className="rounded-full bg-lagoon-wash px-3 py-1 text-[11px] font-bold text-lagoon">{item.tag}</span>}
                    </span>
                    <h3 className="mt-1 text-lg leading-snug text-abyss">{item.title}</h3>
                    <p className="text-[15px] text-slate">{item.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="grid gap-x-10 gap-y-4 md:grid-cols-2">
                {course.learn.map((item) => (
                  <li key={item} className="grid grid-cols-[28px_1fr] items-start gap-3 text-abyss">
                    <span className="mt-0.5 grid size-7 place-items-center rounded-full bg-teal-soft text-teal">
                      <CheckIcon className="size-4" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section aria-labelledby="structure-title" className="bg-white">
          <div className="gutter mx-auto grid max-w-[1200px] gap-8 pt-10 pb-16 md:pb-20">
            <div className="grid gap-3">
              <h2 id="structure-title" className={H2}>
                {text.structure}
              </h2>
              <Wave />
            </div>
            <ol className={`grid gap-4 md:grid-cols-2 ${steps.length === 4 ? "lg:grid-cols-4" : ""}`}>
              {steps.map((step, i) => (
                <li
                  key={step.title}
                  className={`flex flex-col gap-3 rounded-card p-6 ${step.final ? "bg-teal text-white" : "bg-foam text-abyss ring-1 ring-mist"}`}
                >
                  <span
                    className={`grid size-10 place-items-center rounded-full font-display text-lg ${step.final ? "bg-white/15 text-white" : "bg-white text-teal ring-1 ring-mist"}`}
                  >
                    {step.final ? <CapIcon className="size-5" /> : steps.length > 2 ? i + 1 : <WavesIcon className="size-5" />}
                  </span>
                  <h3 className="text-lg leading-snug">{step.title}</h3>
                  <p className={`text-[15px] ${step.final ? "text-white/85" : "text-slate"}`}>{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="why-title" className="bg-foam">
          <div className="gutter mx-auto grid max-w-[1200px] gap-10 py-16 md:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="grid content-start gap-3">
              <h2 id="why-title" className={H2}>
                {text.why}
              </h2>
              <Wave />
              <ul className="mt-2 grid gap-4 sm:grid-cols-2">
                {text.whyItems.map((item) => (
                  <li key={item} className="grid grid-cols-[28px_1fr] items-start gap-3 text-[15px] text-abyss">
                    <span className="mt-0.5 grid size-7 place-items-center rounded-full bg-white text-teal ring-1 ring-mist">
                      <CheckIcon className="size-4" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid content-start gap-4">
              {course.requirements && (
                <div className="grid gap-2 rounded-card bg-white p-6 ring-1 ring-mist">
                  <h3 className="text-xl text-abyss">{text.requirements}</h3>
                  <p className="text-[15px] text-slate">{course.requirements}</p>
                </div>
              )}
              <div className="grid gap-3 rounded-card bg-white p-6 ring-1 ring-mist">
                <span className="grid size-10 place-items-center rounded-full bg-teal-soft text-teal">
                  <FormIcon className="size-5" />
                </span>
                <h3 className="text-xl text-abyss">{text.medicalTitle}</h3>
                <p className="text-[15px] text-slate">{text.medicalText}</p>
                <Link
                  href={waiver}
                  className="mt-1 inline-flex h-11 items-center gap-2 self-start rounded-full border-[1.5px] border-teal px-5 text-sm font-bold text-teal transition-colors duration-200 ease-brand hover:bg-teal-soft"
                >
                  <FormIcon className="size-[18px]" />
                  {text.waiver}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="book-title" className="bg-abyss">
          <div className="gutter mx-auto grid max-w-[1200px] items-center gap-8 py-16 md:py-20 lg:grid-cols-[1.4fr_1fr]">
            <div className="grid gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-white/10 text-white">
                <CourseIcon slug={course.slug} className="size-6" />
              </span>
              <h2 id="book-title" className="text-[1.75rem] leading-[1.15] text-white sm:text-[2.125rem]">
                {closing.title}
              </h2>
              <p className="max-w-[58ch] text-on-dark-muted">{closing.text}</p>
              {closing.slogan && <p className="font-display text-xl text-sunrise">{closing.slogan}</p>}
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              {book && (
                <a
                  href={book}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-bold text-abyss transition-colors duration-200 ease-brand hover:bg-foam"
                >
                  <ChatIcon className="size-[18px]" />
                  {text.book}
                </a>
              )}
              <Link
                href={waiver}
                className="inline-flex h-12 items-center gap-2 rounded-full border-[1.5px] border-white/60 px-6 font-bold text-white transition-colors duration-200 ease-brand hover:bg-white/10"
              >
                <FormIcon className="size-[18px]" />
                {text.waiver}
              </Link>
            </div>
          </div>
        </section>

        <section aria-labelledby="others-title" className="bg-white">
          <div className="gutter mx-auto grid max-w-[1200px] gap-8 py-16 md:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="grid gap-3">
                <h2 id="others-title" className={H2}>
                  {text.others}
                </h2>
                <Wave />
              </div>
              <Link href={`${localeHref(lang, `/services/${COURSES_SERVICE}`)}#courses`} className="font-bold text-teal hover:underline">
                {text.all}
              </Link>
            </div>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((other) => (
                <li key={other.slug} className="grid">
                  <CourseCard course={other} lang={lang} text={text} compact />
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
