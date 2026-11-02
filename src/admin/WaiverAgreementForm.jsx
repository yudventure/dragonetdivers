"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { INPUT } from "./RecordManager";

const BOX = "grid content-start gap-4 rounded-card bg-white p-5 shadow-[0_1px_2px_rgb(10_50_59/0.05)] ring-1 ring-mist sm:p-6";

/**
 * Teks perjanjian formulir selam (/admin/formulir). English berlaku dan wajib; terjemahan Indonesia opsional
 * (tampil di /id/waiver di bawah teks English). Paragraf dipisah baris kosong, "1. Judul" menjadi judul.
 * Kosongkan English lalu simpan untuk kembali ke teks bawaan (src/content/waiver-agreement.js).
 */
export default function WaiverAgreementForm({ initial, fallback, custom }) {
  const router = useRouter();
  const [en, setEn] = useState(initial.en || fallback);
  const [id, setId] = useState(initial.id);
  const [state, setState] = useState({ busy: false, ok: false, message: "" });

  async function save(value) {
    setState({ busy: true, ok: false, message: "" });
    const response = await fetch("/api/admin/waiver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    }).catch(() => null);
    const result = await response?.json().catch(() => ({}));
    if (!response?.ok) return setState({ busy: false, ok: false, message: result?.error || "Belum tersimpan. Coba lagi." });
    if (!value.en) setEn(fallback);
    setState({ busy: false, ok: true, message: value.en ? "Tersimpan. Formulir berikutnya memakai teks ini." : "Kembali ke teks bawaan." });
    router.refresh();
  }

  return (
    <form
      className={BOX}
      onSubmit={(e) => {
        e.preventDefault();
        save({ en: en === fallback && !custom ? "" : en, id });
      }}
    >
      <div className="grid gap-1">
        <h2 className="text-xl text-abyss">Teks perjanjian</h2>
        <p className="text-sm text-slate">
          Tamu membacanya sebelum tanda tangan. Teks bahasa Inggris yang berlaku. Pisahkan paragraf dengan baris kosong; baris seperti
          &quot;1. Agreement Parties&quot; tampil sebagai judul. Formulir yang sudah ditandatangani tetap menyimpan teks lamanya.
        </p>
        <p className="text-sm font-semibold text-teal">{custom ? "Memakai teks yang disimpan tim." : "Memakai teks bawaan (dari form Turtle Dive, nama Dragonet Divers)."}</p>
      </div>
      <label className="grid gap-1.5">
        <span className="text-sm font-semibold text-abyss">English (berlaku)</span>
        <textarea value={en} onChange={(e) => setEn(e.target.value)} rows={14} className={`${INPUT} h-auto py-2.5 text-sm leading-relaxed`} />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm font-semibold text-abyss">Terjemahan Bahasa Indonesia (opsional)</span>
        <textarea value={id} onChange={(e) => setId(e.target.value)} rows={6} className={`${INPUT} h-auto py-2.5 text-sm leading-relaxed`} placeholder="Tampil di /id/waiver di bawah teks bahasa Inggris." />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={state.busy}
          className="inline-flex h-11 items-center justify-center rounded-full bg-teal px-6 font-bold text-white hover:bg-teal-dark disabled:bg-mist disabled:text-slate"
        >
          {state.busy ? "Menyimpan…" : "Simpan teks"}
        </button>
        {custom && (
          <button
            type="button"
            disabled={state.busy}
            onClick={() => save({ en: "", id: "" })}
            className="inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-bold text-teal ring-1 ring-teal hover:bg-teal-soft disabled:opacity-50"
          >
            Kembalikan teks bawaan
          </button>
        )}
      </div>
      {state.message && (
        <p role={state.ok ? "status" : "alert"} className={`text-sm font-semibold ${state.ok ? "text-success" : "text-danger"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
