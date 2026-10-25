"use client";

import { useEffect, useRef, useState } from "react";
import { addToCart, cartTotal, refreshCart } from "@/lib/cart";
import { MAX_ITEMS } from "@/lib/checkout";
import { format } from "@/lib/i18n";
import { bookable, dayState } from "@/lib/slots";
import { useCart } from "../cart";
import { Price, RupiahNote } from "../currency";
import GuestStepper from "../GuestStepper";
import { ArrowIcon, CartIcon, CheckIcon } from "../icons";
import CheckoutDialog from "./CheckoutDialog";
import SlotCalendar from "./SlotCalendar";

const SOLID =
  "inline-flex h-11 items-center justify-center rounded-full bg-teal font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark disabled:bg-mist disabled:text-slate";
const OUTLINE =
  "inline-flex h-11 items-center justify-center rounded-full border-[1.5px] border-teal font-bold text-teal transition-colors duration-200 ease-brand hover:bg-teal-soft disabled:border-mist disabled:text-slate";
// Jarak bilah keranjang dari bawah layar saat menempel (px, sama dengan bottom-4).
const BAR_GAP = 16;
// Tombol di kartu paket: di ponsel berdua selebar kartu, tanpa teks terlipat.
const ROW_BUTTON = "gap-1.5 whitespace-nowrap px-2 text-[15px] sm:px-5 sm:text-base";

/** Paket untuk keranjang: nama dua bahasa dan batas tamu (data lengkapnya diperiksa ulang saat checkout). */
const forCart = (pkg) => ({ ...pkg, name: pkg.names });

/**
 * Paket satu layanan dengan alur checkout Zanclus: tombol Tambah ke keranjang (lalu jumlah tamu) dan Pesan
 * sekarang di tiap kartu, kalender tempat di samping daftar, bilah keranjang yang mengikuti tamu di bawah
 * layar lalu berhenti tepat di bawah paket terakhir (permintaan pemilik, Oktober 2026: tidak ikut sampai
 * footer), dan jendela checkout di atas halaman. Keranjang disimpan di peramban (src/components/cart.jsx);
 * halaman ini hanya memakai paket layanannya sendiri, jadi satu pesanan = satu layanan dan satu tanggal.
 */
export default function ServiceBooking({ lang, service, packages, slots, range, pool, payments, text, ask, email }) {
  const { packages: t, cart: ct, slots: st } = text;
  const cart = useCart();
  const items = cart.items.filter((item) => item.service === service.slug);
  const [date, setDate] = useState("");
  const [removed, setRemoved] = useState(false);
  const [docked, setDocked] = useState(false);
  const dialog = useRef(null);
  const dock = useRef(null);
  const started = useRef(false);
  const full = cart.items.length >= MAX_ITEMS;

  function openCheckout() {
    const box = dialog.current;
    if (!box || box.open) return;
    box.showModal();
    document.documentElement.style.overflow = "hidden";
    box.scrollTo({ top: 0 });
    // Tanpa tanggal, tamu mulai dari kalender tempat; selain itu dari kolom wajib yang masih kosong.
    requestAnimationFrame(() => {
      const target = date
        ? [...box.querySelectorAll("input[required]")].find((input) => !input.value)
        : box.querySelector("#checkout-dates [data-date]:not([disabled])");
      target?.focus();
    });
  }

  // Sekali setelah keranjang terbaca: harga terbaru dari /api/cart, tanggal terakhir yang dipilih, dan
  // ?add=<id> dari tautan lama /checkout/<id> (paketnya masuk keranjang lalu checkout terbuka).
  useEffect(() => {
    if (!cart.ready || started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const add = packages.find((pkg) => String(pkg.id) === params.get("add"));
    if (params.has("add")) window.history.replaceState(null, "", `${window.location.pathname}#packages`);
    const saved = items.find((item) => item.date)?.date;
    if (saved && bookable(dayState(slots, saved, range))) setDate(saved);
    const ids = cart.items.map((item) => item.packageId);
    const ready = ids.length
      ? fetch(`/api/cart?ids=${ids.join(",")}`, { cache: "no-store" })
          .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
          .then(({ packages: fresh }) => {
            const { cart: next, removed: gone } = refreshCart(cart.items, fresh);
            cart.replace(next);
            setRemoved(gone > 0);
          })
          .catch(() => {}) // tanpa koneksi: keranjang tetap tampil, server memeriksanya saat bayar
      : Promise.resolve();
    if (add)
      ready.then(() => {
        cart.replace((current) => addToCart(current, forCart(add)));
        requestAnimationFrame(openCheckout);
      });
  }, [cart]);

  // Bilah keranjang menempel di bawah layar sampai tempatnya di bawah paket terakhir terlihat utuh, lalu
  // berhenti di situ (docked) dan ikut tergulir bersama halaman. Dihitung dari posisi tempatnya setiap
  // kali halaman digulir atau ukurannya berubah, jadi lompatan langsung ke footer pun tepat.
  const hasItems = items.length > 0;
  useEffect(() => {
    if (!hasItems) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const box = dock.current?.getBoundingClientRect();
      if (box) setDocked(box.bottom <= window.innerHeight - BAR_GAP);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [hasItems]);

  function pickDate(day) {
    setDate(day);
    for (const item of items) cart.update(item.packageId, { date: day });
  }

  function book(pkg) {
    if (!items.some((item) => item.packageId === pkg.id)) cart.add(forCart(pkg));
    requestAnimationFrame(openCheckout);
  }

  const total = cartTotal(items);
  const count = items.length === 1 ? ct.countOne : format(ct.count, { count: items.length });

  return (
    <>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
        <div className="grid gap-4">
          {removed && <p className="rounded-input bg-sunrise-wash px-3 py-2 text-sm text-abyss">{ct.removed}</p>}
          <ul id="package-list" className="grid scroll-mt-28 gap-4">
            {packages.map((pkg) => {
              const line = cart.ready ? items.find((item) => item.packageId === pkg.id) : null;
              return (
                <li key={pkg.id}>
                  <article className="grid gap-5 rounded-card border border-mist bg-white p-5 transition-shadow duration-200 ease-brand hover:shadow-float sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6">
                    <div className="grid content-start gap-2">
                      <h3 className="text-xl leading-tight text-abyss">{pkg.name}</h3>
                      {pkg.summary && <p className="text-[15px] text-slate">{pkg.summary}</p>}
                      {pkg.includes.length > 0 && (
                        <ul className="mt-1 grid gap-1.5">
                          {pkg.includes.map((item) => (
                            <li key={item} className="grid grid-cols-[18px_1fr] items-start gap-2 text-sm text-slate">
                              <CheckIcon className="mt-0.5 size-4 text-teal" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-4 border-t border-mist pt-4 sm:grid sm:min-w-[220px] sm:content-between sm:justify-items-end sm:border-0 sm:pt-0 sm:text-right">
                      <div className="grid sm:justify-items-end">
                        <p className="flex items-baseline gap-1.5">
                          <Price idr={pkg.price} className="font-display text-2xl font-semibold text-abyss tabular-nums" />
                          <span className="text-sm text-slate">{pkg.unit === "group" ? t.perGroup : t.perPerson}</span>
                        </p>
                        <RupiahNote idr={pkg.price} className="text-xs text-slate tabular-nums" />
                        <p className="text-xs font-semibold text-slate">
                          {pkg.minGuests > 1 ? format(t.guestsRange, { min: pkg.minGuests, max: pkg.maxGuests }) : format(t.guestsUpTo, { max: pkg.maxGuests })}
                        </p>
                      </div>
                      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                        {line ? (
                          <div className="sm:w-36">
                            <GuestStepper
                              size="sm"
                              value={line.guests}
                              min={line.minGuests}
                              max={line.maxGuests}
                              onChange={(guests) => cart.update(pkg.id, { guests })}
                              onRemove={() => cart.remove(pkg.id)}
                              remove={format(ct.remove, { name: pkg.name })}
                              fewer={format(ct.fewer, { name: pkg.name })}
                              more={format(ct.more, { name: pkg.name })}
                            />
                            <p className="mt-1 text-center text-[11px] font-semibold text-slate">
                              {line.guests === 1 ? ct.guestsOne : format(ct.guests, { count: line.guests })}
                            </p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={full}
                            title={full ? format(ct.full, { max: MAX_ITEMS }) : undefined}
                            aria-label={format(ct.addLabel, { name: pkg.name })}
                            onClick={() => cart.add(forCart(pkg))}
                            className={`${OUTLINE} ${ROW_BUTTON}`}
                          >
                            <CartIcon className="size-[18px]" />
                            {t.addToCart}
                          </button>
                        )}
                        <button type="button" onClick={() => book(pkg)} disabled={!line && full} className={`${SOLID} ${ROW_BUTTON} self-start`}>
                          {t.book}
                        </button>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
          {hasItems && (
            // Bilah keranjang (acuan: Zanclus): tempatnya setinggi bilah tepat di bawah paket terakhir. Selama
            // tempat itu belum terlihat utuh, bilah menempel di bawah layar selebar kolom daftar paket.
            <div ref={dock} className="h-[60px]">
              <div className={docked ? "" : "pointer-events-none fixed inset-x-0 bottom-4 z-40"}>
                <div className={docked ? "" : "gutter mx-auto grid max-w-[1200px] lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10"}>
                  <div className="pointer-events-auto flex h-[60px] items-center gap-3 rounded-full bg-abyss p-2 text-white shadow-float sm:gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10">
                      <CartIcon className="size-5" />
                    </span>
                    <a href="#calendar" className="grid min-w-0 flex-1 leading-tight">
                      <strong className="truncate text-sm sm:text-base">
                        {ct.title} · {count}
                      </strong>
                      <span className="truncate text-xs text-on-dark-muted sm:text-sm">
                        {ct.total} <Price idr={total} className="tabular-nums" />
                      </span>
                    </a>
                    <button
                      type="button"
                      onClick={openCheckout}
                      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-5 font-bold text-teal transition-colors duration-200 ease-brand hover:bg-teal-wash"
                    >
                      {ct.checkout}
                      <ArrowIcon className="size-[18px] -rotate-45" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <SlotCalendar slots={slots} range={range} date={date} onSelect={pickDate} lang={lang} t={st} pool={pool} canCheckout={items.length > 0} onCheckout={openCheckout} />
      </div>

      <CheckoutDialog
        dialogRef={dialog}
        lang={lang}
        service={service}
        packages={packages}
        items={items}
        cart={cart}
        date={date}
        onDate={pickDate}
        slots={slots}
        range={range}
        payments={payments}
        text={text}
        ask={ask}
        email={email}
      />
    </>
  );
}
