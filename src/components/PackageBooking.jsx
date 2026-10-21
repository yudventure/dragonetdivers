"use client";

import { useRouter } from "next/navigation";
import { cartTotal, inCart, lineTotal } from "@/lib/cart";
import { MAX_ITEMS } from "@/lib/checkout";
import { format, localeHref } from "@/lib/i18n";
import { useCart } from "./cart";
import { Price, RupiahNote } from "./currency";
import GuestStepper from "./GuestStepper";
import { ArrowIcon, BagIcon, ChatIcon, CheckIcon, CloseIcon, PlusIcon } from "./icons";

// Warna dan bentuk tombol; jarak dalamnya ditentukan di tiap tempat (kartu paket atau sidebar).
const SOLID =
  "inline-flex h-11 items-center justify-center rounded-full bg-teal font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark disabled:bg-mist disabled:text-slate";
const OUTLINE =
  "inline-flex h-11 items-center justify-center rounded-full border-[1.5px] border-teal font-bold text-teal transition-colors duration-200 ease-brand hover:bg-teal-soft";
const PANEL_BUTTON = "gap-2 px-5";

// Tombol di kartu paket: di ponsel berdua selebar kartu, tanpa teks terlipat.
const ROW_BUTTON = "gap-1.5 whitespace-nowrap px-2 text-[15px] sm:px-5 sm:text-base";

/** Paket untuk keranjang: nama dua bahasa dan batas tamu (data lengkapnya diperiksa ulang saat checkout). */
const forCart = (pkg) => ({ id: pkg.id, service: pkg.service, name: pkg.names, price: pkg.price, unit: pkg.unit, minGuests: pkg.minGuests, maxGuests: pkg.maxGuests });

/**
 * Daftar paket satu layanan dengan tombol Tambah (ke keranjang) dan Pesan sekarang, dan sidebar rincian
 * pesanan di sampingnya (acuan: daftar paket DAMPIER). Keranjang berlaku untuk semua layanan
 * (src/components/cart.jsx); di ponsel rinciannya ada di bawah daftar dengan bilah ringkas di bawah layar.
 */
export default function PackageBooking({ lang, packages, t, cartText, checkoutText, serviceTitles, ask }) {
  const router = useRouter();
  const cart = useCart();
  const full = cart.items.length >= MAX_ITEMS;
  const checkout = () => router.push(localeHref(lang, "/checkout"));
  const book = (pkg) => {
    cart.add(forCart(pkg));
    checkout();
  };
  const cheapest = packages.reduce((low, pkg) => (!low || pkg.price < low.price ? pkg : low), null);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
      <ul className="grid gap-4">
        {packages.map((pkg) => {
          const added = cart.ready && inCart(cart.items, pkg.id);
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
                <div className="flex flex-wrap items-end justify-between gap-4 border-t border-mist pt-4 sm:grid sm:min-w-[210px] sm:content-between sm:justify-items-end sm:border-0 sm:pt-0 sm:text-right">
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
                    <button
                      type="button"
                      aria-pressed={added}
                      disabled={!added && full}
                      title={!added && full ? format(cartText.full, { max: MAX_ITEMS }) : undefined}
                      onClick={() => (added ? cart.remove(pkg.id) : cart.add(forCart(pkg)))}
                      className={`${OUTLINE} ${ROW_BUTTON} ${added ? "bg-teal-soft" : ""} disabled:border-mist disabled:text-slate`}
                    >
                      {added ? <CheckIcon className="size-[18px]" /> : <PlusIcon className="size-[18px]" />}
                      {added ? cartText.added : cartText.add}
                    </button>
                    <button type="button" onClick={() => book(pkg)} disabled={!added && full} className={`${SOLID} ${ROW_BUTTON}`}>
                      {t.book}
                    </button>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      <CartPanel lang={lang} cart={cart} cheapest={cheapest} t={t} cartText={cartText} checkoutText={checkoutText} serviceTitles={serviceTitles} ask={ask} onCheckout={checkout} />
    </div>
  );
}

function CartPanel({ lang, cart, cheapest, t, cartText, checkoutText, serviceTitles, ask, onCheckout }) {
  const { items } = cart;
  const total = cartTotal(items);
  const count = items.length === 1 ? cartText.countOne : format(cartText.count, { count: items.length });
  return (
    <>
      <aside id="booking" aria-label={cartText.title} className="grid scroll-mt-28 gap-4 rounded-card bg-white p-5 shadow-float ring-1 ring-mist sm:p-6 lg:sticky lg:top-28">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-xl text-abyss">
            <BagIcon className="size-5 text-teal" />
            {cartText.title}
          </h3>
          {items.length > 0 && <span className="rounded-full bg-teal-soft px-2.5 py-0.5 text-xs font-bold text-teal">{count}</span>}
        </div>

        {items.length === 0 ? (
          <div className="grid gap-2">
            {cheapest && (
              <p className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="text-sm text-slate">{cartText.from}</span>
                <Price idr={cheapest.price} className="font-display text-2xl font-semibold text-abyss tabular-nums" />
                <span className="text-sm text-slate">{cheapest.unit === "group" ? t.perGroup : t.perPerson}</span>
              </p>
            )}
            <p className="text-sm text-slate">{cartText.empty}</p>
          </div>
        ) : (
          <>
            <ul className="grid divide-y divide-mist">
              {items.map((item) => (
                <li key={item.packageId} className="grid gap-2.5 py-3 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid min-w-0 gap-0.5">
                      <p className="leading-snug font-semibold text-abyss">{item.name[lang] || item.name.en}</p>
                      <p className="text-xs text-slate">{serviceTitles[item.service] ?? item.service}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => cart.remove(item.packageId)}
                      aria-label={format(cartText.remove, { name: item.name[lang] || item.name.en })}
                      className="grid size-8 shrink-0 place-items-center rounded-full text-slate hover:bg-foam hover:text-danger"
                    >
                      <CloseIcon className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-32">
                      <GuestStepper
                        size="sm"
                        value={item.guests}
                        min={item.minGuests}
                        max={item.maxGuests}
                        onChange={(guests) => cart.update(item.packageId, { guests })}
                        fewer={checkoutText.fewer}
                        more={checkoutText.more}
                      />
                    </div>
                    <Price idr={lineTotal(item)} className="font-semibold text-abyss tabular-nums" />
                  </div>
                </li>
              ))}
            </ul>
            <div className="grid gap-1 border-t border-mist pt-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-abyss">{cartText.total}</span>
                <Price idr={total} className="font-display text-2xl font-semibold text-abyss tabular-nums" />
              </div>
              <RupiahNote idr={total} className="text-right text-xs text-slate tabular-nums" />
              <p className="text-xs text-slate">{cartText.dates}</p>
            </div>
          </>
        )}

        <button type="button" onClick={onCheckout} disabled={items.length === 0} className={`${SOLID} ${PANEL_BUTTON}`}>
          {cartText.book}
          <ArrowIcon className="size-[18px]" />
        </button>
        {ask && (
          <a href={ask} className={`${OUTLINE} ${PANEL_BUTTON} text-sm`}>
            <ChatIcon className="size-[18px]" />
            {cartText.ask}
          </a>
        )}
      </aside>

      {items.length > 0 && (
        <>
          {/* Ponsel dan tablet: ringkasan pesanan selalu terlihat di bawah layar. */}
          <div className="fixed inset-x-3 bottom-3 z-50 flex items-center gap-3 rounded-card bg-abyss p-2.5 pl-4 text-white shadow-float lg:hidden">
            <a href="#booking" className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate text-xs text-white/75">
                {count} · {cartText.view}
              </span>
              <Price idr={total} className="font-display text-lg font-semibold tabular-nums" />
            </a>
            <button type="button" onClick={onCheckout} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-white px-5 font-bold text-teal">
              {cartText.book}
              <ArrowIcon className="size-[18px]" />
            </button>
          </div>
          <div aria-hidden="true" className="h-16 lg:hidden" />
        </>
      )}
    </>
  );
}
