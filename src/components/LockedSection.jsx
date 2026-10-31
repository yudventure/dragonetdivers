import { LockIcon } from "@/components/icons";
import { maintenanceText } from "@/content/maintenance";

// Pengganti satu bagian beranda yang ditutup mode developer (src/lib/developer.js). id bagian tetap
// ada supaya tautan menu (#faq, #gallery, ...) tetap mendarat di tempatnya.
export default function LockedSection({ id, lang }) {
  const t = maintenanceText[lang] ?? maintenanceText.en;
  return (
    <section id={id} aria-labelledby={`${id}-locked`} className="scroll-mt-24 bg-white">
      <div className="gutter mx-auto max-w-[1200px] py-10 md:py-14">
        <div className="grid justify-items-center gap-2 rounded-card border border-dashed border-mist bg-foam px-6 py-10 text-center">
          <span className="grid size-11 place-items-center rounded-full bg-teal-soft text-teal">
            <LockIcon className="size-5" />
          </span>
          <h2 id={`${id}-locked`} className="text-xl text-abyss">
            {t.sectionTitle}
          </h2>
          <p className="max-w-[46ch] text-slate">{t.sectionText}</p>
        </div>
      </div>
    </section>
  );
}
