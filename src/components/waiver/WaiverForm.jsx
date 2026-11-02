"use client";

import { useMemo, useRef, useState } from "react";
import { addDays } from "@/lib/date-picker";
import { format } from "@/lib/i18n";
import { ageOn, boxItems, cleanWaiver, MEDICAL, medicalQuestions, needsClearance, WaiverError } from "@/lib/waiver";
import { CheckIcon, ChatIcon } from "../icons";
import DatePicker from "../DatePicker";
import SignaturePad from "./SignaturePad";

const FIELD = "h-12 w-full rounded-input border border-line-strong bg-white px-3 text-abyss outline-none focus:border-teal focus:ring-3 focus:ring-lagoon/40";
const SOLID =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full bg-teal px-6 font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark disabled:bg-mist disabled:text-slate";
const OUTLINE =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full border-[1.5px] border-teal px-6 font-bold text-teal transition-colors duration-200 ease-brand hover:bg-teal-soft";
const CARD = "grid gap-5 rounded-card bg-white p-5 ring-1 ring-mist sm:p-7";

const BLANK = {
  fullName: "",
  birthDate: "",
  address: "",
  nationality: "",
  emergency: "",
  email: "",
  phone: "",
  room: "",
  certAgency: "",
  certLevel: "",
  certNumber: "",
  lastDive: "",
  loggedDives: "",
  insurance: "",
  insurer: "",
  guardian: "",
  confirmName: "",
};

function Field({ id, label, required, optional, hint, error, children }) {
  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-abyss">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {" "}
            *
          </span>
        )}
        {optional && <span className="font-normal text-slate"> ({optional})</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function Section({ id, title, children }) {
  return (
    <section aria-labelledby={id} className={CARD}>
      <h2 id={id} className="text-xs font-bold tracking-[0.14em] text-teal uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Pilihan Ya / Tidak berbentuk dua tombol (radio). */
function YesNo({ id, value, onChange, t, invalid }) {
  const option = (answer, label) => (
    <button
      type="button"
      role="radio"
      aria-checked={value === answer}
      onClick={() => onChange(answer)}
      className={`h-11 rounded-input font-bold transition-colors duration-200 ease-brand ${
        value === answer
          ? answer
            ? "bg-sunrise-wash text-ember ring-2 ring-ember"
            : "bg-teal text-white ring-1 ring-teal"
          : `bg-white text-abyss ring-1 hover:bg-foam ${invalid ? "ring-danger" : "ring-line-strong"}`
      }`}
    >
      {label}
    </button>
  );
  return (
    <div id={id} role="radiogroup" tabIndex={-1} className="grid grid-cols-2 gap-2 outline-none">
      {option(true, t.yes)}
      {option(false, t.no)}
    </div>
  );
}

/** Teks perjanjian sebagai paragraf dan judul (blok dari agreementBlocks di server). */
function Agreement({ blocks }) {
  return blocks.map((block, i) =>
    block.heading ? (
      <h3 key={i} className="pt-2 text-base font-semibold text-teal-dark">
        {block.text}
      </h3>
    ) : (
      <p key={i} className="text-sm leading-relaxed text-abyss">
        {block.text}
      </p>
    ),
  );
}

/**
 * Formulir selam (/waiver): perjanjian, data diri, profil penyelam, kuesioner medis dengan kotak lanjutan, dan
 * tanda tangan. Diperiksa dulu di peramban dengan cleanWaiver yang sama dengan server (src/lib/waiver.js), lalu
 * dikirim ke /api/waiver. t = ui.waiver bahasa halaman; enMedical = teks medis English (selain di halaman
 * English) yang tampil kecil di bawah tiap pertanyaan.
 */
export default function WaiverForm({ lang, t, dateText, enMedical, agreement, order, today, contact }) {
  const [values, setValues] = useState(BLANK);
  const [date, setDate] = useState(order?.date || today);
  const [notCertified, setNotCertified] = useState(false);
  const [medical, setMedical] = useState({});
  const [declaration, setDeclaration] = useState(false);
  const [agree, setAgree] = useState(false);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState(null); // { field, message }
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [round, setRound] = useState(0);
  const top = useRef(null);

  const age = ageOn(values.birthDate, today);
  const minor = age !== null && age < 18;
  const questions = medicalQuestions(medical);
  const answeredAll = questions.every((id) => typeof medical[id] === "boolean");
  const clearance = needsClearance(medical);
  const fieldError = (name) => (error?.field === name ? error.message : null);
  const invalid = (name) => (error?.field === name ? { "aria-invalid": true, "aria-describedby": `waiver-${name}-error` } : {});

  // Kolom tanggal (DatePicker) mengirim teks YYYY-MM-DD, bukan kejadian input.
  const setValue = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    if (error?.field === name) setError(null);
  };
  const year = Number(today.slice(0, 4));
  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (error?.field === name) setError(null);
  };
  const answer = (id, value) => {
    setMedical((m) => ({ ...m, [id]: value }));
    if (error?.field?.startsWith("medical")) setError(null);
  };

  const messageFor = (field) => {
    const base = field.split(".")[0];
    return format(t.errors[base] ?? t.errors.server, { email: contact.email });
  };
  const show = (field, message = messageFor(field)) => {
    setError({ field, message });
    const target = field.startsWith("medical.") ? `medical-${field.slice(8)}` : `waiver-${field}`;
    requestAnimationFrame(() => {
      const el = document.getElementById(target);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus?.({ preventScroll: true });
    });
  };

  const input = useMemo(
    () => ({
      ...values,
      date,
      certified: !notCertified,
      medical,
      declaration,
      signature,
      agree,
      order: order?.code ?? "",
    }),
    [values, date, notCertified, medical, declaration, signature, agree, order],
  );

  async function submit(e) {
    e.preventDefault();
    try {
      cleanWaiver(input, { today, agreement: true });
    } catch (err) {
      if (err instanceof WaiverError) return show(err.field);
      throw err;
    }
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/waiver?lang=${lang}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, token: order?.token ?? "" }),
    }).catch(() => null);
    const result = await response?.json().catch(() => ({}));
    setBusy(false);
    if (!response?.ok) return show(result?.error && result.error !== "server" ? result.error : "server", result?.message);
    setDone(result);
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function another() {
    setValues(BLANK);
    setNotCertified(false);
    setMedical({});
    setDeclaration(false);
    setAgree(false);
    setSignature("");
    setError(null);
    setDone(null);
    setRound((n) => n + 1);
    requestAnimationFrame(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  if (done) {
    const chat = contact.whatsapp ? `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(format(t.done.chatMessage, { code: done.code }))}` : null;
    return (
      <div ref={top} className={`${CARD} scroll-mt-28`} role="status">
        <span className="grid size-12 place-items-center rounded-full bg-success text-white" aria-hidden="true">
          <CheckIcon className="size-6" />
        </span>
        <h2 className="text-[1.75rem] leading-tight text-abyss">{t.done.title}</h2>
        <p className="text-slate">{format(t.done.text, { code: done.code })}</p>
        {done.clearance ? (
          <div className="grid gap-1 rounded-input bg-sunrise-wash p-4 ring-1 ring-sunrise">
            <p className="font-bold text-abyss">{t.done.clearanceTitle}</p>
            <p className="text-sm text-abyss">{t.done.clearance}</p>
          </div>
        ) : (
          <p className="rounded-input bg-teal-soft p-4 font-semibold text-teal-dark">{t.done.noClearance}</p>
        )}
        {done.copy && <p className="text-sm text-slate">{format(t.done.copy, { email: done.copy })}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={another} className={SOLID}>
            {t.done.another}
          </button>
          {order?.href && (
            <a href={order.href} className={OUTLINE}>
              {t.done.back}
            </a>
          )}
          {chat && (
            <a href={chat} target="_blank" rel="noopener" className={OUTLINE}>
              <ChatIcon className="size-[18px]" />
              {t.done.chat}
            </a>
          )}
        </div>
      </div>
    );
  }

  const english = (list, i) => (enMedical ? list?.[i] : null);

  return (
    <form ref={top} onSubmit={submit} noValidate className="grid scroll-mt-28 gap-5" key={round}>
      <section aria-labelledby="waiver-terms" className={CARD}>
        <p className="rounded-input bg-sunrise-wash px-4 py-3 text-sm text-ember ring-1 ring-sunrise">
          {agreement.fallback ? t.englishOnly : t.read}
        </p>
        <details open className="group rounded-input bg-foam ring-1 ring-mist">
          <summary id="waiver-terms" className="cursor-pointer px-4 py-3 font-bold text-teal-dark">
            {t.terms}
          </summary>
          <div lang={agreement.lang} className="grid max-h-[26rem] gap-3 overflow-y-auto overscroll-contain px-4 pb-4" tabIndex={0}>
            <Agreement blocks={agreement.blocks} />
          </div>
        </details>
      </section>

      <Section id="waiver-details" title={t.sections.details}>
        <Field id="waiver-fullName" label={t.fields.fullName} required error={fieldError("fullName")}>
          <input id="waiver-fullName" value={values.fullName} onChange={set("fullName")} maxLength={120} autoComplete="name" className={FIELD} {...invalid("fullName")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="waiver-birthDate" label={t.fields.birthDate} required error={fieldError("birthDate")}>
            <DatePicker
              id="waiver-birthDate"
              value={values.birthDate}
              onChange={(v) => setValue("birthDate", v)}
              min={`${year - 100}-01-01`}
              max={`${year - 8}${today.slice(4)}`}
              start={`${year - 30}${today.slice(4)}`}
              today={today}
              lang={lang}
              t={dateText}
              required
              className={FIELD}
              {...invalid("birthDate")}
            />
          </Field>
          <Field id="waiver-age" label={t.fields.age}>
            {/* Dihitung sendiri dari tanggal lahir, tidak diketik. */}
            <output id="waiver-age" htmlFor="waiver-birthDate" aria-live="polite" className={`${FIELD} flex items-center bg-foam`}>
              {age === null ? <span className="truncate text-sm text-slate">{t.fields.ageAuto}</span> : <span className="font-semibold">{format(t.fields.ageYears, { age })}</span>}
            </output>
          </Field>
        </div>
        <Field id="waiver-address" label={t.fields.address} optional={t.optional} error={fieldError("address")}>
          <input id="waiver-address" value={values.address} onChange={set("address")} maxLength={200} autoComplete="street-address" className={FIELD} {...invalid("address")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="waiver-nationality" label={t.fields.nationality} required error={fieldError("nationality")}>
            <input id="waiver-nationality" value={values.nationality} onChange={set("nationality")} maxLength={80} autoComplete="country-name" className={FIELD} {...invalid("nationality")} />
          </Field>
          <Field id="waiver-date" label={t.fields.date} required error={fieldError("date")}>
            <DatePicker
              id="waiver-date"
              value={date}
              onChange={setDate}
              min={today}
              max={addDays(today, 400)}
              today={today}
              lang={lang}
              t={dateText}
              required
              className={FIELD}
              {...invalid("date")}
            />
          </Field>
        </div>
        <Field id="waiver-emergency" label={t.fields.emergency} required error={fieldError("emergency")}>
          <input id="waiver-emergency" value={values.emergency} onChange={set("emergency")} maxLength={160} className={FIELD} {...invalid("emergency")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="waiver-email" label={t.fields.email} optional={t.optional} error={fieldError("email")}>
            <input id="waiver-email" type="email" value={values.email} onChange={set("email")} maxLength={160} autoComplete="email" className={FIELD} {...invalid("email")} />
          </Field>
          <Field id="waiver-phone" label={t.fields.phone} optional={t.optional} error={fieldError("phone")}>
            <input id="waiver-phone" type="tel" value={values.phone} onChange={set("phone")} maxLength={40} autoComplete="tel" className={FIELD} {...invalid("phone")} />
          </Field>
        </div>
        <Field id="waiver-room" label={t.fields.room} optional={t.optional} error={fieldError("room")}>
          <input id="waiver-room" value={values.room} onChange={set("room")} maxLength={80} className={FIELD} {...invalid("room")} />
        </Field>
        {minor && (
          <div className="grid gap-3 rounded-input bg-sunrise-wash p-4 ring-1 ring-sunrise">
            <p className="text-sm text-abyss">{t.fields.guardianNote}</p>
            <Field id="waiver-guardian" label={t.fields.guardian} required error={fieldError("guardian")}>
              <input id="waiver-guardian" value={values.guardian} onChange={set("guardian")} maxLength={120} className={FIELD} {...invalid("guardian")} />
            </Field>
          </div>
        )}
      </Section>

      <Section id="waiver-diver" title={t.sections.diver}>
        <label className="flex items-start gap-3 text-abyss">
          <input type="checkbox" checked={notCertified} onChange={(e) => setNotCertified(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-teal" />
          {t.fields.notCertified}
        </label>
        {!notCertified && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="waiver-certAgency" label={t.fields.certAgency} required hint={t.fields.certAgencyHint} error={fieldError("certAgency")}>
              <input id="waiver-certAgency" value={values.certAgency} onChange={set("certAgency")} maxLength={60} className={FIELD} {...invalid("certAgency")} />
            </Field>
            <Field id="waiver-certLevel" label={t.fields.certLevel} required hint={t.fields.certLevelHint} error={fieldError("certLevel")}>
              <input id="waiver-certLevel" value={values.certLevel} onChange={set("certLevel")} maxLength={80} className={FIELD} {...invalid("certLevel")} />
            </Field>
            <Field id="waiver-certNumber" label={t.fields.certNumber} optional={t.optional} error={fieldError("certNumber")}>
              <input id="waiver-certNumber" value={values.certNumber} onChange={set("certNumber")} maxLength={60} className={FIELD} {...invalid("certNumber")} />
            </Field>
            <Field id="waiver-loggedDives" label={t.fields.loggedDives} optional={t.optional} error={fieldError("loggedDives")}>
              <input id="waiver-loggedDives" type="number" inputMode="numeric" min={0} max={99999} value={values.loggedDives} onChange={set("loggedDives")} className={FIELD} {...invalid("loggedDives")} />
            </Field>
            <Field id="waiver-lastDive" label={t.fields.lastDive} optional={t.optional} error={fieldError("lastDive")}>
              <DatePicker
                id="waiver-lastDive"
                value={values.lastDive}
                onChange={(v) => setValue("lastDive", v)}
                min="1950-01-01"
                max={today}
                today={today}
                lang={lang}
                t={dateText}
                className={FIELD}
                {...invalid("lastDive")}
              />
            </Field>
          </div>
        )}
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-sm font-semibold text-abyss">{t.fields.insurance}</legend>
          <div className="flex flex-wrap gap-5">
            {[
              ["yes", t.yes],
              ["no", t.no],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-abyss">
                <input type="radio" name="waiver-insurance" value={value} checked={values.insurance === value} onChange={set("insurance")} className="size-5 accent-teal" />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        {values.insurance === "yes" && (
          <Field id="waiver-insurer" label={t.fields.insurer} optional={t.optional} error={fieldError("insurer")}>
            <input id="waiver-insurer" value={values.insurer} onChange={set("insurer")} maxLength={80} className={FIELD} {...invalid("insurer")} />
          </Field>
        )}
      </Section>

      <Section id="waiver-medical" title={t.sections.medical}>
        <p className="rounded-input bg-sunrise-wash px-4 py-3 text-sm text-ember ring-1 ring-sunrise">{t.medical.intro}</p>
        <ol className="grid gap-3">
          {MEDICAL.map((q, i) => {
            const open = q.box && medical[q.id] === true;
            const missing = error?.field === `medical.${q.id}`;
            return (
              <li key={q.id} className={`grid gap-3 rounded-input p-4 ring-1 ${missing ? "ring-danger" : "ring-mist"}`}>
                <div className="grid gap-1">
                  <p className="text-abyss">
                    <span className="font-bold text-teal">{i + 1}.</span> {t.medical.questions[i]}
                  </p>
                  {english(enMedical?.questions, i) && <p className="text-xs text-slate">EN · {enMedical.questions[i]}</p>}
                </div>
                <YesNo id={`medical-${q.id}`} value={medical[q.id]} onChange={(v) => answer(q.id, v)} t={t} invalid={missing} />
                {missing && (
                  <p role="alert" className="text-sm font-semibold text-danger">
                    {error.message}
                  </p>
                )}
                {open && (
                  <div className="grid gap-3 rounded-input bg-foam p-3 sm:p-4">
                    <p className="text-sm font-bold text-abyss">
                      {t.medical.more} · {t.medical.boxIntro[q.box]}
                    </p>
                    <ul className="grid gap-3">
                      {boxItems(q.box).map((id, j) => {
                        const missingItem = error?.field === `medical.${id}`;
                        return (
                          <li key={id} className={`grid gap-2 rounded-input bg-white p-3 ring-1 ${missingItem ? "ring-danger" : "ring-mist"}`}>
                            <p className="text-sm text-abyss">{t.medical.boxes[q.box][j]}</p>
                            {enMedical && <p className="text-xs text-slate">EN · {enMedical.boxes[q.box][j]}</p>}
                            <YesNo id={`medical-${id}`} value={medical[id]} onChange={(v) => answer(id, v)} t={t} invalid={missingItem} />
                            {missingItem && (
                              <p role="alert" className="text-sm font-semibold text-danger">
                                {error.message}
                              </p>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        {answeredAll && (
          <p
            role="status"
            className={`rounded-input p-4 font-semibold ${clearance ? "bg-sunrise-wash text-abyss ring-1 ring-sunrise" : "bg-teal-soft text-teal-dark"}`}
          >
            {clearance ? t.medical.clearance : t.medical.noClearance}
          </p>
        )}
        <label className="flex items-start gap-3 text-abyss">
          <input
            id="waiver-declaration"
            type="checkbox"
            checked={declaration}
            onChange={(e) => {
              setDeclaration(e.target.checked);
              if (error?.field === "declaration") setError(null);
            }}
            className="mt-0.5 size-5 shrink-0 accent-teal"
            {...invalid("declaration")}
          />
          {t.medical.declaration}
        </label>
        {fieldError("declaration") && (
          <p id="waiver-declaration-error" role="alert" className="text-sm font-semibold text-danger">
            {fieldError("declaration")}
          </p>
        )}
      </Section>

      <Section id="waiver-sign" title={t.sections.sign}>
        <div id="waiver-signature" tabIndex={-1} className="outline-none">
          <SignaturePad
            label={t.sections.sign}
            hint={t.sign.hint}
            clearLabel={t.sign.clear}
            resetKey={round}
            invalid={error?.field === "signature"}
            describedBy={error?.field === "signature" ? "waiver-signature-error" : undefined}
            onChange={(value) => {
              setSignature(value);
              if (value && error?.field === "signature") setError(null);
            }}
          />
          {fieldError("signature") && (
            <p id="waiver-signature-error" role="alert" className="mt-1.5 text-sm font-semibold text-danger">
              {fieldError("signature")}
            </p>
          )}
        </div>
        <Field id="waiver-confirmName" label={minor ? t.sign.confirmGuardian : t.sign.confirm} required error={fieldError("confirmName")}>
          <input id="waiver-confirmName" value={values.confirmName} onChange={set("confirmName")} maxLength={120} className={FIELD} {...invalid("confirmName")} />
        </Field>
        <label className="flex items-start gap-3 text-abyss">
          <input
            id="waiver-agree"
            type="checkbox"
            checked={agree}
            onChange={(e) => {
              setAgree(e.target.checked);
              if (error?.field === "agree") setError(null);
            }}
            className="mt-0.5 size-5 shrink-0 accent-teal"
            {...invalid("agree")}
          />
          {agreement.blocks.length ? t.sign.agree : t.sign.agreeNoTerms}
        </label>
        {fieldError("agree") && (
          <p id="waiver-agree-error" role="alert" className="text-sm font-semibold text-danger">
            {fieldError("agree")}
          </p>
        )}
        {error?.field === "server" || error?.field === "busy" ? (
          <p id="waiver-server" role="alert" tabIndex={-1} className="rounded-input bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
            {error.message}
          </p>
        ) : null}
        <button type="submit" disabled={busy} className={`${SOLID} w-full`}>
          {busy ? t.sign.sending : t.sign.submit}
        </button>
      </Section>
    </form>
  );
}
