"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GUEST_LIMIT } from "@/lib/checkout";

const rupiah = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const INPUT = "h-11 w-full rounded-input border border-line-strong bg-white px-3 text-abyss outline-none focus:border-teal focus:ring-3 focus:ring-lagoon/40";
const AREA = "w-full rounded-input border border-line-strong bg-white px-3 py-2 text-abyss outline-none focus:border-teal focus:ring-3 focus:ring-lagoon/40";

const blank = (service) => ({
  id: null,
  service,
  nameEn: "",
  nameId: "",
  summaryEn: "",
  summaryId: "",
  includesEn: "",
  includesId: "",
  price: "",
  unit: "person",
  minGuests: 1,
  maxGuests: 8,
  sortOrder: 0,
  active: true,
});

function Field({ label, hint, children, className = "" }) {
  return (
    <label className={`grid content-start gap-1.5 ${className}`}>
      <span className="text-sm font-semibold text-abyss">{label}</span>
      {children}
      {hint && <span className="text-xs text-slate">{hint}</span>}
    </label>
  );
}

/** Form tambah/ubah paket. Teks English dan Indonesia berdampingan supaya keduanya diisi. */
function PackageForm({ initial, services, onDone, onCancel }) {
  const [value, setValue] = useState(initial);
  const form = useRef(null);
  useEffect(() => form.current?.scrollIntoView({ behavior: "smooth", block: "start" }), []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (key) => (event) => setValue((v) => ({ ...v, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...value, minGuests: Number(value.minGuests), maxGuests: Number(value.maxGuests), sortOrder: Number(value.sortOrder) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Paket belum tersimpan.");
      onDone();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <form ref={form} onSubmit={save} className="grid scroll-mt-28 gap-5 rounded-card bg-white p-5 shadow-float ring-1 ring-teal sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl text-abyss">{value.id ? "Ubah paket" : "Paket baru"}</h2>
        <label className="flex items-center gap-2 text-sm font-semibold text-abyss">
          <input type="checkbox" checked={value.active} onChange={set("active")} className="size-4 accent-teal" />
          Tampil di situs
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Layanan">
          <select value={value.service} onChange={set("service")} className={INPUT}>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Harga (Rp)" hint="Mis. 1500000 atau 1.500.000">
          <input value={value.price} onChange={set("price")} inputMode="numeric" required className={INPUT} />
        </Field>
        <Field label="Satuan harga">
          <select value={value.unit} onChange={set("unit")} className={INPUT}>
            <option value="person">Per orang</option>
            <option value="group">Per grup</option>
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama paket (English)">
          <input value={value.nameEn} onChange={set("nameEn")} required maxLength={120} className={INPUT} />
        </Field>
        <Field label="Nama paket (Indonesia)">
          <input value={value.nameId} onChange={set("nameId")} required maxLength={120} className={INPUT} />
        </Field>
        <Field label="Ringkasan (English)">
          <textarea value={value.summaryEn} onChange={set("summaryEn")} rows={2} maxLength={300} className={AREA} />
        </Field>
        <Field label="Ringkasan (Indonesia)">
          <textarea value={value.summaryId} onChange={set("summaryId")} rows={2} maxLength={300} className={AREA} />
        </Field>
        <Field label="Isi paket (English)" hint="Satu butir per baris, mis. Guide, tanks and weights">
          <textarea value={value.includesEn} onChange={set("includesEn")} rows={4} className={AREA} />
        </Field>
        <Field label="Isi paket (Indonesia)" hint="Satu butir per baris, mis. Pemandu, tabung dan pemberat">
          <textarea value={value.includesId} onChange={set("includesId")} rows={4} className={AREA} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Tamu minimal">
          <input type="number" min={1} max={GUEST_LIMIT} value={value.minGuests} onChange={set("minGuests")} className={INPUT} />
        </Field>
        <Field label="Tamu maksimal">
          <input type="number" min={1} max={GUEST_LIMIT} value={value.maxGuests} onChange={set("maxGuests")} className={INPUT} />
        </Field>
        <Field label="Urutan" hint="Angka kecil tampil lebih dulu">
          <input type="number" min={-999} max={999} value={value.sortOrder} onChange={set("sortOrder")} className={INPUT} />
        </Field>
      </div>
      {error && (
        <p role="alert" className="rounded-input bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 items-center rounded-full bg-teal px-6 font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark disabled:bg-mist disabled:text-slate"
        >
          {busy ? "Menyimpan…" : "Simpan paket"}
        </button>
        <button type="button" onClick={onCancel} className="inline-flex h-11 items-center rounded-full px-5 font-semibold text-slate hover:text-abyss">
          Batal
        </button>
      </div>
    </form>
  );
}

// Daftar paket per layanan dengan tombol ubah/hapus, dan form tambah/ubah (src/lib/checkout.js
// validatePackage memeriksa isinya di server).
export default function PackageManager({ packages, services }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const done = () => {
    setEditing(null);
    router.refresh();
  };

  async function remove(pkg) {
    if (!window.confirm(`Hapus paket "${pkg.nameId}"? Pesanan lama tetap tersimpan.`)) return;
    setError("");
    const response = await fetch(`/api/admin/packages?id=${pkg.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) setError(result.error || "Paket belum terhapus.");
    else router.refresh();
  }

  return (
    <div className="grid gap-5">
      {error && (
        <p role="alert" className="rounded-input bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      {editing && <PackageForm key={editing.id ?? `new-${editing.service}`} initial={editing} services={services} onDone={done} onCancel={() => setEditing(null)} />}
      {services.map((service) => {
        const own = packages.filter((p) => p.service === service.slug);
        return (
          <section key={service.slug} className="grid gap-3 rounded-card bg-white p-5 ring-1 ring-mist">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex flex-wrap items-center gap-2 text-xl text-abyss">
                {service.title} <span className="font-sans text-sm font-semibold text-slate">· {own.length} paket</span>
                {service.hidden && (
                  <span className="rounded-full bg-mist px-2 py-0.5 font-sans text-[10px] font-bold tracking-wide text-slate uppercase">Disimpan, tidak tampil</span>
                )}
              </h2>
              <div className="flex flex-wrap gap-2">
                {!service.hidden && (
                  <a href={`/id/services/${service.slug}#packages`} target="_blank" rel="noopener" className="inline-flex h-9 items-center px-2 text-sm font-semibold text-teal hover:underline">
                    Lihat di situs ↗
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setEditing(blank(service.slug))}
                  className="inline-flex h-9 items-center rounded-full border-[1.5px] border-teal px-4 text-sm font-bold text-teal transition-colors duration-200 ease-brand hover:bg-teal-soft"
                >
                  + Tambah paket
                </button>
              </div>
            </div>
            {own.length === 0 ? (
              <p className="text-sm text-slate">Belum ada paket. Halaman layanan ini menampilkan ajakan bertanya lewat WhatsApp atau email.</p>
            ) : (
              <ul className="grid gap-2">
                {own.map((pkg) => (
                  <li key={pkg.id} className="flex flex-wrap items-center justify-between gap-3 rounded-input bg-foam px-4 py-3">
                    <span className="grid gap-0.5">
                      <span className="flex flex-wrap items-center gap-2 font-semibold text-abyss">
                        {pkg.nameId}
                        {!pkg.active && <span className="rounded-full bg-mist px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate uppercase">Disembunyikan</span>}
                      </span>
                      <span className="text-sm text-slate">
                        {pkg.nameEn} · {rupiah(pkg.price)} {pkg.unit === "group" ? "per grup" : "per orang"} · {pkg.minGuests}–{pkg.maxGuests} tamu
                      </span>
                    </span>
                    <span className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing({ ...pkg, price: String(pkg.price) })}
                        className="inline-flex h-9 items-center rounded-full px-4 text-sm font-bold text-teal ring-1 ring-teal hover:bg-teal-soft"
                      >
                        Ubah
                      </button>
                      <button type="button" onClick={() => remove(pkg)} className="inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold text-danger hover:bg-danger/10">
                        Hapus
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
