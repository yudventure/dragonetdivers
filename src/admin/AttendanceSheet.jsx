"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ATTENDANCE } from "@/lib/modules/hr";
import { INPUT } from "./RecordManager";

const SMALL = "h-10 w-full rounded-input border border-line-strong bg-white px-2 text-sm text-abyss outline-none focus:border-teal focus:ring-3 focus:ring-lagoon/40";

// Absensi harian /admin/absensi (mengikuti Zanclus): satu baris per pegawai aktif, tombol "Semua hadir",
// lalu "Simpan absensi". Absensi hari itu diganti seluruhnya setiap kali disimpan.
export default function AttendanceSheet({ date, employees, saved }) {
  const router = useRouter();
  const initial = Object.fromEntries(employees.map((e) => [e.id, saved[e.id] ?? { status: "", timeIn: "", timeOut: "", note: "" }]));
  const [rows, setRows] = useState(initial);
  const [state, setState] = useState({ busy: false, message: "", ok: false });
  const set = (id, key, value) => setRows((r) => ({ ...r, [id]: { ...r[id], [key]: value } }));

  async function save() {
    setState({ busy: true, message: "", ok: false });
    const response = await fetch("/api/admin/hr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "attendance", date, rows: Object.entries(rows).map(([employeeId, row]) => ({ employeeId, ...row })) }),
    });
    const result = await response.json().catch(() => ({}));
    setState({ busy: false, ok: response.ok, message: response.ok ? `Absensi ${result.saved} pegawai tersimpan.` : result.error || "Belum tersimpan." });
    if (response.ok) router.refresh();
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-abyss">
          Tanggal
          <input type="date" value={date} onChange={(e) => e.target.value && router.push(`/admin/absensi?tanggal=${e.target.value}`)} className={`${INPUT} h-10 w-auto`} />
        </label>
        <button
          type="button"
          onClick={() => setRows((r) => Object.fromEntries(Object.entries(r).map(([id, row]) => [id, { ...row, status: "hadir" }])))}
          className="inline-flex h-10 items-center rounded-full px-4 text-sm font-bold text-teal ring-1 ring-teal hover:bg-teal-soft"
        >
          Semua hadir
        </button>
      </div>
      {employees.length === 0 ? (
        <p className="rounded-card bg-white p-5 text-sm text-slate ring-1 ring-mist">
          Belum ada pegawai aktif. Tambahkan di{" "}
          <a href="/admin/pegawai" className="font-semibold text-teal hover:underline">
            Pegawai
          </a>
          .
        </p>
      ) : (
        <div className="overflow-x-auto rounded-card bg-white ring-1 ring-mist">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-foam text-xs tracking-[0.08em] text-slate uppercase">
              <tr>
                <th className="px-4 py-3 font-bold">Pegawai</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold">Masuk</th>
                <th className="px-4 py-3 font-bold">Pulang</th>
                <th className="px-4 py-3 font-bold">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const row = rows[e.id];
                return (
                  <tr key={e.id} className="border-t border-mist">
                    <td className="px-4 py-2">
                      <span className="block font-semibold text-abyss">{e.name}</span>
                      <span className="text-xs text-slate">{e.position}</span>
                    </td>
                    <td className="px-4 py-2">
                      <select aria-label={`Status ${e.name}`} value={row.status} onChange={(ev) => set(e.id, "status", ev.target.value)} className={SMALL}>
                        <option value="">Belum diisi</option>
                        {ATTENDANCE.map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input type="time" aria-label={`Jam masuk ${e.name}`} disabled={row.status !== "hadir"} value={row.timeIn} onChange={(ev) => set(e.id, "timeIn", ev.target.value)} className={SMALL} />
                    </td>
                    <td className="px-4 py-2">
                      <input type="time" aria-label={`Jam pulang ${e.name}`} disabled={row.status !== "hadir"} value={row.timeOut} onChange={(ev) => set(e.id, "timeOut", ev.target.value)} className={SMALL} />
                    </td>
                    <td className="px-4 py-2">
                      <input aria-label={`Catatan ${e.name}`} maxLength={120} value={row.note} onChange={(ev) => set(e.id, "note", ev.target.value)} className={SMALL} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {employees.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={save} disabled={state.busy} className="inline-flex h-11 items-center rounded-full bg-teal px-6 font-bold text-white hover:bg-teal-dark disabled:bg-mist disabled:text-slate">
            {state.busy ? "Menyimpan…" : "Simpan absensi"}
          </button>
          {state.message && <span className={`text-sm font-semibold ${state.ok ? "text-success" : "text-danger"}`}>{state.message}</span>}
        </div>
      )}
    </div>
  );
}
