"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import logo from "../../brand/logo/dragonet-divers-logo.png";
import { useCurrency, useRateText } from "./currency";
import { serviceArt } from "./service-art";
import { BanknoteIcon, ChatIcon, CheckIcon, ChevronIcon, CloseIcon, GlobeIcon, MenuIcon, Wave } from "./icons";

// Menu situs (BRANDING.md §9.1). Desktop (lg ke atas): menu di tengah (Layanan sebagai daftar turun
// dengan kelima halaman layanan), lalu satu tombol bahasa & mata uang (daftar turun) dan tombol Book a
// dive. Ponsel dan tablet: tombol menu membuka panel putih layar penuh (Layanan sebagai daftar turun,
// baris menu Fredoka 20 px, bahasa dan mata uang ringkas, CTA di bawah). Mata uang hanya bisa dipilih
// bila dolar dinyalakan tim di /admin/kontak. Panel dipasang di <body> lewat portal, karena backdrop-blur header membuat
// position: fixed di dalamnya ikut terkurung di header.

/** Tutup panel saat klik di luar atau Esc (fokus kembali ke tombolnya). */
function useDismiss(open, close, area, trigger) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (event) => area.current && !area.current.contains(event.target) && close();
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      close();
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, area, trigger]);
}

/** Tautan ke halaman yang sama dalam bahasa lain; bagian halaman (#faq) ikut dibawa. */
function languageLink(item, current) {
  return {
    href: item.href,
    hrefLang: item.lang,
    lang: item.lang,
    "aria-current": current ? "true" : undefined,
    onClick: (event) => {
      if (window.location.hash && !item.href.includes("#")) event.currentTarget.href = item.href + window.location.hash;
    },
  };
}

// Mata uang yang bisa dipilih tamu, Rupiah lebih dulu (mata uang bawaan).
const CURRENCY_ORDER = ["IDR", "USD"];

function RateNote({ t, className = "" }) {
  const rate = useRateText(t);
  if (!rate) return null;
  return (
    <div className={`grid gap-0.5 text-xs leading-snug text-slate ${className}`}>
      <p className="font-bold text-abyss tabular-nums">{rate.rate}</p>
      <p>{rate.source}</p>
      <p>{t.pricesNote}</p>
    </div>
  );
}

const OPTION = "flex w-full items-center gap-3 rounded-input px-3 py-2 text-left text-[15px] transition-colors duration-200 ease-brand";
const optionTone = (current) => (current ? "bg-teal-soft font-semibold text-teal" : "text-abyss hover:bg-foam");

/**
 * Bahasa dan mata uang di header desktop: satu tombol (bola dunia, EN, dan IDR bila dolar dinyalakan
 * di /admin/kontak) dengan panel kecil berisi kedua pilihan dan kurs hari ini.
 */
function PreferencesMenu({ lang, languages, t }) {
  const { currency, usd, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const area = useRef(null);
  const trigger = useRef(null);
  const close = useRef(() => setOpen(false)).current;
  useDismiss(open, close, area, trigger);
  const active = languages.find((item) => item.lang === lang) ?? languages[0];
  return (
    <div ref={area} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls="preferences-menu"
        aria-label={`${usd ? t.preferences : t.language}: ${active.name}${usd ? `, ${t.currencyNames[currency]}` : ""}`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/80 px-3 text-[13px] font-bold text-abyss ring-1 ring-mist backdrop-blur-sm transition-colors duration-200 ease-brand hover:bg-foam hover:text-teal"
      >
        <GlobeIcon className="size-[18px] text-teal" />
        {active.short}
        {usd && (
          <>
            <span aria-hidden="true" className="h-3.5 w-px bg-mist" />
            {currency}
          </>
        )}
        <ChevronIcon className={`size-3.5 transition-transform duration-200 ease-brand ${open ? "-rotate-90" : "rotate-90"}`} />
      </button>
      {open && (
        <div id="preferences-menu" className="absolute top-full right-0 mt-2 grid w-72 gap-4 rounded-card bg-white p-3 shadow-float ring-1 ring-mist">
          <div className="grid gap-1">
            <p className="px-3 pt-1 text-[11px] font-bold tracking-[0.14em] text-slate uppercase">{t.language}</p>
            {languages.map((item) => {
              const current = item.lang === lang;
              return (
                <a key={item.lang} {...languageLink(item, current)} className={`${OPTION} ${optionTone(current)}`}>
                  <span className="w-7 text-xs font-bold tracking-wide">{item.lang.toUpperCase()}</span>
                  <span className="flex-1">{item.name}</span>
                  {current && <CheckIcon className="size-4" />}
                </a>
              );
            })}
          </div>
          {usd && (
            <div className="grid gap-1 border-t border-mist pt-3">
              <p className="px-3 text-[11px] font-bold tracking-[0.14em] text-slate uppercase">{t.currency}</p>
              {CURRENCY_ORDER.map((code) => {
                const current = code === currency;
                return (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={current}
                    onClick={() => {
                      setCurrency(code);
                      setOpen(false);
                      trigger.current?.focus();
                    }}
                    className={`${OPTION} ${optionTone(current)}`}
                  >
                    <span className="w-7 text-xs font-bold tracking-wide">{code}</span>
                    <span className="flex-1">{t.currencyNames[code]}</span>
                    {current && <CheckIcon className="size-4" />}
                  </button>
                );
              })}
              <RateNote t={t} className="mx-1 mt-1 rounded-input bg-foam p-3" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Pilihan ringkas dua tombol berdampingan untuk panel ponsel (bahasa, mata uang). */
function Segmented({ label, children }) {
  return (
    <div role="group" aria-label={label} className="flex shrink-0 rounded-full bg-white p-1 ring-1 ring-mist">
      {children}
    </div>
  );
}
const segment = (current) =>
  `grid h-9 min-w-14 place-items-center rounded-full px-3.5 text-sm font-bold transition-colors duration-200 ease-brand ${
    current ? "bg-teal text-white" : "text-slate hover:text-abyss"
  }`;

/** Daftar turun "Services" di desktop: kelima halaman layanan dengan ilustrasinya. */
function ServicesMenu({ t, services, allHref, active }) {
  const [open, setOpen] = useState(false);
  const area = useRef(null);
  const trigger = useRef(null);
  const close = useRef(() => setOpen(false)).current;
  useDismiss(open, close, area, trigger);
  return (
    <li ref={area} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls="services-menu"
        onClick={() => setOpen((v) => !v)}
        className={`relative inline-flex h-10 items-center gap-1 text-[15px] font-semibold transition-colors duration-200 ease-brand hover:text-teal ${active ? "text-teal" : "text-abyss"}`}
      >
        {t.services}
        <ChevronIcon className={`size-3.5 transition-transform duration-200 ease-brand ${open ? "-rotate-90" : "rotate-90"}`} />
        {active && <Wave className="absolute -bottom-1 left-0 h-2 w-12" />}
      </button>
      {open && (
        <div id="services-menu" className="absolute top-full left-1/2 mt-3 w-[25rem] -translate-x-1/2 rounded-card bg-white p-2 shadow-float ring-1 ring-mist">
          <ul className="grid">
            {services.map((service) => (
              <li key={service.slug}>
                <Link
                  href={service.href}
                  onClick={close}
                  aria-current={service.current ? "page" : undefined}
                  className="group grid grid-cols-[48px_1fr] items-center gap-3 rounded-input p-2 transition-colors duration-200 ease-brand hover:bg-foam aria-[current=page]:bg-teal-soft"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-[radial-gradient(circle_at_50%_40%,var(--color-white)_0%,var(--color-lagoon-wash)_100%)]">
                    <Image src={serviceArt[service.slug]} alt="" sizes="40px" className="size-10 object-contain" />
                  </span>
                  <span className="grid">
                    <span className="font-display text-base font-semibold text-abyss group-hover:text-teal">{service.title}</span>
                    <span className="text-[13px] leading-snug text-slate">{service.summary}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={allHref}
            onClick={close}
            className="mt-1 flex items-center justify-between rounded-input px-3 py-2.5 text-sm font-bold text-teal transition-colors duration-200 ease-brand hover:bg-foam"
          >
            {t.allServices}
            <ChevronIcon className="size-4" />
          </Link>
        </div>
      )}
    </li>
  );
}

/** Tombol oranye ke WhatsApp; tanpa nomor WhatsApp (NEXT_PUBLIC_WHATSAPP_NUMBER) tidak ditampilkan. */
function BookButton({ booking, t, className = "" }) {
  if (!booking) return null;
  return (
    <a
      href={booking}
      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-mandarin px-3 text-sm font-bold whitespace-nowrap text-abyss transition-colors duration-200 ease-brand hover:bg-mandarin-hover min-[400px]:gap-2 min-[400px]:px-4 sm:px-[18px] ${className}`}
    >
      <ChatIcon className="size-[18px]" />
      <span className="sm:hidden">{t.bookShort}</span>
      <span className="hidden sm:inline">{t.book}</span>
    </a>
  );
}

// Baris menu panel ponsel: Fredoka 20 px, dipisah garis tipis.
const ROW =
  "flex h-14 w-full items-center justify-between gap-3 font-display text-xl font-semibold text-abyss transition-colors duration-200 ease-brand hover:text-teal";

/**
 * Panel menu layar penuh untuk ponsel dan tablet: Layanan sebagai daftar turun (terbuka bila halaman ini
 * halaman layanan), tautan lain, lalu bahasa dan mata uang dalam pilihan ringkas.
 */
function MobileMenu({ lang, t, brand, home, homeLabel, services, allServicesHref, links, languages, booking, onClose }) {
  const panel = useRef(null);
  const { currency, usd, setCurrency } = useCurrency();
  const servicesActive = services.some((service) => service.current);
  const [servicesOpen, setServicesOpen] = useState(servicesActive);

  // Gulir halaman dikunci dengan membekukan body (Safari iPhone mengabaikan overflow: hidden).
  // useLayoutEffect: kunci dilepas serentak saat panel ditutup lewat flushSync, sebelum tautan # bergulir.
  // Isi halaman di belakang panel dibuat inert, jadi Tab hanya berpindah di dalam panel.
  useLayoutEffect(() => {
    const y = window.scrollY;
    const body = document.body.style;
    Object.assign(body, { position: "fixed", top: `-${y}px`, left: "0", right: "0" });
    const behind = [...document.body.children].filter((el) => el !== panel.current && !el.inert);
    for (const el of behind) el.inert = true;
    panel.current?.querySelector("[data-autofocus]")?.focus();
    return () => {
      for (const el of behind) el.inert = false;
      Object.assign(body, { position: "", top: "", left: "", right: "" });
      window.scrollTo(0, y);
    };
  }, []);

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const follow = () => flushSync(onClose);

  return createPortal(
    <div ref={panel} id="mobile-menu" role="dialog" aria-modal="true" aria-label={t.label} className="fixed inset-0 z-40 flex flex-col bg-white lg:hidden">
      <div className="gutter flex h-16 shrink-0 items-center gap-4 sm:h-[72px]">
        <Link href={home} onClick={follow} className="flex items-center gap-3" aria-label={homeLabel}>
          <Image src={logo} alt="" width={44} height={44} className="size-11" />
          <span className="grid leading-none whitespace-nowrap">
            <span className="font-display text-lg font-semibold text-teal sm:text-xl">{brand}</span>
            <span className="mt-1.5 text-[10px] font-bold tracking-[0.2em] text-slate">RAJA AMPAT</span>
          </span>
        </Link>
        <button
          type="button"
          data-autofocus
          onClick={onClose}
          aria-label={t.closeMenu}
          className="ml-auto grid size-11 place-items-center rounded-full text-abyss ring-1 ring-mist transition-colors duration-200 ease-brand hover:bg-foam"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>

      <nav aria-label={t.label} className="gutter flex-1 overflow-y-auto overscroll-contain pt-2 pb-8">
        <ul className="divide-y divide-mist border-b border-mist">
          <li>
            <button type="button" aria-expanded={servicesOpen} aria-controls="mobile-services" onClick={() => setServicesOpen((v) => !v)} className={ROW}>
              <span className={servicesActive ? "text-teal" : undefined}>{t.services}</span>
              <ChevronIcon className={`size-5 text-slate transition-transform duration-200 ease-brand ${servicesOpen ? "-rotate-90" : "rotate-90"}`} />
            </button>
            {servicesOpen && (
              <ul id="mobile-services" className="grid gap-1 pb-3">
                {services.map((service) => (
                  <li key={service.slug}>
                    <Link
                      href={service.href}
                      onClick={follow}
                      aria-current={service.current ? "page" : undefined}
                      className="flex items-center gap-3 rounded-input px-2 py-2 transition-colors duration-200 ease-brand hover:bg-foam aria-[current=page]:bg-teal-soft"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_50%_40%,var(--color-white)_0%,var(--color-lagoon-wash)_100%)]">
                        <Image src={serviceArt[service.slug]} alt="" sizes="36px" className="size-9 object-contain" />
                      </span>
                      <span className="grid min-w-0">
                        <span className="text-base font-semibold text-abyss">{service.title}</span>
                        <span className="truncate text-[13px] text-slate">{service.summary}</span>
                      </span>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href={allServicesHref} onClick={follow} className="flex items-center justify-between rounded-input px-2 py-2.5 text-sm font-bold text-teal hover:bg-foam">
                    {t.allServices}
                    <ChevronIcon className="size-4" />
                  </Link>
                </li>
              </ul>
            )}
          </li>
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} onClick={follow} className={ROW}>
                {link.label}
                <ChevronIcon className="size-5 text-slate" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-3 rounded-card bg-foam p-4 ring-1 ring-mist">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-abyss">
              <GlobeIcon className="size-[18px] text-teal" />
              {t.language}
            </p>
            <Segmented label={t.language}>
              {languages.map((item) => {
                const current = item.lang === lang;
                return (
                  <a key={item.lang} {...languageLink(item, current)} title={item.name} className={segment(current)}>
                    {item.short}
                  </a>
                );
              })}
            </Segmented>
          </div>
          {usd && (
            <>
              <div className="flex items-center justify-between gap-3 border-t border-mist pt-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-abyss">
                  <BanknoteIcon className="size-[18px] text-teal" />
                  {t.currency}
                </p>
                <Segmented label={t.currency}>
                  {CURRENCY_ORDER.map((code) => (
                    <button key={code} type="button" aria-pressed={code === currency} title={t.currencyNames[code]} onClick={() => setCurrency(code)} className={segment(code === currency)}>
                      {code}
                    </button>
                  ))}
                </Segmented>
              </div>
              <RateNote t={t} />
            </>
          )}
        </div>
      </nav>

      {booking && (
        <div className="gutter shrink-0 border-t border-mist bg-white pt-3 pb-[max(12px,env(safe-area-inset-bottom,0px))]">
          <a
            href={booking}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-mandarin font-bold text-abyss transition-colors duration-200 ease-brand hover:bg-mandarin-hover"
          >
            <ChatIcon className="size-[18px]" />
            {t.book}
          </a>
        </div>
      )}
    </div>,
    document.body,
  );
}

export default function SiteNav({ lang, t, brand, home, homeLabel, services, allServicesHref, links, languages, booking, servicesActive }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const close = useRef(() => setOpen(false)).current;

  // Panel ponsel ditutup otomatis bila layar melebar ke ukuran desktop.
  useEffect(() => {
    if (!open) return;
    const wide = window.matchMedia("(min-width: 1024px)");
    const onChange = () => wide.matches && setOpen(false);
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, [open]);

  // Fokus kembali ke tombol menu setelah panel ditutup.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open) trigger.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);

  return (
    <>
      {/* Pil putih di atas hero (gelembung naik di belakang header transparan), hilang saat header berlatar. */}
      <nav aria-label={t.label} className="mx-auto hidden lg:block">
        <ul className="flex items-center gap-6 rounded-full bg-white/80 px-6 ring-1 ring-mist/70 backdrop-blur-sm transition-colors duration-300 ease-brand group-data-[scrolled=true]/header:bg-transparent group-data-[scrolled=true]/header:ring-transparent group-data-[scrolled=true]/header:backdrop-blur-none xl:gap-8">
          <ServicesMenu t={t} services={services} allHref={allServicesHref} active={servicesActive} />
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="inline-flex h-10 items-center text-[15px] font-semibold whitespace-nowrap text-abyss transition-colors duration-200 ease-brand hover:text-teal">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="ml-auto flex items-center gap-2 lg:ml-0 xl:gap-3">
        <div className="hidden lg:block">
          <PreferencesMenu lang={lang} languages={languages} t={t} />
        </div>
        <BookButton booking={booking} t={t} />
        <button
          ref={trigger}
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={t.openMenu}
          className="grid size-10 place-items-center rounded-full text-abyss ring-1 ring-mist transition-colors duration-200 ease-brand group-data-[tone=dark]/header:text-white group-data-[tone=dark]/header:ring-white/50 hover:bg-foam group-data-[tone=dark]/header:hover:bg-white/15 lg:hidden"
        >
          <MenuIcon className="size-5" />
        </button>
      </div>

      {open && (
        <MobileMenu
          lang={lang}
          t={t}
          brand={brand}
          home={home}
          homeLabel={homeLabel}
          services={services}
          allServicesHref={allServicesHref}
          links={links}
          languages={languages}
          booking={booking}
          onClose={close}
        />
      )}
    </>
  );
}
