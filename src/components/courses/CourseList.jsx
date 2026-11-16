import { ChatIcon, Wave } from "../icons";
import CourseCard from "./CourseCard";

// Seksi "Kursus SSI kami" di /services/dive-courses (permintaan pemilik 16 November 2026): lima kartu kursus
// berurutan dari Open Water sampai Divemaster, ditambah kartu tanya lewat WhatsApp yang mengisi petak keenam.
// courses = coursesIn(lang), text = ui.courses, ask = tautan WhatsApp atau null.
export default function CourseList({ courses, lang, text, ask }) {
  return (
    <section id="courses" aria-labelledby="courses-title" className="scroll-mt-24 bg-foam">
      <div className="gutter mx-auto grid max-w-[1200px] gap-8 py-16 md:py-20">
        <div className="grid max-w-[62ch] gap-3">
          <p className="eyebrow">{text.eyebrow}</p>
          <h2 id="courses-title" className="text-[1.75rem] leading-[1.15] text-abyss sm:text-[2.125rem]">
            {text.title}
          </h2>
          <Wave />
          <p className="text-slate">{text.intro}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ol role="list" className="contents">
            {courses.map((course, i) => (
              <li key={course.slug} className="grid">
                <CourseCard course={course} lang={lang} text={text} step={i + 1} />
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-3 rounded-card bg-teal p-6 text-white">
            <span className="grid size-12 place-items-center rounded-full bg-white/15">
              <ChatIcon className="size-6" />
            </span>
            <h3 className="mt-1 text-[1.375rem] leading-tight">{text.ask}</h3>
            <p className="text-[15px] text-white/85">{text.askText}</p>
            {ask && (
              <a
                href={ask}
                className="mt-auto inline-flex h-11 items-center justify-center gap-2 self-start rounded-full bg-white px-5 text-sm font-bold text-teal transition-colors duration-200 ease-brand hover:bg-foam"
              >
                <ChatIcon className="size-[18px]" />
                {text.askButton}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
