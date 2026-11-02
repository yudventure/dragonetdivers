"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { intlLocale } from "@/lib/i18n";
import { allowed, clampDate, isIsoDate, monthDays, monthOptions, shiftMonth, stepDate, viewFor, yearOptions } from "@/lib/date-picker";
import { ArrowIcon, CalendarIcon } from "./icons";

const SELECT =
  "h-9 cursor-pointer appearance-none rounded-full bg-foam bg-[length:12px] bg-[position:right_10px_center] bg-no-repeat pr-7 pl-3 text-sm font-bold text-abyss ring-1 ring-mist outline-none hover:bg-teal-wash focus-visible:ring-2 focus-visible:ring-teal";
// Panah kecil di pilihan bulan dan tahun (warna slate dari tema).
const CHEVRON = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235B6B73' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`;
const ARROW =
  "grid size-9 shrink-0 place-items-center rounded-full text-teal transition-colors duration-200 ease-brand hover:bg-teal-wash disabled:cursor-not-allowed disabled:text-mist disabled:hover:bg-transparent";

/** Tanggal hari ini di zona waktu peramban (YYYY-MM-DD). */
const localToday = () => new Date().toLocaleDateString("en-CA");
const formatter = (lang, options) => new Intl.DateTimeFormat(intlLocale[lang] ?? "en-US", { timeZone: "UTC", ...options });
const at = (date) => new Date(`${date}T12:00:00Z`);

/**
 * Pemilih tanggal bermerek, pengganti kalender bawaan peramban (permintaan pemilik 2 November 2026: "jangan
 * pake tanggalan default, percantik dan lebih profesional ... di seluruh website"). Dipakai formulir selam
 * dan form admin. Logika di src/lib/date-picker.js.
 * - Tombol seperti kolom isian berisi tanggal dalam bahasa halaman ("20 Mei 1990"), ikon kalender teal.
 * - Panel kalender dengan pilihan bulan dan tahun (lompat cepat, mis. ke tahun lahir), panah bulan, hari ini
 *   bertanda cincin, tanggal terpilih teal, tanggal di luar min/max pudar dan tidak bisa dipilih, tombol Hari
 *   ini dan Hapus (bila tidak wajib).
 * - Keyboard: panah pindah hari/minggu, PageUp/PageDown bulan, Home/End awal/akhir minggu, Enter memilih,
 *   Esc menutup. Ketuk di luar menutup (pendengar di dokumen, supaya jalan di iPhone).
 * - Panel tidak keluar layar ke kanan (digeser bila perlu).
 * value/onChange memakai teks YYYY-MM-DD ("" = kosong). start = tanggal awal tampilan bila kosong (mis. 30
 * tahun lalu untuk tanggal lahir). name = ikut terkirim sebagai input tersembunyi. Atribut lain (aria-*)
 * diteruskan ke tombol.
 */
export default function DatePicker({ id, value = "", onChange, min, max, today, start, lang = "en", t, required = false, name, className = "", ...rest }) {
  const now = today ?? localToday();
  const range = { min, max };
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => viewFor(value, { min, max, today: now, start }));
  const [focus, setFocus] = useState(null);
  const [shift, setShift] = useState(0);
  const wrap = useRef(null);
  const panel = useRef(null);
  const trigger = useRef(null);
  const selected = isIsoDate(value) ? value : "";

  const show = () => {
    const first = viewFor(selected, { min, max, today: now, start });
    setView(first);
    setFocus(selected && allowed(selected, min, max) ? selected : clampDate(allowed(now, min, max) && first === now.slice(0, 7) ? now : `${first}-01`, min, max));
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };
  const pick = (date) => {
    onChange?.(date);
    close();
  };

  // Ketuk di luar atau Esc menutup.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => wrap.current && !wrap.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Panel digeser ke kiri bila melewati tepi kanan layar.
  useLayoutEffect(() => {
    if (!open || !panel.current) return setShift(0);
    const rect = panel.current.getBoundingClientRect();
    const over = rect.right - (window.innerWidth - 12);
    setShift(over > 0 ? -Math.min(over, Math.max(0, rect.left - 12)) : 0);
  }, [open]);

  // Tanggal yang difokuskan keyboard mendapat fokus nyata.
  useEffect(() => {
    if (open && focus) panel.current?.querySelector(`[data-date="${focus}"]`)?.focus({ preventScroll: true });
  }, [open, focus, view]);

  const onGridKey = (e) => {
    if (!focus || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const next = stepDate(focus, e.key, range);
    setFocus(next);
    if (next.slice(0, 7) !== view) setView(next.slice(0, 7));
  };

  const year = Number(view.slice(0, 4));
  const month = Number(view.slice(5, 7));
  const years = yearOptions({ min, max, today: now });
  const months = monthOptions(year, range);
  const monthName = (m) => formatter(lang, { month: "long" }).format(at(`2026-${String(m).padStart(2, "0")}-15`));
  const goYear = (y) => {
    const allowedMonths = monthOptions(y, range);
    const m = allowedMonths.includes(month) ? month : allowedMonths[month > allowedMonths.at(-1) ? allowedMonths.length - 1 : 0];
    setView(`${y}-${String(m).padStart(2, "0")}`);
  };
  const prev = shiftMonth(view, -1);
  const next = shiftMonth(view, 1);
  const canPrev = !min || prev >= min.slice(0, 7);
  const canNext = !max || next <= max.slice(0, 7);
  const label = selected ? formatter(lang, { day: "numeric", month: "long", year: "numeric" }).format(at(selected)) : "";
  const fullDate = formatter(lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div ref={wrap} className="relative">
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? close(false) : show())}
        onKeyDown={(e) => e.key === "ArrowDown" && !open && (e.preventDefault(), show())}
        className={`flex items-center justify-between gap-3 text-left ${className}`}
        {...rest}
      >
        <span className={`truncate ${label ? "" : "text-slate"}`}>{label || t.placeholder}</span>
        <CalendarIcon className="size-5 shrink-0 text-teal" />
      </button>
      {name && <input type="hidden" name={name} value={selected} />}

      {open && (
        <div
          ref={panel}
          role="dialog"
          aria-label={t.placeholder}
          style={shift ? { transform: `translateX(${shift}px)` } : undefined}
          className="absolute top-full left-0 z-40 mt-2 grid w-[19.5rem] max-w-[calc(100vw-1.5rem)] gap-3 rounded-card bg-white p-4 shadow-[0_18px_40px_-12px_rgb(10_50_59/0.28)] ring-1 ring-mist"
        >
          <div className="flex items-center gap-1">
            <button type="button" aria-label={t.previous} disabled={!canPrev} onClick={() => setView(prev)} className={ARROW}>
              <ArrowIcon className="size-[18px] rotate-180" />
            </button>
            <div className="flex flex-1 justify-center gap-1.5">
              <select aria-label={t.month} value={month} onChange={(e) => setView(`${year}-${String(e.target.value).padStart(2, "0")}`)} className={SELECT} style={{ backgroundImage: CHEVRON }}>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {monthName(m)}
                  </option>
                ))}
              </select>
              <select aria-label={t.year} value={year} onChange={(e) => goYear(Number(e.target.value))} className={`${SELECT} tabular-nums`} style={{ backgroundImage: CHEVRON }}>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" aria-label={t.next} disabled={!canNext} onClick={() => setView(next)} className={ARROW}>
              <ArrowIcon className="size-[18px]" />
            </button>
          </div>

          <div role="grid" onKeyDown={onGridKey} className="grid grid-cols-7 gap-0.5">
            {t.weekdays.map((day) => (
              <span key={day} role="columnheader" className="pb-1 text-center text-[11px] font-bold tracking-wide text-slate uppercase">
                {day}
              </span>
            ))}
            {monthDays(view).map((day, i) => {
              if (!day) return <span key={`x${i}`} aria-hidden="true" />;
              const ok = allowed(day, min, max);
              const isSelected = day === selected;
              const isToday = day === now;
              return (
                <button
                  key={day}
                  type="button"
                  data-date={day}
                  disabled={!ok}
                  tabIndex={day === focus ? 0 : -1}
                  aria-pressed={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  aria-label={fullDate.format(at(day))}
                  onClick={() => pick(day)}
                  onFocus={() => setFocus(day)}
                  className={`grid aspect-square place-items-center rounded-full text-sm tabular-nums transition-colors duration-150 ease-brand outline-none focus-visible:ring-2 focus-visible:ring-lagoon ${
                    isSelected
                      ? "bg-teal font-bold text-white"
                      : !ok
                        ? "cursor-not-allowed text-slate/35"
                        : isToday
                          ? "font-bold text-teal ring-1 ring-teal hover:bg-teal-wash"
                          : "text-abyss hover:bg-teal-wash"
                  }`}
                >
                  {Number(day.slice(8, 10))}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            {allowed(now, min, max) ? (
              <button type="button" onClick={() => pick(now)} className="h-9 rounded-full px-3 text-sm font-bold text-teal hover:bg-teal-wash">
                {t.today}
              </button>
            ) : (
              <span />
            )}
            {selected && !required && (
              <button type="button" onClick={() => pick("")} className="h-9 rounded-full px-3 text-sm font-semibold text-slate hover:bg-foam hover:text-abyss">
                {t.clear}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
