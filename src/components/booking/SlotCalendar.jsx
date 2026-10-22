"use client";

import { useEffect, useState } from "react";
import { format, intlLocale } from "@/lib/i18n";
import { monthGrid } from "@/lib/modules/calendar";
import { bookable, dayState, placesLeft } from "@/lib/slots";
import { ArrowIcon } from "../icons";

// Warna tiap keadaan tanggal (mengikuti kalender Zanclus): tersedia, hampir penuh, penuh, tutup, di luar rentang.
const TONE = {
  open: "bg-white text-abyss ring-1 ring-teal-soft hover:bg-teal-wash",
  low: "bg-sunrise-wash text-abyss ring-1 ring-sunrise/60 hover:bg-sunrise/40",
  full: "bg-danger/10 text-danger",
  closed: "bg-mist/70 text-slate",
  past: "text-slate/40",
};
const SWATCH = { open: "bg-white ring-teal-soft", low: "bg-sunrise-wash ring-sunrise", full: "bg-danger/10 ring-danger/40", closed: "bg-mist/70 ring-line-strong/40" };
const MONTH_BUTTON =
  "grid size-10 place-items-center rounded-full text-teal ring-1 ring-mist transition-colors duration-200 ease-brand hover:bg-teal-wash disabled:text-mist disabled:hover:bg-transparent";

/** "Saturday, 24 October 2026" / "Sabtu, 24 Oktober 2026". */
export const longDate = (date, lang) =>
  new Intl.DateTimeFormat(intlLocale[lang], { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));

const shiftMonth = (month, delta) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
};

/**
 * Satu bulan tanggal dengan sisa tempat di tiap tanggal (slots dari slotCalendar(), keadaan dari src/lib/slots.js).
 * Dipakai di samping daftar paket dan di jendela checkout; tanggal penuh, tutup, dan di luar rentang tidak bisa dipilih.
 */
export function SlotMonth({ slots, range, date, onSelect, lang, t, compact = false, Title = "h4" }) {
  const [view, setView] = useState((date || range.min).slice(0, 7));
  // Tanggal yang dipilih di kalender lain (samping halaman atau checkout) membawa bulannya ke depan.
  useEffect(() => {
    if (date) setView((current) => (current === date.slice(0, 7) ? current : date.slice(0, 7)));
  }, [date]);
  const capacity = slots?.capacity ?? 0;
  const monthName = new Intl.DateTimeFormat(intlLocale[lang], { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${view}-15T12:00:00Z`));

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <button type="button" aria-label={t.previous} disabled={view <= range.min.slice(0, 7)} onClick={() => setView(shiftMonth(view, -1))} className={MONTH_BUTTON}>
          <ArrowIcon className="size-[18px] rotate-180" />
        </button>
        <Title aria-live="polite" className="font-display text-lg font-semibold text-abyss capitalize">
          {monthName}
        </Title>
        <button type="button" aria-label={t.next} disabled={view >= range.max.slice(0, 7)} onClick={() => setView(shiftMonth(view, 1))} className={MONTH_BUTTON}>
          <ArrowIcon className="size-[18px]" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {t.weekdays.map((day) => (
          <span key={day} className="pb-1 text-center text-xs font-semibold text-slate">
            {day}
          </span>
        ))}
        {monthGrid(view).map((day, index) => {
          if (!day) return <span key={`blank-${index}`} aria-hidden="true" />;
          const state = dayState(slots, day, range);
          const left = placesLeft(slots, day);
          const short = state === "closed" ? t.closed : state === "full" ? t.full : state === "past" || !capacity ? "" : String(left);
          const status = state === "past" ? "" : state === "closed" ? t.closed : state === "full" ? t.full : capacity ? format(t.left, { left, capacity }) : t.available;
          const selected = day === date;
          return (
            <button
              key={day}
              type="button"
              data-date={day}
              data-state={state}
              disabled={!bookable(state)}
              aria-pressed={selected}
              aria-label={status ? `${longDate(day, lang)}, ${status}` : longDate(day, lang)}
              onClick={() => onSelect(selected ? "" : day)}
              className={`grid ${compact ? "h-11" : "h-12"} min-w-0 content-center justify-items-center rounded-input leading-none tabular-nums transition-colors duration-150 ease-brand disabled:cursor-default ${
                selected ? "bg-teal text-white ring-2 ring-teal" : TONE[state]
              }`}
            >
              <span className="text-sm font-semibold">{Number(day.slice(8))}</span>
              {short && (
                <small aria-hidden="true" className="mt-1 max-w-full truncate px-0.5 text-[10px] font-semibold">
                  {short}
                </small>
              )}
            </button>
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate">
        {(capacity ? ["open", "low", "full", "closed"] : ["open", "closed"]).map((state) => (
          <li key={state} className="flex items-center gap-1.5">
            <i aria-hidden="true" className={`size-3 rounded-[4px] ring-1 ${SWATCH[state]}`} />
            {t.legend[state]}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Kalender di samping daftar paket (acuan: "Pick your diving date" di Zanclus): tempat yang masih kosong per
 * tanggal untuk kelompok layanan ini (menyelam atau snorkeling & trip). Tanggal yang dipilih dipakai checkout.
 */
export default function SlotCalendar({ slots, range, date, onSelect, lang, t, pool, canCheckout, onCheckout }) {
  const capacity = slots?.capacity ?? 0;
  const left = date ? placesLeft(slots, date) : null;
  return (
    <aside id="calendar" aria-labelledby="slot-calendar-title" className="grid scroll-mt-28 gap-4 rounded-card bg-foam p-5 ring-1 ring-mist sm:p-6 lg:sticky lg:top-28">
      <div className="grid gap-2">
        <p className="eyebrow">{t.eyebrow}</p>
        <h3 id="slot-calendar-title" className="text-2xl leading-tight text-abyss">
          {t.title}
        </h3>
        <p className="text-sm text-slate">{capacity ? format(t.introCapacity, { capacity, pool: t.pools[pool] ?? "" }) : t.intro}</p>
      </div>
      <SlotMonth slots={slots} range={range} date={date} onSelect={onSelect} lang={lang} t={t} />
      {date && (
        <div role="status" className="grid gap-2 rounded-card bg-white p-4 ring-1 ring-mist">
          <strong className="text-abyss">{longDate(date, lang)}</strong>
          <span className="text-sm text-slate">{left === null ? t.available : format(t.left, { left, capacity })}</span>
          {canCheckout ? (
            <button
              type="button"
              onClick={onCheckout}
              className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-teal px-5 font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark"
            >
              {t.checkoutDate}
              <ArrowIcon className="size-[18px] -rotate-45" />
            </button>
          ) : (
            <a href="#package-list" className="text-sm font-semibold text-teal hover:underline">
              {t.pickPackages} ↓
            </a>
          )}
        </div>
      )}
    </aside>
  );
}
