"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { countryOptions, defaultCountry, dialOf, flagOf, joinPhone, splitPhone } from "@/lib/phone";
import { CheckIcon, ChevronIcon } from "../icons";

/**
 * Kolom nomor WhatsApp dengan pemilih kode negara (bendera, nama negara dalam bahasa halaman, kode telepon)
 * yang bisa dicari. value / onChange memakai nomor lengkap "+62 812 3456 7890" (src/lib/phone.js joinPhone),
 * jadi server tetap memeriksanya dengan cleanWhatsApp. Nomor yang ditempel dengan +kode atau 00kode
 * memindahkan pilihan negaranya. Esc di daftar hanya menutup daftar, bukan jendela checkout.
 * t = { country, search, noResults, placeholder }.
 */
export default function PhoneField({ id, lang, value, onChange, t, invalid = {} }) {
  const listId = useId();
  const box = useRef(null);
  const search = useRef(null);
  const list = useRef(null);
  const [country, setCountry] = useState(() => splitPhone(value)?.iso ?? defaultCountry(lang));
  const [national, setNational] = useState(() => splitPhone(value)?.national ?? "");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const options = useMemo(() => countryOptions(lang, query), [lang, query]);
  const current = useMemo(() => countryOptions(lang).find((c) => c.iso === country), [lang, country]);

  // Halaman English: negara awal dari bahasa peramban (en-AU → Australia), selama nomor belum diisi.
  useEffect(() => {
    if (!value) setCountry(defaultCountry(lang, navigator.languages ?? [navigator.language]));
  }, []);

  const emit = (iso, text) => onChange(joinPhone(iso, text));

  function pick(iso) {
    setCountry(iso);
    setOpen(false);
    setQuery("");
    emit(iso, national);
    requestAnimationFrame(() => document.getElementById(id)?.focus());
  }

  function type(text) {
    // Nomor lengkap yang ditempel atau diketik (+61 4…, 0061 4…) memindahkan negara.
    const split = /^\s*(\+|00)/.test(text) ? splitPhone(text, country) : null;
    const iso = split?.iso ?? country;
    const rest = split ? split.national : text;
    setCountry(iso);
    setNational(rest);
    emit(iso, rest);
  }

  // Saat dibuka: kolom cari mendapat fokus, negara terpilih disorot dan terlihat di daftar.
  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, options.findIndex((c) => c.iso === country)));
    requestAnimationFrame(() => {
      search.current?.focus();
      list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "center" });
    });
    const outside = (event) => !box.current?.contains(event.target) && setOpen(false);
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  useEffect(() => {
    list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function keys(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setQuery("");
      document.getElementById(`${id}-country`)?.focus();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((index) => Math.min(options.length - 1, Math.max(0, index + step)));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (options[active]) pick(options[active].iso);
    } else if (event.key === "Tab") setOpen(false);
  }

  const dial = dialOf(country);
  return (
    <div ref={box} className="relative">
      <div
        className={`flex h-12 w-full items-stretch rounded-input border bg-white text-abyss focus-within:border-teal focus-within:ring-3 focus-within:ring-lagoon/40 ${
          invalid["aria-invalid"] ? "border-danger" : "border-line-strong"
        }`}
      >
        <button
          id={`${id}-country`}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-label={`${t.country}: ${current?.name ?? country} +${dial}`}
          onClick={() => setOpen((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-l-input border-r border-mist pr-2 pl-3 outline-none hover:bg-foam focus-visible:bg-foam"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            {flagOf(country)}
          </span>
          <span className="font-semibold tabular-nums">+{dial}</span>
          <ChevronIcon className={`size-4 text-slate transition-transform duration-200 ease-brand ${open ? "-rotate-90" : "rotate-90"}`} />
        </button>
        <input
          id={id}
          type="tel"
          required
          maxLength={24}
          autoComplete="tel-national"
          inputMode="tel"
          placeholder={t.placeholder}
          value={national}
          onChange={(e) => type(e.target.value)}
          className="min-w-0 flex-1 rounded-r-input bg-transparent px-3 outline-none placeholder:text-slate/70"
          {...invalid}
        />
      </div>

      {open && (
        <div onKeyDown={keys} className="absolute top-full left-0 z-30 mt-2 grid w-full min-w-[280px] gap-2 rounded-card bg-white p-2 shadow-float ring-1 ring-mist">
          <input
            ref={search}
            type="search"
            role="combobox"
            aria-label={t.search}
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={options[active] ? `${listId}-${options[active].iso}` : undefined}
            aria-autocomplete="list"
            placeholder={t.search}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            className="h-10 w-full rounded-input border border-line-strong bg-white px-3 text-sm text-abyss outline-none focus:border-teal"
          />
          <ul ref={list} id={listId} role="listbox" aria-label={t.country} className="max-h-64 overflow-y-auto overscroll-contain">
            {options.map((c, index) => {
              const selected = c.iso === country;
              return (
                <li
                  key={c.iso}
                  id={`${listId}-${c.iso}`}
                  role="option"
                  aria-selected={selected}
                  onPointerMove={() => setActive(index)}
                  onClick={() => pick(c.iso)}
                  className={`flex cursor-pointer items-center gap-3 rounded-input px-2.5 py-2 text-sm ${index === active ? "bg-foam" : ""}`}
                >
                  <span aria-hidden="true" className="text-lg leading-none">
                    {flagOf(c.iso)}
                  </span>
                  <span className={`min-w-0 flex-1 truncate ${selected ? "font-semibold text-teal" : "text-abyss"}`}>{c.name}</span>
                  <span className="text-slate tabular-nums">+{c.dial}</span>
                  {selected && <CheckIcon className="size-4 shrink-0 text-teal" />}
                </li>
              );
            })}
            {options.length === 0 && <li className="px-2.5 py-3 text-sm text-slate">{t.noResults}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
