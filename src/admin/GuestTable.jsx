"use client";

import { useMemo, useState } from "react";
import { rupiah, shortDay } from "@/lib/records";
import { INPUT } from "./RecordManager";

const CERT = { none: "Belum bersertifikat", open_water: "Open Water", advanced: "Advanced", rescue: "Rescue", pro: "Divemaster+" };

// Daftar tamu /admin/tamu dengan pencarian nama, nomor, atau email.
export default function GuestTable({ guests }) {
  const [term, setTerm] = useState("");
  const shown = useMemo(() => {
    const q = term.trim().toLowerCase();
    return q ? guests.filter((g) => [g.name, g.phone, g.email].some((v) => String(v).toLowerCase().includes(q))) : guests;
  }, [guests, term]);
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <input type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Cari nama, nomor, atau email…" aria-label="Cari tamu" className={`${INPUT} h-10 max-w-sm`} />
        <span className="ml-auto text-sm text-slate tabular-nums">{shown.length} tamu</span>
      </div>
      {shown.length === 0 ? (
        <p className="rounded-card bg-white p-5 text-sm text-slate ring-1 ring-mist">Belum ada tamu. Tamu muncul dari pesanan website dan reservasi yang dicatat di kalender.</p>
      ) : (
        <div className="overflow-x-auto rounded-card bg-white ring-1 ring-mist">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-foam text-xs tracking-[0.08em] text-slate uppercase">
              <tr>
                <th className="px-4 py-3 font-bold">Nama</th>
                <th className="px-4 py-3 font-bold">Kontak</th>
                <th className="px-4 py-3 font-bold">Sertifikasi</th>
                <th className="px-4 py-3 text-right font-bold">Reservasi</th>
                <th className="px-4 py-3 font-bold">Terakhir / berikutnya</th>
                <th className="px-4 py-3 text-right font-bold">Nilai lunas</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((g) => (
                <tr key={g.key} className="border-t border-mist align-top">
                  <td className="px-4 py-3">
                    <span className="block font-semibold text-abyss">{g.name}</span>
                    <span className="text-xs text-slate">
                      {g.sources} · {g.lang === "id" ? "Indonesia" : "English"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {g.phone && (
                      <a href={`https://wa.me/${g.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="block font-semibold text-teal hover:underline">
                        {g.phone}
                      </a>
                    )}
                    {g.email && (
                      <a href={`mailto:${g.email}`} className="block text-teal hover:underline">
                        {g.email}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-abyss">{CERT[g.certification] ?? "–"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-abyss tabular-nums">{g.bookings}</td>
                  <td className="px-4 py-3 text-abyss">
                    {g.last ? shortDay(g.last) : "–"}
                    {g.next && <span className="block text-xs font-bold text-teal">Berikutnya {shortDay(g.next)}</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-abyss tabular-nums">{g.paid ? rupiah(g.paid) : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
