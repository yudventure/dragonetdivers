"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const rupiah = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

/**
 * Panel daftar harga pemilik di /admin/paket. groups = [{ slug, title, items: [{ name, price, unit, minGuests,
 * maxGuests, isNew }] }]. Tombolnya menambahkan paket yang belum ada; paket yang sudah ada tidak diubah.
 */
export default function PriceListImport({ title, source, groups }) {
  const router = useRouter();
  const [state, setState] = useState({ busy: false, error: "" });
  const items = groups.flatMap((g) => g.items);
  const fresh = items.filter((item) => item.isNew).length;

  async function add() {
    setState({ busy: true, error: "" });
    const response = await fetch("/api/admin/packages/import", { method: "POST" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return setState({ busy: false, error: result.error || "Paket belum tertambah." });
    setState({ busy: false, error: "" });
    router.refresh();
  }

  return (
    <section className="grid gap-4 rounded-card bg-white p-5 ring-1 ring-mist">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid max-w-[60ch] gap-1">
          <h2 className="text-xl text-abyss">{title}</h2>
          <p className="text-sm text-slate">
            Dari {source}, {items.length} paket.{" "}
            {fresh
              ? `${fresh} paket belum ada di situs${items.length - fresh ? `, ${items.length - fresh} sudah ada dan tidak diubah` : ""}.`
              : "Semuanya sudah ada di situs. Ubah harga atau isinya langsung di daftar paket di bawah."}
          </p>
        </div>
        {fresh > 0 && (
          <button
            type="button"
            onClick={add}
            disabled={state.busy}
            className="inline-flex h-11 items-center rounded-full bg-teal px-5 font-bold text-white hover:bg-teal-dark disabled:bg-mist disabled:text-slate"
          >
            {state.busy ? "Menambahkan…" : `Tambahkan ${fresh} paket`}
          </button>
        )}
      </div>
      {state.error && <p className="text-sm font-semibold text-danger">{state.error}</p>}
      <details className="group rounded-input ring-1 ring-mist">
        <summary className="flex h-11 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold text-abyss hover:bg-foam [&::-webkit-details-marker]:hidden">
          Lihat isi daftar harga
          <span className="text-slate transition-transform duration-200 group-open:rotate-90">›</span>
        </summary>
        <div className="grid gap-5 border-t border-mist p-4">
          {groups.map((group) => (
            <div key={group.slug} className="grid gap-2">
              <h3 className="font-sans text-sm font-bold text-slate">{group.title}</h3>
              <ul className="grid gap-1.5">
                {group.items.map((item) => (
                  <li key={item.name} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-mist pb-1.5 text-sm last:border-0">
                    <span className="font-semibold text-abyss">
                      {item.name}
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-bold ${item.isNew ? "bg-teal-soft text-teal" : "bg-foam text-slate"}`}>
                        {item.isNew ? "Baru" : "Sudah ada"}
                      </span>
                    </span>
                    <span className="text-slate tabular-nums">
                      {rupiah(item.price)} {item.unit === "group" ? "per perahu" : "per orang"} ·{" "}
                      {item.minGuests > 1 ? `${item.minGuests}–${item.maxGuests} tamu` : `maks. ${item.maxGuests} tamu`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
