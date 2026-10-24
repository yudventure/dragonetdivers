"use client";

import { useState } from "react";
import { cartTotal, lineTotal } from "@/lib/cart";
import { DIVE_SERVICES, MANUAL_METHODS, MAX_ITEMS, paypalUsd } from "@/lib/checkout";
import { formatMoney } from "@/lib/currency";
import { format } from "@/lib/i18n";
import { bookable, dayState, partySize, placesLeft } from "@/lib/slots";
import { CopyButton } from "../checkout/OrderActions";
import { useCurrency } from "../currency";
import GuestStepper from "../GuestStepper";
import { ArrowIcon, ChatIcon, CheckIcon, CloseIcon } from "../icons";
import PhoneField from "./PhoneField";
import { longDate, SlotMonth } from "./SlotCalendar";

const FIELD = "h-12 w-full rounded-input border border-line-strong bg-white px-3 text-abyss outline-none focus:border-teal focus:ring-3 focus:ring-lagoon/40";
const SOLID =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-teal px-6 font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark disabled:bg-mist disabled:text-slate";
const CONTACT = ["name", "email", "whatsapp", "certification", "notes"];
const BLANK = { name: "", email: "", whatsapp: "", certification: "", notes: "", website: "" };

function Field({ id, label, required, hint, children }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-abyss">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {children}
      {hint && <p className="text-xs text-slate">{hint}</p>}
    </div>
  );
}

function Block({ id, title, children }) {
  return (
    <section id={id} tabIndex={-1} aria-labelledby={`${id}-title`} className="grid gap-4 rounded-card p-4 ring-1 ring-mist outline-none sm:p-5">
      <h3 id={`${id}-title`} className="text-lg text-abyss">
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * Jendela checkout di halaman layanan (acuan: checkout Zanclus). Langkah 1: paket di keranjang dengan jumlah tamu,
 * tanggal dari kalender tempat, dan data pemesan. Langkah 2: ringkasan, cara bayar, lalu bayar. Semua paket
 * memakai satu tanggal; server memeriksa ulang harga, tanggal tutup, dan kapasitas (src/server/checkout.js).
 */
export default function CheckoutDialog({ dialogRef, lang, service, packages, items, cart, date, onDate, slots, range, payments, text, ask, email }) {
  const { checkout: t, slots: st, cart: ct, packages: pt } = text;
  const { currency } = useCurrency();
  const [step, setStep] = useState("form");
  const [fields, setFields] = useState(BLANK);
  const [method, setMethod] = useState(payments.methods[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const total = cartTotal(items);
  const usd = payments.rate ? paypalUsd(total, payments.rate) : null;
  const money = (amount, code = "IDR") => formatMoney(amount, code, lang);
  const paypalText = usd ? formatMoney(Number(usd), "USD", lang, { cents: true }) : "–";
  const capacity = slots?.capacity ?? 0;
  const left = date ? placesLeft(slots, date) : null;
  const party = partySize(items);
  const isDive = DIVE_SERVICES.includes(service.slug);
  const nameOf = (item) => item.name[lang] || item.name.en;
  const others = packages.filter((pkg) => !items.some((item) => item.packageId === pkg.id));
  const people = (count) => (count === 1 ? t.peopleOne : format(t.people, { count }));

  const change = (key, value) => {
    setFields((current) => ({ ...current, [key]: value }));
    setError(null);
  };
  const invalid = (field) => (error?.field === field ? { "aria-invalid": true, "aria-describedby": "checkout-error" } : {});
  const focus = (id) => requestAnimationFrame(() => document.getElementById(id)?.focus());
  const fail = (field, message, target) => {
    setError({ field, message });
    focus(target ?? `checkout-${field}`);
  };

  function toSummary(event) {
    event.preventDefault();
    if (!items.length) return fail("empty", t.errors.empty, "checkout-packages");
    if (!date || !bookable(dayState(slots, date, range))) return fail("date", t.errors.pickDate, "checkout-dates");
    if (left !== null && party > left) return fail("date", left === 1 ? st.tooFewOne : format(st.tooFew, { left }), "checkout-dates");
    if (!event.currentTarget.reportValidity()) return;
    setError(null);
    setStep("summary");
    dialogRef.current?.scrollTo({ top: 0 });
    focus("checkout-summary");
  }

  async function pay() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/checkout?lang=${lang}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, items: items.map(({ packageId, guests }) => ({ packageId, guests, date })), method }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.redirectUrl) {
        throw Object.assign(new Error(result.message || format(t.errors.server, { email })), { field: result.error });
      }
      for (const item of items) cart.remove(item.packageId);
      window.location.assign(result.redirectUrl);
    } catch (e) {
      setBusy(false);
      const message = e.message || format(t.errors.server, { email });
      // Kesalahan isian kembali ke langkah 1 di kolomnya; kesalahan bayar tetap di ringkasan.
      if (CONTACT.includes(e.field)) {
        setStep("form");
        fail(e.field, message);
      } else if (e.field === "date") {
        setStep("form");
        fail("date", message, "checkout-dates");
      } else if (["package", "guests", "empty"].includes(e.field)) {
        setStep("form");
        fail(e.field, message, "checkout-packages");
      } else setError({ field: e.field ?? "server", message });
    }
  }

  function close() {
    if (busy) return;
    dialogRef.current?.close();
  }

  const errorBox = error && (
    <p id="checkout-error" role="alert" className="rounded-input bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
      {error.message}
    </p>
  );
  // Ditagih dalam rupiah; PayPal dalam dolar dengan kurs hari ini, selain itu dolar hanya perkiraan.
  const usdLine = !usd
    ? null
    : step === "summary" && method === "paypal"
      ? `PayPal · ${paypalText}`
      : currency === "USD"
        ? format(t.usdEstimate, { usd: money(Number(usd), "USD") })
        : null;
  const totalRow = (
    <div className="grid gap-0.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold text-abyss">{t.total}</span>
        <span className="font-display text-2xl font-semibold text-abyss tabular-nums">{money(total)}</span>
      </div>
      {usdLine && <p className="text-right text-xs text-slate">{usdLine}</p>}
    </div>
  );

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="checkout-title"
      onClose={() => {
        setStep("form");
        setError(null);
        document.documentElement.style.overflow = "";
      }}
      onCancel={(event) => busy && event.preventDefault()}
      onClick={(event) => event.target === event.currentTarget && close()}
      className="m-0 h-dvh max-h-none w-full max-w-none overflow-y-auto overscroll-contain bg-white p-0 text-abyss backdrop:bg-abyss/60 sm:m-auto sm:h-auto sm:max-h-[92dvh] sm:w-[calc(100%-2rem)] sm:max-w-[760px] sm:rounded-card sm:shadow-float"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-mist bg-white/95 px-5 py-3 backdrop-blur sm:px-8">
        <p className="text-xs font-bold tracking-[0.14em] text-ember uppercase">{t.kicker}</p>
        <button type="button" onClick={close} aria-label={t.close} className="grid size-10 place-items-center rounded-full text-slate hover:bg-foam hover:text-abyss">
          <CloseIcon className="size-5" />
        </button>
      </div>

      <div className="grid gap-6 px-5 pt-5 pb-8 sm:px-8 sm:pt-6">
        <div className="grid gap-4">
          <h2 id="checkout-title" className="text-[1.75rem] leading-tight text-abyss sm:text-[2rem]">
            {t.title}
          </h2>
          <ol aria-label={t.stepsLabel} className="flex flex-wrap gap-2">
            {t.steps.map((name, index) => {
              const current = (step === "form" ? 0 : 1) === index;
              const done = step === "summary" && index === 0;
              return (
                <li
                  key={name}
                  aria-current={current ? "step" : undefined}
                  className={`flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-sm font-semibold ${current ? "bg-teal-wash text-teal" : "text-slate"}`}
                >
                  <span className={`grid size-6 place-items-center rounded-full text-xs font-bold ${current || done ? "bg-teal text-white" : "bg-mist text-slate"}`}>
                    {done ? <CheckIcon className="size-3.5" /> : index + 1}
                  </span>
                  {name}
                </li>
              );
            })}
          </ol>
        </div>

        {step === "form" ? (
          <form onSubmit={toSummary} className="grid gap-5">
            <Block id="checkout-packages" title={t.packages}>
              {items.length ? (
                <ul className="grid gap-2.5">
                  {items.map((item) => (
                    <li key={item.packageId} className="grid gap-3 rounded-input bg-foam p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="grid min-w-0 gap-0.5">
                        <p className="leading-snug font-semibold text-abyss">{nameOf(item)}</p>
                        <p className="text-xs text-slate tabular-nums">
                          {money(item.price)} {item.unit === "group" ? pt.perGroup : pt.perPerson} ·{" "}
                          <span className="font-semibold text-abyss">{money(lineTotal(item))}</span>
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <span className="text-xs font-semibold text-slate sm:hidden">{t.guests}</span>
                        <div className="w-32">
                          <GuestStepper
                            size="sm"
                            value={item.guests}
                            min={item.minGuests}
                            max={item.maxGuests}
                            onChange={(guests) => {
                              cart.update(item.packageId, { guests });
                              setError(null);
                            }}
                            onRemove={() => cart.remove(item.packageId)}
                            remove={format(ct.remove, { name: nameOf(item) })}
                            fewer={format(ct.fewer, { name: nameOf(item) })}
                            more={format(ct.more, { name: nameOf(item) })}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-input bg-foam px-3 py-2.5 text-sm text-slate">{ct.empty}</p>
              )}
              {others.length > 0 && items.length < MAX_ITEMS && (
                <select
                  aria-label={ct.addPackage}
                  value=""
                  onChange={(event) => {
                    const pkg = packages.find((p) => String(p.id) === event.target.value);
                    if (pkg) cart.add({ ...pkg, name: pkg.names });
                    setError(null);
                  }}
                  className={`${FIELD} text-sm`}
                >
                  <option value="">+ {ct.addPackage}</option>
                  {others.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} · {money(pkg.price)} {pkg.unit === "group" ? pt.perGroup : pt.perPerson}
                    </option>
                  ))}
                </select>
              )}
              {items.length > 0 && <div className="border-t border-mist pt-3">{totalRow}</div>}
            </Block>

            <Block id="checkout-dates" title={`${st.datesTitle} *`}>
              <p className="-mt-2 text-sm text-slate">{capacity ? format(st.datesIntro, { capacity }) : st.intro}</p>
              <SlotMonth
                slots={slots}
                range={range}
                date={date}
                onSelect={(day) => {
                  onDate(day);
                  setError(null);
                }}
                lang={lang}
                t={st}
                compact
              />
              <p aria-live="polite" className={`rounded-input px-3 py-2 text-sm font-semibold ${date ? "bg-teal-wash text-teal" : "bg-foam text-slate"}`}>
                {!date
                  ? st.pickDate
                  : left === null
                    ? format(st.picked, { date: longDate(date, lang) })
                    : format(st.pickedLeft, { date: longDate(date, lang), left, capacity })}
              </p>
            </Block>

            <Block id="checkout-details" title={t.details}>
              <Field id="checkout-name" label={t.name} required>
                <input
                  id="checkout-name"
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  value={fields.name}
                  onChange={(e) => change("name", e.target.value)}
                  className={FIELD}
                  {...invalid("name")}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="checkout-whatsapp" label={t.whatsapp} required hint={t.whatsappHint}>
                  <PhoneField
                    id="checkout-whatsapp"
                    lang={lang}
                    value={fields.whatsapp}
                    onChange={(value) => change("whatsapp", value)}
                    t={t.phone}
                    invalid={invalid("whatsapp")}
                  />
                </Field>
                <Field id="checkout-email" label={t.email} required>
                  <input
                    id="checkout-email"
                    type="email"
                    required
                    maxLength={190}
                    autoComplete="email"
                    value={fields.email}
                    onChange={(e) => change("email", e.target.value)}
                    className={FIELD}
                    {...invalid("email")}
                  />
                </Field>
              </div>
              {isDive && (
                <Field id="checkout-certification" label={t.certification}>
                  <select
                    id="checkout-certification"
                    value={fields.certification}
                    onChange={(e) => change("certification", e.target.value)}
                    className={FIELD}
                    {...invalid("certification")}
                  >
                    <option value="">{t.certifications.choose}</option>
                    {Object.entries(t.certifications)
                      .filter(([key]) => key !== "choose")
                      .map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                  </select>
                </Field>
              )}
              <Field id="checkout-notes" label={t.notes}>
                <textarea
                  id="checkout-notes"
                  rows={3}
                  maxLength={1000}
                  placeholder={t.notesHint}
                  value={fields.notes}
                  onChange={(e) => change("notes", e.target.value)}
                  className="w-full rounded-input border border-line-strong bg-white px-3 py-2.5 text-abyss outline-none focus:border-teal focus:ring-3 focus:ring-lagoon/40"
                  {...invalid("notes")}
                />
              </Field>
              {/* Kolom jebakan untuk bot; manusia tidak melihatnya. */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={fields.website} onChange={(e) => change("website", e.target.value)} />
              <p className="text-xs text-slate">{t.requiredNote}</p>
            </Block>

            {errorBox}
            <button type="submit" className={SOLID}>
              {t.next}
              <ArrowIcon className="size-[18px]" />
            </button>
          </form>
        ) : (
          <section id="checkout-summary" tabIndex={-1} aria-labelledby="checkout-summary-title" className="grid gap-5 outline-none">
            <h3 id="checkout-summary-title" className="text-xl text-abyss">
              {t.summaryTitle}
            </h3>
            <dl className="grid divide-y divide-mist rounded-card ring-1 ring-mist">
              {[
                [t.activity, service.title],
                [t.packages, items.map((item) => `${nameOf(item)} × ${item.guests === 1 ? ct.guestsOne : format(ct.guests, { count: item.guests })}`).join("\n")],
                [t.date, longDate(date, lang)],
                [t.guests, people(party)],
                [t.name, fields.name.trim()],
                [t.whatsapp, fields.whatsapp.trim()],
                [t.email, fields.email.trim()],
                ...(isDive && fields.certification ? [[t.certification, t.certifications[fields.certification]]] : []),
                ...(fields.notes.trim() ? [[t.notes, fields.notes.trim()]] : []),
              ].map(([term, value]) => (
                <div key={term} className="grid gap-0.5 px-4 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
                  <dt className="text-sm text-slate">{term}</dt>
                  <dd className="text-sm font-semibold break-words whitespace-pre-line text-abyss">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="rounded-card bg-foam p-4">{totalRow}</div>

            <div className="grid gap-3">
              <h4 className="font-semibold text-abyss">{t.payment}</h4>
              {payments.methods.length === 0 ? (
                <p className="rounded-input bg-sunrise-wash p-4 text-sm text-abyss">{format(t.noMethods, { email })}</p>
              ) : (
                <div role="radiogroup" aria-label={t.payment} className="grid gap-3">
                  {payments.methods.map(({ id, sandbox }) => {
                    const info = t.methods[id];
                    const checked = method === id;
                    return (
                      <div
                        key={id}
                        data-method={id}
                        className={`grid rounded-card ring-1 transition-colors duration-200 ease-brand ${
                          checked ? "bg-teal-wash ring-2 ring-teal" : "bg-white ring-mist hover:ring-line-strong"
                        }`}
                      >
                        <label className="flex cursor-pointer gap-3 p-4">
                          <input type="radio" name="method" value={id} checked={checked} onChange={() => setMethod(id)} disabled={busy} className="mt-1 size-4 accent-teal" />
                          <span className="grid gap-0.5">
                            <span className="flex flex-wrap items-center gap-2 font-semibold text-abyss">
                              {info.title}
                              {sandbox && <span className="rounded-full bg-sunrise-wash px-2 py-0.5 text-[10px] font-bold tracking-wide text-ember uppercase">{t.sandbox}</span>}
                            </span>
                            <span className="text-sm text-slate">{format(info.text, { usd: paypalText, hours: payments.dueHours })}</span>
                          </span>
                        </label>
                        {/* Transfer: rekening langsung terlihat begitu dipilih. Tunai: jumlah yang perlu disiapkan. */}
                        {checked && id === "transfer" && payments.accounts?.length > 0 && (
                          <div className="grid gap-2 px-4 pb-4 sm:pl-11">
                            <p className="text-xs font-bold tracking-[0.12em] text-slate uppercase">{t.transferTo}</p>
                            <ul className="grid gap-2">
                              {payments.accounts.map((account) => (
                                <li key={account.number} className="flex flex-wrap items-center justify-between gap-3 rounded-input bg-white p-3 ring-1 ring-mist">
                                  <span className="grid gap-0.5">
                                    <span className="text-xs font-bold tracking-[0.12em] text-slate uppercase">
                                      {t.bank} {account.bank}
                                    </span>
                                    <span className="font-display text-lg font-semibold text-abyss tabular-nums">{account.number}</span>
                                    <span className="text-sm text-slate">
                                      {t.accountHolder} <span className="font-semibold text-abyss">{account.holder}</span>
                                    </span>
                                  </span>
                                  <CopyButton value={account.number} label={t.copy} done={t.copied} />
                                </li>
                              ))}
                            </ul>
                            <p className="text-sm text-slate">{t.transferNote}</p>
                          </div>
                        )}
                        {checked && id === "cash" && <p className="px-4 pb-4 text-sm font-semibold text-abyss sm:pl-11">{format(t.cashNote, { amount: money(total) })}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {errorBox}
            <button type="button" onClick={pay} disabled={busy || payments.methods.length === 0} className={SOLID}>
              {busy ? (MANUAL_METHODS.includes(method) ? t.saving : t.working) : MANUAL_METHODS.includes(method) ? t.placeOrder : format(t.pay, { amount: method === "paypal" && usd ? paypalText : money(total) })}
              {!busy && <ArrowIcon className={`size-[18px] ${MANUAL_METHODS.includes(method) ? "" : "-rotate-45"}`} />}
            </button>
            {payments.methods.some(({ id }) => !MANUAL_METHODS.includes(id)) && (
              <p className="flex gap-2 text-xs text-slate">
                <CheckIcon className="mt-px size-4 shrink-0 text-teal" />
                {t.secure}
              </p>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStep("form");
                setError(null);
              }}
              className="justify-self-start text-sm font-semibold text-teal hover:underline disabled:text-slate"
            >
              ← {t.edit}
            </button>
          </section>
        )}

        {ask && (
          <a href={ask} target="_blank" rel="noopener" className="flex items-center gap-2 border-t border-mist pt-4 text-sm font-semibold text-teal hover:underline">
            <ChatIcon className="size-[18px] shrink-0" />
            {t.askFirst} ↗
          </a>
        )}
      </div>
    </dialog>
  );
}
