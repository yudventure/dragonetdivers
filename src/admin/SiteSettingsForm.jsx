"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BanknoteIcon, ChatIcon, CheckIcon, FacebookIcon, InstagramIcon, MailIcon, MapPinIcon, TikTokIcon, YouTubeIcon } from "@/components/icons";
import { cleanEmail, cleanWhatsApp } from "@/lib/checkout";
import { NETWORKS, socialUrl } from "@/lib/site";
import { ADDRESS_LINES, mapsUrlOf } from "@/lib/site-settings";
import { INPUT } from "./RecordManager";

const SOCIAL_ICONS = { instagram: InstagramIcon, tiktok: TikTokIcon, facebook: FacebookIcon, youtube: YouTubeIcon };
const BOX = "grid content-start gap-5 rounded-card bg-white p-5 shadow-[0_1px_2px_rgb(10_50_59/0.05)] ring-1 ring-mist sm:p-6";

function Section({ icon: Icon, title, text, children }) {
  return (
    <section className={BOX}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-soft text-teal">
          <Icon className="size-5" />
        </span>
        <div className="grid gap-0.5">
          <h2 className="text-xl text-abyss">{title}</h2>
          <p className="text-sm text-slate">{text}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ id, label, hint, status, children }) {
  return (
    <div className="grid content-start gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-abyss">
          {label}
        </label>
        {status}
      </div>
      {children}
      {hint && <p className="text-xs text-slate">{hint}</p>}
    </div>
  );
}

/** Lencana status isian: tampil di website, memakai isian lama, kosong, atau belum benar. */
function Status({ value, valid, fallback }) {
  if (value && !valid) return <span className="rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-bold text-danger">Belum benar</span>;
  if (value) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success">
        <CheckIcon className="size-3.5" />
        Tampil di website
      </span>
    );
  }
  if (fallback) return <span className="rounded-full bg-foam px-2.5 py-0.5 text-xs font-bold text-slate ring-1 ring-mist">Memakai isian bawaan</span>;
  return <span className="rounded-full bg-foam px-2.5 py-0.5 text-xs font-bold text-slate ring-1 ring-mist">Kosong, tidak tampil</span>;
}

// Form /admin/kontak dengan pratinjau footer yang ikut berubah saat mengetik. fallback = isian lama dari
// hPanel atau nilai bawaan yang dipakai selama kolomnya kosong.
export default function SiteSettingsForm({ initial, fallback }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [state, setState] = useState({ busy: false, ok: false, message: "", field: "" });
  const touch = () => setState((s) => (s.message ? { ...s, message: "", field: "" } : s));
  const set = (key) => (e) => {
    touch();
    setValue((v) => ({ ...v, [key]: e.target.value }));
  };
  const setLine = (i) => (e) => {
    touch();
    setValue((v) => ({ ...v, address: v.address.map((line, j) => (j === i ? e.target.value : line)) }));
  };
  const changed = JSON.stringify(value) !== JSON.stringify(initial);

  const whatsapp = cleanWhatsApp(value.whatsapp) ?? (value.whatsapp ? null : cleanWhatsApp(fallback.whatsapp));
  const email = cleanEmail(value.email) ?? (value.email ? null : fallback.email);
  const address = value.address.some((line) => line.trim()) ? value.address.filter((line) => line.trim()) : fallback.address;
  const socials = NETWORKS.map((n) => ({ ...n, href: socialUrl(n.id, value[n.id] || fallback[n.id]) })).filter((n) => n.href);
  const invalid = (field) => (state.field === field ? { "aria-invalid": true } : {});

  async function save(event) {
    event.preventDefault();
    setState({ busy: true, ok: false, message: "", field: "" });
    const response = await fetch("/api/admin/site-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: value }),
    });
    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      setValue(result.settings);
      router.refresh();
    }
    setState({
      busy: false,
      ok: response.ok,
      field: result.field ?? "",
      message: response.ok ? "Tersimpan. Website sudah memakai isian baru." : result.error || "Belum tersimpan.",
    });
    if (!response.ok && result.field) document.getElementById(`site-${result.field}`)?.focus();
  }

  return (
    <form onSubmit={save} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid gap-6">
        <Section icon={ChatIcon} title="WhatsApp" text="Dipakai tombol Pesan di menu, tombol tanya di halaman layanan, FAQ, dan ikon WhatsApp di footer.">
          <Field
            id="site-whatsapp"
            label="Nomor WhatsApp"
            hint="Boleh ditulis 0812 3456 7890 atau +62 812 3456 7890. Untuk nomor luar negeri, tulis dengan kode negaranya."
            status={<Status value={value.whatsapp} valid={Boolean(cleanWhatsApp(value.whatsapp))} fallback={fallback.whatsapp} />}
          >
            <div className="flex flex-wrap gap-2">
              <input
                id="site-whatsapp"
                type="tel"
                inputMode="tel"
                value={value.whatsapp}
                onChange={set("whatsapp")}
                placeholder={fallback.whatsapp ? `+${fallback.whatsapp}` : "+62 812 3456 7890"}
                className={`${INPUT} max-w-sm flex-1`}
                {...invalid("whatsapp")}
              />
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex h-11 items-center rounded-full px-4 text-sm font-bold text-teal ring-1 ring-teal hover:bg-teal-soft"
                >
                  Coba buka chat ↗
                </a>
              )}
            </div>
          </Field>
        </Section>

        <Section icon={MailIcon} title="Email dan alamat" text="Tampil di footer, halaman pesanan, dan email ke tamu. Balasan tamu atas email pesanan dikirim ke email ini.">
          <Field
            id="site-email"
            label="Email publik"
            hint="Kosongkan untuk memakai email bawaan."
            status={<Status value={value.email} valid={Boolean(cleanEmail(value.email))} fallback={fallback.email} />}
          >
            <input id="site-email" type="email" value={value.email} onChange={set("email")} placeholder={fallback.email} className={`${INPUT} max-w-md`} {...invalid("email")} />
          </Field>
          <Field id="site-address0" label="Alamat" hint="Paling banyak tiga baris. Kosongkan semua baris untuk memakai alamat bawaan.">
            <div className="grid max-w-md gap-2">
              {Array.from({ length: ADDRESS_LINES }, (_, i) => (
                <input
                  key={i}
                  id={`site-address${i}`}
                  value={value.address[i] ?? ""}
                  onChange={setLine(i)}
                  maxLength={80}
                  placeholder={fallback.address[i] ?? ""}
                  className={INPUT}
                  {...invalid(`address${i}`)}
                />
              ))}
            </div>
          </Field>
          <Field
            id="site-mapsUrl"
            label="Tautan Google Maps"
            hint="Buka Google Maps, cari lokasi base, tekan Bagikan, lalu salin tautannya ke sini. Kosongkan untuk memakai titik base bawaan."
            status={<Status value={value.mapsUrl} valid={Boolean(mapsUrlOf(value.mapsUrl))} fallback={fallback.mapsUrl} />}
          >
            <div className="flex flex-wrap gap-2">
              <input
                id="site-mapsUrl"
                type="url"
                value={value.mapsUrl}
                onChange={set("mapsUrl")}
                placeholder="https://maps.app.goo.gl/…"
                className={`${INPUT} max-w-md flex-1`}
                {...invalid("mapsUrl")}
              />
              <a
                href={mapsUrlOf(value.mapsUrl) || fallback.mapsUrl}
                target="_blank"
                rel="noopener"
                className="inline-flex h-11 items-center rounded-full px-4 text-sm font-bold text-teal ring-1 ring-teal hover:bg-teal-soft"
              >
                Buka peta ↗
              </a>
            </div>
          </Field>
        </Section>

        <Section
          icon={InstagramIcon}
          title="Media sosial"
          text="Ikon akun yang diisi tampil di footer website. Tulis nama akun (mis. @dragonetdivers) atau tempel tautan profilnya."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {NETWORKS.map((n) => {
              const Icon = SOCIAL_ICONS[n.id];
              const href = socialUrl(n.id, value[n.id]);
              return (
                <Field key={n.id} id={`site-${n.id}`} label={n.label} status={<Status value={value[n.id]} valid={Boolean(href)} fallback={fallback[n.id]} />}>
                  <div className="flex items-center gap-2">
                    <span className="grid size-11 shrink-0 place-items-center rounded-input bg-foam text-abyss ring-1 ring-mist">
                      <Icon className="size-5" />
                    </span>
                    <input
                      id={`site-${n.id}`}
                      value={value[n.id]}
                      onChange={set(n.id)}
                      placeholder={fallback[n.id] || `@akun atau https://${n.host}/…`}
                      className={INPUT}
                      {...invalid(n.id)}
                    />
                  </div>
                  {href && (
                    <a href={href} target="_blank" rel="noopener" className="w-fit truncate text-xs font-semibold text-teal hover:underline">
                      {href} ↗
                    </a>
                  )}
                </Field>
              );
            })}
          </div>
        </Section>

        <Section
          icon={BanknoteIcon}
          title="Mata uang di website"
          text="Harga selalu ditulis dan ditagih dalam Rupiah. Dolar AS hanya tampilan perkiraan dengan kurs harian Bank Sentral Eropa."
        >
          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-input bg-foam p-4 ring-1 ring-mist">
            <span className="grid gap-1">
              <span className="font-semibold text-abyss">Tampilkan pilihan dolar AS (USD)</span>
              <span className="text-sm text-slate">
                {value.showUsd
                  ? "Nyala. Tamu bisa memilih Rupiah atau Dolar AS di menu, dan harga dolar tampil sebagai perkiraan."
                  : "Mati. Semua harga di website hanya dalam Rupiah dan pilihan mata uang disembunyikan."}
              </span>
            </span>
            <input
              id="site-showUsd"
              type="checkbox"
              role="switch"
              checked={value.showUsd}
              onChange={(e) => {
                touch();
                setValue((v) => ({ ...v, showUsd: e.target.checked }));
              }}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="relative mt-0.5 h-7 w-12 shrink-0 rounded-full bg-line-strong transition-colors duration-200 ease-brand peer-checked:bg-teal peer-focus-visible:ring-3 peer-focus-visible:ring-lagoon/40 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-200 peer-checked:after:translate-x-5"
            />
          </label>
          <p className="text-xs text-slate">Pembayaran PayPal tetap ditagih dalam dolar dengan kurs hari itu, terlepas dari pengaturan ini.</p>
        </Section>
      </div>

      <aside className="grid gap-4 xl:sticky xl:top-28">
        <section className={BOX}>
          <h2 className="font-sans text-sm font-semibold text-slate">Pratinjau footer website</h2>
          <div className="grid gap-4 rounded-input bg-abyss p-5 text-white">
            <div className="flex flex-wrap gap-2">
              {whatsapp && (
                <span className="grid size-9 place-items-center rounded-full bg-white/10 ring-1 ring-white/15" title="WhatsApp">
                  <ChatIcon className="size-[18px]" />
                </span>
              )}
              {socials.map((n) => {
                const Icon = SOCIAL_ICONS[n.id];
                return (
                  <span key={n.id} className="grid size-9 place-items-center rounded-full bg-white/10 ring-1 ring-white/15" title={n.label}>
                    <Icon className="size-[18px]" />
                  </span>
                );
              })}
              {!whatsapp && socials.length === 0 && <span className="text-xs text-on-dark-muted">Belum ada ikon yang tampil.</span>}
            </div>
            <div className="grid gap-2 text-sm">
              <p className="flex gap-2">
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-sunrise" />
                <span>
                  {address.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </p>
              {email && (
                <p className="flex gap-2">
                  <MailIcon className="mt-0.5 size-4 shrink-0 text-sunrise" />
                  {email}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-slate">Pratinjau ini ikut berubah saat kamu mengetik. Website baru berubah setelah disimpan.</p>
        </section>
        <div className={`${BOX} gap-3`}>
          <button
            type="submit"
            disabled={state.busy || !changed}
            className="inline-flex h-11 items-center justify-center rounded-full bg-teal px-6 font-bold text-white hover:bg-teal-dark disabled:bg-mist disabled:text-slate"
          >
            {state.busy ? "Menyimpan…" : "Simpan perubahan"}
          </button>
          {state.message ? (
            <p role="status" className={`text-sm font-semibold ${state.ok ? "text-success" : "text-danger"}`}>
              {state.message}
            </p>
          ) : (
            <p className="text-sm text-slate">{changed ? "Ada perubahan yang belum disimpan." : "Belum ada perubahan."}</p>
          )}
        </div>
      </aside>
    </form>
  );
}
