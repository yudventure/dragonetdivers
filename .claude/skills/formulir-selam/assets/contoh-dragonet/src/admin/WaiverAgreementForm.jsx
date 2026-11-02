"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { INPUT } from "./RecordManager";

const BOX = "grid content-start gap-4 rounded-card bg-white p-5 shadow-[0_1px_2px_rgb(10_50_59/0.05)] ring-1 ring-mist sm:p-6";
const LANGS = [
  ["en", "English", "Wajib. Dipakai juga di halaman yang bahasanya dikosongkan."],
  ["id", "Bahasa Indonesia", "Tampil di /id/waiver."],
  ["zh", "Mandarin", "Tampil di /zh/waiver."],
  ["ko", "Korea", "Tampil di /ko/waiver."],
];
const EMPTY = { en: "", id: "", zh: "", ko: "" };

/**
 * Teks perjanjian formulir selam (/admin/formulir), satu kolom per bahasa website. Tamu membaca dan
 * menyetujui teks dalam bahasa halaman yang sedang aktif (keputusan pemilik 2 November 2026); bahasa yang
 * dikosongkan memakai teks English. Paragraf dipisah baris kosong, "1. Judul" menjadi judul. Teks yang sama
 * dengan bawaan disimpan kosong, jadi tetap mengikuti teks bawaan (src/content/waiver-agreement.js).
 */
export default function WaiverAgreementForm({ initial, fallback, custom }) {
  const router = useRouter();
  const start = custom ? { ...EMPTY, ...initial, en: initial.en || fallback.en } : { ...fallback };
  const [texts, setTexts] = useState(start);
  const [state, setState] = useState({ busy: false, ok: false, message: "" });
  const set = (lang, value) => setTexts((current) => ({ ...current, [lang]: value }));

  async function save(value) {
    setState({ busy: true, ok: false, message: "" });
    const response = await fetch("/api/admin/waiver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    }).catch(() => null);
    const result = await response?.json().catch(() => ({}));
    if (!response?.ok) return setState({ busy: false, ok: false, message: result?.error || "Belum tersimpan. Coba lagi." });
    const reset = LANGS.every(([lang]) => !value[lang]);
    if (reset) setTexts({ ...fallback });
    setState({ busy: false, ok: true, message: reset ? "Memakai teks bawaan." : "Tersimpan. Formulir berikutnya memakai teks ini." });
    router.refresh();
  }

  return (
    <form
      className={BOX}
      onSubmit={(e) => {
        e.preventDefault();
        // Teks yang sama dengan bawaan disimpan kosong, supaya tetap mengikuti teks bawaan.
        const same = LANGS.every(([lang]) => (texts[lang] ?? "").trim() === (fallback[lang] ?? "").trim());
        save(same ? EMPTY : texts);
      }}
    >
      <div className="grid gap-1">
        <h2 className="text-xl text-abyss">Teks perjanjian</h2>
        <p className="text-sm text-slate">
          Tamu membaca dan menyetujui perjanjian dalam bahasa halaman yang sedang dibukanya. Bahasa yang dikosongkan memakai teks English. Pisahkan
          paragraf dengan baris kosong; baris seperti &quot;1. Agreement Parties&quot; tampil sebagai judul. Formulir yang sudah ditandatangani tetap
          menyimpan teks yang dibaca tamu saat itu.
        </p>
        <p className="text-sm font-semibold text-teal">
          {custom ? "Memakai teks yang disimpan tim." : "Memakai teks bawaan (dari form Turtle Dive, nama Dragonet Divers) dalam English, Indonesia, Mandarin, dan Korea."}
        </p>
      </div>
      {LANGS.map(([lang, label, hint]) => (
        <label key={lang} className="grid gap-1.5">
          <span className="text-sm font-semibold text-abyss">{label}</span>
          <textarea
            value={texts[lang] ?? ""}
            onChange={(e) => set(lang, e.target.value)}
            rows={lang === "en" ? 14 : 10}
            lang={lang}
            className={`${INPUT} h-auto py-2.5 text-sm leading-relaxed`}
            placeholder={lang === "en" ? "" : "Kosongkan untuk memakai teks English."}
          />
          <span className="text-xs text-slate">{hint}</span>
        </label>
      ))}
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
            onClick={() => save(EMPTY)}
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
