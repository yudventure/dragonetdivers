"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { rupiah } from "@/lib/records";
import { BUTTON } from "./RecordManager";

// Slip gaji /admin/gaji (mengikuti Zanclus): dihitung dari data pegawai dan absensi bulan itu. "Kunci"
// menyimpan angka slip saat gaji dibayar, supaya tidak berubah bila absensi diubah kemudian.
export default function PayrollTable({ month, slips }) {
  const router = useRouter();
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function act(slip, action) {
    if (action === "lock" && !window.confirm(`Kunci slip ${slip.name}? Tandai setelah gaji dibayar.`)) return;
    setBusy(slip.employeeId);
    setError("");
    const response = await fetch("/api/admin/hr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, month, employeeId: slip.employeeId }) });
    const result = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) setError(result.error || "Belum berhasil.");
    else router.refresh();
  }
  if (!slips.length) return <p className="rounded-card bg-white p-5 text-sm text-slate ring-1 ring-mist">Belum ada pegawai aktif bulan ini.</p>;
  return (
    <div className="grid gap-3">
      {error && (
        <p role="alert" className="rounded-input bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <div className="overflow-x-auto rounded-card bg-white ring-1 ring-mist">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-foam text-xs tracking-[0.08em] text-slate uppercase">
            <tr>
              <th className="px-4 py-3 font-bold">Nama</th>
              <th className="px-4 py-3 text-right font-bold">Hadir / alpa</th>
              <th className="px-4 py-3 text-right font-bold">Gaji pokok</th>
              <th className="px-4 py-3 text-right font-bold">Tunjangan</th>
              <th className="px-4 py-3 text-right font-bold">Potongan</th>
              <th className="px-4 py-3 text-right font-bold">Bersih</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3">
                <span className="sr-only">Tindakan</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {slips.map((s) => (
              <Fragment key={s.employeeId}>
                <tr className="border-t border-mist align-top">
                  <td className="px-4 py-3">
                    <span className="block font-semibold text-abyss">{s.name}</span>
                    <span className="text-xs text-slate">{s.position}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {s.hadir} / {s.alpa}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{rupiah(s.basePay)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{rupiah(s.allowance)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{rupiah(s.deduction)}</td>
                  <td className="px-4 py-3 text-right font-bold text-abyss tabular-nums">{rupiah(s.net)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.lockedAt ? "bg-success text-white" : "bg-mist text-slate"}`}>{s.lockedAt ? "Terkunci" : "Draf"}</span>
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <button type="button" onClick={() => setOpen(open === s.employeeId ? null : s.employeeId)} className={`${BUTTON} text-teal hover:bg-teal-soft`}>
                      {open === s.employeeId ? "Tutup slip" : "Lihat slip"}
                    </button>
                    <button
                      type="button"
                      disabled={busy === s.employeeId}
                      onClick={() => act(s, s.lockedAt ? "unlock" : "lock")}
                      className={`${BUTTON} ${s.lockedAt ? "text-slate hover:bg-mist" : "text-success hover:bg-success/10"}`}
                    >
                      {s.lockedAt ? "Buka" : "Kunci (dibayar)"}
                    </button>
                  </td>
                </tr>
                {open === s.employeeId && (
                  <tr className="bg-foam">
                    <td colSpan={8} className="px-4 py-3">
                      <ul className="grid max-w-md gap-1">
                        {s.lines.map((line) => (
                          <li key={line.label} className="flex justify-between gap-3">
                            <span>{line.label}</span>
                            <span className="tabular-nums">{rupiah(line.amount)}</span>
                          </li>
                        ))}
                        <li className="flex justify-between gap-3 border-t border-mist pt-1">
                          <span>Kotor</span>
                          <span className="tabular-nums">{rupiah(s.gross)}</span>
                        </li>
                        <li className="flex justify-between gap-3 font-bold text-abyss">
                          <span>Diterima bersih</span>
                          <span className="tabular-nums">{rupiah(s.net)}</span>
                        </li>
                      </ul>
                      {s.lockedAt && <p className="mt-2 text-xs text-slate">Dikunci {new Date(s.lockedAt).toLocaleString("id-ID", { timeZone: "Asia/Jayapura" })} WIT oleh {s.lockedBy}</p>}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-abyss font-bold">
              <td className="px-4 py-3" colSpan={5}>
                Total
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{rupiah(slips.reduce((t, s) => t + s.net, 0))}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
