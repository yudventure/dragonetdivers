"use client";

import { useEffect, useRef, useState } from "react";
import { addToCart, cartTotal, lineTotal, refreshCart } from "@/lib/cart";
import { DIVE_SERVICES, paypalUsd } from "@/lib/checkout";
import { formatMoney } from "@/lib/currency";
import { format, intlLocale, localeHref } from "@/lib/i18n";
import { useCart } from "../cart";
import { useCurrency } from "../currency";
import GuestStepper from "../GuestStepper";
import { ArrowIcon, CheckIcon, CloseIcon } from "../icons";

const FIELD = "h-12 w-full rounded-input border border-line-strong bg-white px-3 text-abyss outline-none focus:border-teal focus:ring-3 focus:ring-lagoon/40";
const ITEM_FIELDS = ["date", "guests", "package"];

function Section({ title, children }) {
  return (
    <section className="grid gap-4 rounded-card bg-white p-5 ring-1 ring-mist sm:p-6">
      <h2 className="text-xl text-abyss">{title}</h2>
      {children}
    </section>
  );
}

function Label({ htmlFor, label, hint, children }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-abyss">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate">{hint}</p>}
    </div>
  );
}

// Checkout keranjang (/checkout): setiap paket punya tanggal dan jumlah tamunya sendiri, lalu data
// pemesan, cara bayar, dan ringkasan dengan total. Isi keranjang disegarkan dulu dari /api/cart (harga
// terbaru, paket yang tidak dijual lagi dibuang); ?add=<id> menambahkan satu paket (tautan lama
// /checkout/<id>). Total di sini hanya tampilan; server menghitung ulang (src/server/checkout.js).
export default function CartCheckout({ lang, t, cartText, unitText, serviceTitles, methods, rate, dueHours, range, email }) {
  const cart = useCart();
  const { currency } = useCurrency();
  const [synced, setSynced] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [method, setMethod] = useState(methods[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const started = useRef(false);

  useEffect(() => {
    if (!cart.ready || started.current) return;
    started.current = true;
    const add = new URLSearchParams(window.location.search).get("add");
    const extra = /^\d{1,9}$/.test(add ?? "") ? Number(add) : null;
    if (add !== null) window.history.replaceState(null, "", window.location.pathname);
    const ids = [...new Set([...cart.items.map((item) => item.packageId), ...(extra ? [extra] : [])])];
    if (!ids.length) return setSynced(true);
    fetch(`/api/cart?ids=${ids.join(",")}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then(({ packages }) => {
        let { cart: next, removed: gone } = refreshCart(cart.items, packages);
        const fresh = packages.find((pkg) => pkg.id === extra);
        if (fresh) next = addToCart(next, fresh);
        cart.replace(next);
        setRemoved(gone > 0 || Boolean(extra && !fresh));
      })
      .catch(() => {}) // tanpa koneksi ke server: keranjang tetap tampil, server memeriksanya saat bayar
      .finally(() => setSynced(true));
  }, [cart]);

  const items = cart.items;
  const total = cartTotal(items);
  const usd = rate ? paypalUsd(total, rate) : null;
  const money = (amount, code = "IDR") => formatMoney(amount, code, lang);
  const paypalText = usd ? formatMoney(Number(usd), "USD", lang, { cents: true }) : "–";
  const isDive = items.some((item) => DIVE_SERVICES.includes(item.service));
  const dayText = (date) =>
    date
      ? new Intl.DateTimeFormat(intlLocale[lang], { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))
      : "–";
  const nameOf = (item) => item.name[lang] || item.name.en;

  async function submit(event) {
    event.preventDefault();
    if (busy || !items.length) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/checkout?lang=${lang}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(form),
          items: items.map(({ packageId, guests, date }) => ({ packageId, guests, date })),
          method,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.redirectUrl) {
        throw Object.assign(new Error(result.message || format(t.errors.server, { email })), { field: result.error, index: result.index ?? null });
      }
      cart.clear();
      window.location.assign(result.redirectUrl);
    } catch (e) {
      setError({ field: e.field, index: e.index ?? null, message: e.message || format(t.errors.server, { email }) });
      setBusy(false);
      const target = ITEM_FIELDS.includes(e.field) && e.index !== null ? `checkout-${e.field === "package" ? "item" : e.field}-${e.index}` : `checkout-${e.field}`;
      document.getElementById(target)?.focus();
    }
  }

  const invalid = (field, index = null) => (error?.field === field && error.index === index ? { "aria-invalid": true, "aria-describedby": "checkout-error" } : {});

  if (!cart.ready || !synced) return <p className="rounded-card bg-white p-6 text-slate ring-1 ring-mist">{t.loading}</p>;

  if (!items.length) {
    return (
      <div className="grid justify-items-start gap-4 rounded-card bg-white p-6 ring-1 ring-mist sm:p-8">
        {removed && <p className="rounded-input bg-sunrise-wash px-3 py-2 text-sm text-abyss">{t.removed}</p>}
        <p className="font-display text-xl font-semibold text-abyss">{t.emptyCart}</p>
        <a href={localeHref(lang, "/#services")} className="inline-flex h-11 items-center gap-2 rounded-full bg-teal px-5 font-bold text-white hover:bg-teal-dark">
          {t.browse}
          <ArrowIcon className="size-[18px]" />
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[1fr_380px] lg:gap-10">
      <div className="grid gap-5">
        <Section title={t.trip}>
          {removed && <p className="rounded-input bg-sunrise-wash px-3 py-2 text-sm text-abyss">{t.removed}</p>}
          <ul className="grid gap-4">
            {items.map((item, index) => (
              <li
                key={item.packageId}
                id={`checkout-item-${index}`}
                tabIndex={-1}
                className={`grid gap-4 rounded-card p-4 ring-1 outline-none sm:p-5 ${error?.index === index ? "ring-2 ring-danger" : "ring-mist"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid gap-0.5">
                    <p className="text-xs font-semibold text-slate">{serviceTitles[item.service] ?? item.service}</p>
                    <p className="font-display text-lg leading-tight font-semibold text-abyss">{nameOf(item)}</p>
                    <p className="text-sm text-slate tabular-nums">
                      {item.unit === "group" ? `${money(item.price)} ${unitText.perGroup}` : format(t.unitLine, { price: money(item.price), guests: item.guests })} ·{" "}
                      <span className="font-semibold text-abyss">{money(lineTotal(item))}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cart.remove(item.packageId)}
                    aria-label={format(cartText.remove, { name: nameOf(item) })}
                    className="grid size-9 shrink-0 place-items-center rounded-full text-slate hover:bg-foam hover:text-danger"
                  >
                    <CloseIcon className="size-4" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Label htmlFor={`checkout-date-${index}`} label={t.date} hint={index === 0 ? t.dateHint : undefined}>
                    <input
                      id={`checkout-date-${index}`}
                      type="date"
                      required
                      min={range.min}
                      max={range.max}
                      value={item.date}
                      onChange={(e) => cart.update(item.packageId, { date: e.target.value })}
                      className={FIELD}
                      {...invalid("date", index)}
                    />
                  </Label>
                  <Label htmlFor={`checkout-guests-${index}`} label={t.guests}>
                    <GuestStepper
                      id={`checkout-guests-${index}`}
                      value={item.guests}
                      min={item.minGuests}
                      max={item.maxGuests}
                      onChange={(guests) => cart.update(item.packageId, { guests })}
                      fewer={t.fewer}
                      more={t.more}
                      invalid={error?.field === "guests" && error.index === index}
                    />
                  </Label>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t.details}>
          <Label htmlFor="checkout-name" label={t.name}>
            <input id="checkout-name" name="name" required minLength={2} maxLength={120} autoComplete="name" className={FIELD} {...invalid("name")} />
          </Label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label htmlFor="checkout-email" label={t.email}>
              <input id="checkout-email" name="email" type="email" required maxLength={190} autoComplete="email" className={FIELD} {...invalid("email")} />
            </Label>
            <Label htmlFor="checkout-whatsapp" label={t.whatsapp} hint={t.whatsappHint}>
              <input
                id="checkout-whatsapp"
                name="whatsapp"
                type="tel"
                required
                maxLength={32}
                autoComplete="tel"
                inputMode="tel"
                placeholder="+62"
                className={FIELD}
                {...invalid("whatsapp")}
              />
            </Label>
          </div>
          {isDive && (
            <Label htmlFor="checkout-certification" label={t.certification}>
              <select id="checkout-certification" name="certification" defaultValue="" className={FIELD}>
                <option value="" disabled>
                  {t.certifications.choose}
                </option>
                {Object.entries(t.certifications)
                  .filter(([key]) => key !== "choose")
                  .map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
              </select>
            </Label>
          )}
          <Label htmlFor="checkout-notes" label={t.notes}>
            <textarea
              id="checkout-notes"
              name="notes"
              rows={3}
              maxLength={1000}
              placeholder={t.notesHint}
              className="w-full rounded-input border border-line-strong bg-white px-3 py-2.5 text-abyss outline-none focus:border-teal focus:ring-3 focus:ring-lagoon/40"
              {...invalid("notes")}
            />
          </Label>
          {/* Kolom jebakan untuk bot; manusia tidak melihatnya. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
        </Section>

        <Section title={t.payment}>
          {methods.length === 0 ? (
            <p className="rounded-input bg-sunrise-wash p-4 text-sm text-abyss">{format(t.noMethods, { email })}</p>
          ) : (
            <div role="radiogroup" aria-label={t.payment} className="grid gap-3" id="checkout-method" tabIndex={-1}>
              {methods.map(({ id, sandbox }) => {
                const info = t.methods[id];
                const checked = method === id;
                return (
                  <label
                    key={id}
                    className={`flex cursor-pointer gap-3 rounded-card p-4 ring-1 transition-colors duration-200 ease-brand ${
                      checked ? "bg-teal-wash ring-2 ring-teal" : "bg-white ring-mist hover:ring-line-strong"
                    }`}
                  >
                    <input type="radio" name="method" value={id} checked={checked} onChange={() => setMethod(id)} className="mt-1 size-4 accent-teal" />
                    <span className="grid gap-0.5">
                      <span className="flex flex-wrap items-center gap-2 font-semibold text-abyss">
                        {info.title}
                        {sandbox && <span className="rounded-full bg-sunrise-wash px-2 py-0.5 text-[10px] font-bold tracking-wide text-ember uppercase">{t.sandbox}</span>}
                      </span>
                      <span className="text-sm text-slate">{format(info.text, { usd: paypalText, hours: dueHours })}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      <aside className="grid gap-4 rounded-card bg-white p-5 shadow-float ring-1 ring-mist sm:p-6 lg:sticky lg:top-24">
        <p className="text-xs font-bold tracking-[0.14em] text-ember uppercase">{t.summary}</p>
        <ul className="grid gap-3">
          {items.map((item) => (
            <li key={item.packageId} className="flex justify-between gap-3 text-sm">
              <span className="grid gap-0.5">
                <span className="leading-snug font-semibold text-abyss">{nameOf(item)}</span>
                <span className="text-slate">
                  {dayText(item.date)} · {item.unit === "group" ? unitText.perGroup : format(t.unitLine, { price: money(item.price), guests: item.guests })}
                </span>
              </span>
              <span className="font-semibold text-abyss tabular-nums">{money(lineTotal(item))}</span>
            </li>
          ))}
        </ul>
        <div className="grid gap-1 border-t border-mist pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-semibold text-abyss">{t.total}</span>
            <span className="font-display text-2xl font-semibold text-abyss tabular-nums">{money(total)}</span>
          </div>
          {usd && (method === "paypal" || currency === "USD") && (
            <p className="text-right text-xs text-slate">{method === "paypal" ? `PayPal · ${paypalText}` : format(t.usdEstimate, { usd: money(Number(usd), "USD") })}</p>
          )}
        </div>
        {error && (
          <p id="checkout-error" role="alert" className="rounded-input bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
            {error.index !== null && items[error.index] ? `${nameOf(items[error.index])} · ` : ""}
            {error.message}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || methods.length === 0}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-teal px-6 font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark disabled:bg-mist disabled:text-slate"
        >
          {busy ? t.working : method === "transfer" ? t.placeOrder : format(t.pay, { amount: method === "paypal" && usd ? paypalText : money(total) })}
          {!busy && <ArrowIcon className="size-[18px]" />}
        </button>
        <p className="flex gap-2 text-xs text-slate">
          <CheckIcon className="mt-px size-4 shrink-0 text-teal" />
          {t.secure}
        </p>
      </aside>
    </form>
  );
}
