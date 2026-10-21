"use client";

import { useState } from "react";
import { orderTotal, paypalUsd } from "@/lib/checkout";
import { formatMoney } from "@/lib/currency";
import { format, intlLocale } from "@/lib/i18n";
import { useCurrency } from "../currency";
import { ArrowIcon, CheckIcon } from "../icons";

const FIELD = "h-12 w-full rounded-input border border-line-strong bg-white px-3 text-abyss outline-none focus:border-teal focus:ring-3 focus:ring-lagoon/40";

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

// Formulir checkout paket: tanggal dan jumlah tamu, data pemesan, cara bayar, dan ringkasan dengan
// total. Total di sini hanya tampilan; server menghitung ulang dari paket di database
// (src/server/checkout.js). Berhasil → tamu dibawa ke Midtrans, PayPal, atau halaman pesanannya.
export default function CheckoutForm({ lang, t, pkg, serviceTitle, methods, rate, dueHours, range, isDive, email }) {
  const { currency } = useCurrency();
  const [guests, setGuests] = useState(pkg.minGuests);
  const [date, setDate] = useState("");
  const [method, setMethod] = useState(methods[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const total = orderTotal(pkg, guests);
  const usd = rate ? paypalUsd(total, rate) : null;
  const money = (amount, code = "IDR") => formatMoney(amount, code, lang);
  const paypalText = usd ? formatMoney(Number(usd), "USD", lang, { cents: true }) : "–";
  const dateText = date
    ? new Intl.DateTimeFormat(intlLocale[lang], { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`))
    : "–";

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/checkout?lang=${lang}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(form), packageId: pkg.id, guests, method }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.redirectUrl) throw Object.assign(new Error(result.message || format(t.errors.server, { email })), { field: result.error });
      window.location.assign(result.redirectUrl);
    } catch (e) {
      setError({ field: e.field, message: e.message || format(t.errors.server, { email }) });
      setBusy(false);
      document.getElementById(`checkout-${e.field}`)?.focus();
    }
  }

  const invalid = (field) => (error?.field === field ? { "aria-invalid": true, "aria-describedby": "checkout-error" } : {});

  return (
    <form onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[1fr_380px] lg:gap-10">
      <div className="grid gap-5">
        <Section title={t.trip}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Label htmlFor="checkout-date" label={t.date} hint={t.dateHint}>
              <input
                id="checkout-date"
                name="date"
                type="date"
                required
                min={range.min}
                max={range.max}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={FIELD}
                {...invalid("date")}
              />
            </Label>
            <Label htmlFor="checkout-guests" label={t.guests}>
              <div className="flex h-12 items-center rounded-input border border-line-strong bg-white">
                <button
                  type="button"
                  onClick={() => setGuests((n) => Math.max(pkg.minGuests, n - 1))}
                  disabled={guests <= pkg.minGuests}
                  aria-label={t.fewer}
                  className="grid h-full w-12 place-items-center text-xl font-bold text-teal disabled:text-mist"
                >
                  −
                </button>
                <output id="checkout-guests" aria-live="polite" className="flex-1 text-center font-semibold text-abyss tabular-nums" {...invalid("guests")}>
                  {guests}
                </output>
                <button
                  type="button"
                  onClick={() => setGuests((n) => Math.min(pkg.maxGuests, n + 1))}
                  disabled={guests >= pkg.maxGuests}
                  aria-label={t.more}
                  className="grid h-full w-12 place-items-center text-xl font-bold text-teal disabled:text-mist"
                >
                  +
                </button>
              </div>
            </Label>
          </div>
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
        <div className="grid gap-1">
          <p className="text-sm text-slate">{serviceTitle}</p>
          <p className="font-display text-xl leading-tight font-semibold text-abyss">{pkg.name}</p>
          <p className="text-sm text-slate">{dateText}</p>
        </div>
        <dl className="grid gap-2 border-t border-mist pt-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-slate">{pkg.unit === "group" ? `${pkg.name}` : format(t.unitLine, { price: money(pkg.price), guests })}</dt>
            <dd className="font-semibold text-abyss tabular-nums">{money(total)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-t border-mist pt-3">
            <dt className="font-semibold text-abyss">{t.total}</dt>
            <dd className="font-display text-2xl font-semibold text-abyss tabular-nums">{money(total)}</dd>
          </div>
          {usd && (method === "paypal" || currency === "USD") && (
            <p className="text-right text-xs text-slate">
              {method === "paypal" ? `PayPal · ${paypalText}` : format(t.usdEstimate, { usd: money(Number(usd), "USD") })}
            </p>
          )}
        </dl>
        {error && (
          <p id="checkout-error" role="alert" className="rounded-input bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
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
