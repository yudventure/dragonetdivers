"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { INPUT } from "./RecordManager";

/**
 * Form pengaturan kecil (kapasitas harian, tarif pajak) yang disimpan ke endpoint admin. fields =
 * [{ key, label, hint, type }], body(values) = isi permintaan.
 */
export default function SettingsForm({ endpoint, fields, initial, submitLabel = "Simpan", bodyKey }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [state, setState] = useState({ busy: false, message: "", ok: false });
  async function save(event) {
    event.preventDefault();
    setState({ busy: true, message: "", ok: false });
    const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [bodyKey]: values }) });
    const result = await response.json().catch(() => ({}));
    if (response.ok) router.refresh();
    setState({ busy: false, ok: response.ok, message: response.ok ? "Tersimpan." : result.error || "Belum tersimpan." });
  }
  return (
    <form onSubmit={save} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.key} className="grid content-start gap-1.5">
            <span className="text-sm font-semibold text-abyss">{f.label}</span>
            <input
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              inputMode={f.type === "number" ? "decimal" : undefined}
              className={INPUT}
            />
            {f.hint && <span className="text-xs text-slate">{f.hint}</span>}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={state.busy}
          className="inline-flex h-10 items-center rounded-full bg-teal px-5 text-sm font-bold text-white hover:bg-teal-dark disabled:bg-mist disabled:text-slate"
        >
          {state.busy ? "Menyimpan…" : submitLabel}
        </button>
        {state.message && <span className={`text-sm font-semibold ${state.ok ? "text-success" : "text-danger"}`}>{state.message}</span>}
      </div>
    </form>
  );
}
