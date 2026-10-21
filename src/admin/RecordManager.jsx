"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { optionLabel, rupiah, shortDay } from "@/lib/records";
import { schemaFor } from "@/lib/modules";

export const INPUT = "h-11 w-full rounded-input border border-line-strong bg-white px-3 text-abyss outline-none focus:border-teal focus:ring-3 focus:ring-lagoon/40";
const AREA = "w-full rounded-input border border-line-strong bg-white px-3 py-2 text-abyss outline-none focus:border-teal focus:ring-3 focus:ring-lagoon/40";
export const BUTTON = "inline-flex h-9 items-center rounded-full px-4 text-sm font-bold transition-colors duration-200 ease-brand disabled:opacity-50";

/** Nilai kolom untuk tabel. refs = { key: [[id, label], ...] } untuk kolom rujukan. */
export function display(field, value, refs = {}) {
  if (value === null || value === undefined || value === "") return "–";
  switch (field.type) {
    case "money":
      return rupiah(value);
    case "date":
      return shortDay(value);
    case "select":
      return optionLabel(field, value);
    case "boolean":
      return value ? "Ya" : "Tidak";
    case "ref":
      return refs[field.key]?.find(([id]) => id === value)?.[1] ?? "(sudah dihapus)";
    case "number":
      return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value);
    default:
      return String(value);
  }
}

function Input({ field, value, values, onChange, refs }) {
  const common = { id: `f-${field.key}`, name: field.key, required: field.required, onChange: (e) => onChange(field.type === "boolean" ? e.target.checked : e.target.value) };
  if (field.type === "boolean")
    return (
      <label className="flex h-11 items-center gap-2 text-sm font-semibold text-abyss">
        <input type="checkbox" checked={Boolean(value)} {...common} className="size-4 accent-teal" />
        {field.checkLabel ?? "Ya"}
      </label>
    );
  if (field.type === "textarea") return <textarea rows={field.rows ?? 3} value={value ?? ""} maxLength={field.max ?? 2000} {...common} className={AREA} />;
  if (field.type === "select" || field.type === "ref") {
    // optionsBy: pilihan bergantung kolom lain (mis. kategori menurut jenis pemasukan/pengeluaran).
    const options =
      field.type === "ref" ? (refs[field.key] ?? []) : field.optionsBy ? (field.optionsBy.map[values[field.optionsBy.field]] ?? field.options) : field.options;
    return (
      <select value={value ?? ""} {...common} className={INPUT}>
        <option value="">{field.required ? "Pilih…" : "–"}</option>
        {options.map(([option, label]) => (
          <option key={option} value={option}>
            {label}
          </option>
        ))}
      </select>
    );
  }
  const type = { date: "date", month: "month", time: "time", email: "email", url: "url" }[field.type] ?? "text";
  const numeric = field.type === "money" || field.type === "number";
  return (
    <input
      type={type}
      inputMode={numeric ? "decimal" : field.type === "phone" ? "tel" : undefined}
      value={value ?? ""}
      maxLength={numeric ? 20 : (field.max ?? 160)}
      placeholder={field.placeholder}
      {...common}
      className={INPUT}
    />
  );
}

/** Form tambah/ubah satu catatan menurut skemanya. */
export function RecordForm({ kind, initial, refs = {}, onDone, onCancel, title }) {
  const schema = schemaFor(kind);
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState({});
  const form = useRef(null);
  useEffect(() => form.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), []);

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError({});
    try {
      const response = await fetch("/api/admin/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id: initial.id ?? null, data: value }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw Object.assign(new Error(result.error || "Belum tersimpan. Coba lagi."), { field: result.field });
      onDone(result.record);
    } catch (e) {
      setError({ message: e.message, field: e.field });
      setBusy(false);
    }
  }

  return (
    <form ref={form} onSubmit={save} className="grid scroll-mt-28 gap-5 rounded-card bg-white p-5 shadow-float ring-1 ring-teal sm:p-6">
      <h2 className="text-xl text-abyss">{title ?? (initial.id ? `Ubah ${schema.noun}` : `${schema.noun[0].toUpperCase()}${schema.noun.slice(1)} baru`)}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schema.fields
          .filter((field) => !field.hidden)
          .map((field) => (
            <label key={field.key} htmlFor={`f-${field.key}`} className={`grid content-start gap-1.5 ${field.wide ? "sm:col-span-2 lg:col-span-3" : ""}`}>
              <span className="text-sm font-semibold text-abyss">
                {field.label}
                {field.required && <span className="text-ember"> *</span>}
              </span>
              <Input
                field={field}
                value={value[field.key]}
                values={value}
                refs={refs}
                onChange={(v) =>
                  setValue((old) => {
                    const next = { ...old, [field.key]: v };
                    // Pilihan yang bergantung kolom ini dikosongkan supaya tidak tersisa pilihan yang tidak cocok.
                    for (const other of schema.fields) if (other.optionsBy?.field === field.key) next[other.key] = "";
                    return next;
                  })
                }
              />
              {error.field === field.key ? (
                <span className="text-xs font-semibold text-danger">{error.message}</span>
              ) : (
                field.hint && <span className="text-xs text-slate">{field.hint}</span>
              )}
            </label>
          ))}
      </div>
      {error.message && !schema.fields.some((f) => f.key === error.field) && (
        <p role="alert" className="rounded-input bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          {error.message}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 items-center rounded-full bg-teal px-6 font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark disabled:bg-mist disabled:text-slate"
        >
          {busy ? "Menyimpan…" : "Simpan"}
        </button>
        <button type="button" onClick={onCancel} className="inline-flex h-11 items-center rounded-full px-5 font-semibold text-slate hover:text-abyss">
          Batal
        </button>
      </div>
    </form>
  );
}

/** Hapus satu catatan; mengembalikan pesan galat atau "". */
export async function removeRecord(kind, id) {
  const response = await fetch(`/api/admin/records?kind=${encodeURIComponent(kind)}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
  const result = await response.json().catch(() => ({}));
  return response.ok ? "" : result.error || "Belum terhapus. Coba lagi.";
}

/**
 * Daftar catatan satu jenis dengan cari, tambah, ubah, dan hapus. columns = kunci kolom yang tampil di
 * tabel (bawaan: kolom bertanda list di skema). defaults = isian awal catatan baru.
 */
export default function RecordManager({ kind, records, refs = {}, columns, defaults = {}, addLabel, empty = "Belum ada data.", search = true, footer }) {
  const schema = schemaFor(kind);
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [term, setTerm] = useState("");
  const shown = (columns ?? schema.fields.filter((f) => f.list).map((f) => f.key)).map((key) => schema.fields.find((f) => f.key === key)).filter(Boolean);
  const blank = () => Object.fromEntries(schema.fields.map((f) => [f.key, defaults[f.key] ?? f.default ?? (f.type === "boolean" ? false : "")]));
  const visible = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => shown.some((f) => display(f, r[f.key], refs).toLowerCase().includes(q)));
  }, [records, term, shown, refs]);

  async function remove(record) {
    if (!window.confirm(`Hapus ${schema.noun} ini?`)) return;
    setError("");
    const message = await removeRecord(kind, record.id);
    if (message) setError(message);
    else router.refresh();
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(blank())}
          className="inline-flex h-10 items-center rounded-full border-[1.5px] border-teal px-4 text-sm font-bold text-teal transition-colors duration-200 ease-brand hover:bg-teal-soft"
        >
          + {addLabel ?? `Tambah ${schema.noun}`}
        </button>
        {search && records.length > 5 && (
          <input type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Cari…" aria-label="Cari" className={`${INPUT} h-10 max-w-xs`} />
        )}
        <span className="ml-auto text-sm text-slate tabular-nums">{visible.length} data</span>
      </div>
      {error && (
        <p role="alert" className="rounded-input bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      {editing && (
        <RecordForm
          key={editing.id ?? "new"}
          kind={kind}
          initial={editing}
          refs={refs}
          onCancel={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
      {visible.length === 0 ? (
        <p className="rounded-card bg-white p-5 text-sm text-slate ring-1 ring-mist">{empty}</p>
      ) : (
        <div className="relative overflow-x-auto rounded-card bg-white ring-1 ring-mist">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-foam text-xs tracking-[0.08em] text-slate uppercase">
              <tr>
                {shown.map((f) => (
                  <th key={f.key} scope="col" className={`px-4 py-3 font-bold ${f.type === "money" || f.type === "number" ? "text-right" : ""}`}>
                    {f.short ?? f.label}
                  </th>
                ))}
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Tindakan</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((record) => (
                <tr key={record.id} className="border-t border-mist align-top">
                  {shown.map((f, i) => (
                    <td
                      key={f.key}
                      className={`px-4 py-3 ${i === 0 ? "font-semibold text-abyss" : "text-abyss"} ${f.type === "money" || f.type === "number" ? "text-right tabular-nums" : ""} ${f.type === "textarea" ? "max-w-[28ch] whitespace-pre-line text-slate" : ""}`}
                    >
                      {display(f, record[f.key], refs)}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button type="button" onClick={() => setEditing(record)} className={`${BUTTON} text-teal hover:bg-teal-soft`}>
                      Ubah
                    </button>
                    <button type="button" onClick={() => remove(record)} className={`${BUTTON} text-danger hover:bg-danger/10`}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {footer}
          </table>
        </div>
      )}
    </div>
  );
}

/** Tombol yang membuka form catatan baru dengan isian awal (mis. "Tutup tanggal ini" di kalender). */
export function QuickAdd({ kind, defaults = {}, refs = {}, label, title, tone = "outline" }) {
  const schema = schemaFor(kind);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const initial = Object.fromEntries(schema.fields.map((f) => [f.key, defaults[f.key] ?? f.default ?? (f.type === "boolean" ? false : "")]));
  const look = tone === "solid" ? "bg-teal text-white hover:bg-teal-dark" : "text-teal ring-1 ring-teal hover:bg-teal-soft";
  return open ? (
    <div className="w-full">
      <RecordForm
        kind={kind}
        initial={initial}
        refs={refs}
        title={title}
        onCancel={() => setOpen(false)}
        onDone={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </div>
  ) : (
    <button type="button" onClick={() => setOpen(true)} className={`${BUTTON} h-10 ${look}`}>
      {label}
    </button>
  );
}
