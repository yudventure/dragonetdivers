import { monthLabel, shiftMonth, witMonth } from "@/lib/records";

// Potongan halaman modul admin yang dipakai bersama: navigasi bulan, kartu angka, tombol unduh Excel.

/** ‹ Oktober 2026 › dengan tautan "Bulan ini". param = nama parameter alamat (bawaan "bulan"). */
export function MonthNav({ month, path, param = "bulan", extra = {} }) {
  const link = (m) => `${path}?${new URLSearchParams({ ...extra, [param]: m })}`;
  const now = witMonth();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={link(shiftMonth(month, -1))} aria-label="Bulan sebelumnya" className="grid size-10 place-items-center rounded-full bg-white text-lg font-bold text-abyss ring-1 ring-mist hover:text-teal">
        ‹
      </a>
      <span className="min-w-[10rem] text-center font-display text-xl font-semibold text-abyss">{monthLabel(month)}</span>
      <a href={link(shiftMonth(month, 1))} aria-label="Bulan berikutnya" className="grid size-10 place-items-center rounded-full bg-white text-lg font-bold text-abyss ring-1 ring-mist hover:text-teal">
        ›
      </a>
      {month !== now && (
        <a href={link(now)} className="ml-1 text-sm font-semibold text-teal hover:underline">
          Bulan ini
        </a>
      )}
    </div>
  );
}

/** Deretan kartu angka: [{ label, value, tone? }]. */
export function Stats({ items }) {
  const tones = { good: "text-success", bad: "text-danger", warn: "text-ember" };
  return (
    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ label, value, tone, hint }) => (
        <div key={label} className="grid gap-1 rounded-card bg-white p-4 ring-1 ring-mist">
          <dt className="text-sm font-semibold text-slate">{label}</dt>
          <dd className={`font-display text-2xl font-semibold tabular-nums ${tones[tone] ?? "text-abyss"}`}>{value}</dd>
          {hint && <dd className="text-xs text-slate">{hint}</dd>}
        </div>
      ))}
    </dl>
  );
}

/** Tombol unduh Excel dari /api/admin/export. */
export function ExportLink({ query, label = "Unduh Excel" }) {
  return (
    <a
      href={`/api/admin/export?${new URLSearchParams(query)}`}
      className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-teal ring-1 ring-mist transition-colors duration-200 ease-brand hover:ring-teal"
    >
      ⤓ {label}
    </a>
  );
}

/** Judul kecil bagian halaman. */
export function SectionTitle({ children, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl text-abyss">{children}</h2>
      {action}
    </div>
  );
}

/** Bulan dari parameter alamat, atau bulan ini (WIT). */
export const monthParam = (value) => (typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : witMonth());
