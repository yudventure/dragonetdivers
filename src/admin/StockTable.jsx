"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { optionLabel, rupiah, witDate } from "@/lib/records";
import { item as itemSchema } from "@/lib/modules/inventory";
import { BUTTON, RecordForm, removeRecord } from "./RecordManager";

const TONE = { ok: "bg-teal-wash text-teal", low: "bg-sunrise-wash text-ember ring-1 ring-sunrise", empty: "bg-danger/10 text-danger", inactive: "bg-mist text-slate" };
const categoryField = itemSchema.fields.find((f) => f.key === "category");
const number = (n) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);

// Barang & stok /admin/stok (mengikuti Zanclus): stok dihitung dari catatan keluar masuk. Tombol Masuk
// dan Keluar membuka form gerakan dengan barangnya sudah terpilih.
export default function StockTable({ items, itemOptions }) {
  const router = useRouter();
  const [form, setForm] = useState(null); // { kind, initial, title }
  const [showInactive, setShowInactive] = useState(false);
  const [error, setError] = useState("");
  const shown = items.filter((it) => showInactive || it.active);
  const blankItem = Object.fromEntries(itemSchema.fields.map((f) => [f.key, f.default ?? (f.type === "boolean" ? false : "")]));
  const move = (it, flow) =>
    setForm({
      kind: "movement",
      title: `${flow === "in" ? "Barang masuk" : "Barang keluar"} · ${it.name}`,
      initial: { date: witDate(), itemId: it.id, flow, qty: "", reason: flow === "in" ? "beli" : "pakai", note: "" },
    });
  const done = () => {
    setForm(null);
    router.refresh();
  };
  async function remove(it) {
    if (!window.confirm(`Hapus barang "${it.name}"?`)) return;
    setError((await removeRecord("item", it.id)) || "");
    router.refresh();
  }
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setForm({ kind: "item", initial: blankItem })}
          className="inline-flex h-10 items-center rounded-full border-[1.5px] border-teal px-4 text-sm font-bold text-teal hover:bg-teal-soft"
        >
          + Tambah barang
        </button>
        <label className="flex items-center gap-2 text-sm font-semibold text-abyss">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="size-4 accent-teal" />
          Tampilkan nonaktif
        </label>
      </div>
      {error && (
        <p role="alert" className="rounded-input bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      {form && <RecordForm key={form.initial.id ?? form.title ?? "new"} kind={form.kind} initial={form.initial} title={form.title} refs={{ itemId: itemOptions }} onDone={done} onCancel={() => setForm(null)} />}
      {shown.length === 0 ? (
        <p className="rounded-card bg-white p-5 text-sm text-slate ring-1 ring-mist">Belum ada barang. Tambahkan alat selam, tabung, suku cadang, dan bahan habis pakai.</p>
      ) : (
        <div className="relative overflow-x-auto rounded-card bg-white ring-1 ring-mist">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-foam text-xs tracking-[0.08em] text-slate uppercase">
              <tr>
                <th className="px-4 py-3 font-bold">Barang</th>
                <th className="px-4 py-3 font-bold">Kategori</th>
                <th className="px-4 py-3 text-right font-bold">Stok</th>
                <th className="px-4 py-3 text-right font-bold">Minimum</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Nilai</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Tindakan</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((it) => (
                <tr key={it.id} className="border-t border-mist align-top">
                  <td className="px-4 py-3">
                    <span className="block font-semibold text-abyss">{it.name}</span>
                    <span className="text-xs text-slate">{[it.sku, it.location].filter(Boolean).join(" · ") || "–"}</span>
                  </td>
                  <td className="px-4 py-3 text-abyss">{optionLabel(categoryField, it.category)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-abyss tabular-nums">
                    {number(it.stock)} {it.unit}
                  </td>
                  <td className="px-4 py-3 text-right text-slate tabular-nums">{number(it.minStock ?? 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${TONE[it.status.key]}`}>{it.status.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate tabular-nums">{it.cost ? rupiah(it.value) : "–"}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button type="button" onClick={() => move(it, "in")} className={`${BUTTON} text-success hover:bg-success/10`}>
                      Masuk
                    </button>
                    <button type="button" onClick={() => move(it, "out")} className={`${BUTTON} text-ember hover:bg-sunrise-wash`}>
                      Keluar
                    </button>
                    <button type="button" onClick={() => setForm({ kind: "item", initial: it })} className={`${BUTTON} text-teal hover:bg-teal-soft`}>
                      Ubah
                    </button>
                    <button type="button" onClick={() => remove(it)} className={`${BUTTON} text-danger hover:bg-danger/10`}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
