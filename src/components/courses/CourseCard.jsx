import Link from "next/link";
import { coursePath } from "@/lib/course-slugs";
import { format, localeHref } from "@/lib/i18n";
import { ArrowIcon, CapIcon, FishIcon, GaugeIcon, HeartPulseIcon, LifeBuoyIcon } from "../icons";

// Kartu satu kursus SSI (src/content/courses.js) untuk daftar di /services/dive-courses dan "kursus lainnya" di
// halaman kursus. Komponen server, teks satu bahasa dari pemanggil (course = localizeCourse, text = ui.courses).
const ICONS = {
  "open-water-diver": FishIcon,
  "advanced-open-water-diver": GaugeIcon,
  "react-right": HeartPulseIcon,
  "diver-stress-and-rescue": LifeBuoyIcon,
  divemaster: CapIcon,
};

export function CourseIcon({ slug, className }) {
  const Icon = ICONS[slug] ?? FishIcon;
  return <Icon className={className} />;
}

/** step = urutan kursus (1 sampai 5), compact = tanpa ringkasan (kartu kursus lainnya). */
export default function CourseCard({ course, lang, text, step, compact = false }) {
  return (
    <Link
      href={localeHref(lang, coursePath(course.slug))}
      className="group flex h-full flex-col gap-4 rounded-card bg-white p-6 ring-1 ring-mist transition-[box-shadow,transform] duration-200 ease-brand hover:shadow-float hover:ring-teal focus-visible:ring-2 focus-visible:ring-lagoon focus-visible:outline-none motion-safe:hover:-translate-y-0.5"
    >
      <span className="flex items-center justify-between gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-teal-soft text-teal transition-colors duration-200 ease-brand group-hover:bg-teal group-hover:text-white">
          <CourseIcon slug={course.slug} className="size-6" />
        </span>
        {step && <span aria-hidden="true" className="font-display text-2xl text-mist">{String(step).padStart(2, "0")}</span>}
      </span>
      <span className="grid gap-1.5">
        <span className="text-[11px] font-bold tracking-[0.08em] text-lagoon uppercase">{course.level}</span>
        <h3 className="text-[1.375rem] leading-tight text-abyss">{course.short}</h3>
        <span className="text-[15px] font-semibold text-teal">{course.tagline}</span>
      </span>
      {!compact && <span className="text-[15px] text-slate">{course.summary}</span>}
      <span className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-1">
        <span className="rounded-full bg-foam px-3 py-1 text-xs font-bold text-slate">{format(text.minAge, { n: course.minAge })}</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-teal">
          {text.learnMore}
          <ArrowIcon className="size-4 transition-transform duration-200 ease-brand group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}
