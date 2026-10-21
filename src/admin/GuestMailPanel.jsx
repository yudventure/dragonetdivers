"use client";

import { useState } from "react";

const PREVIEWS = [
  ["Pesanan diterima", "kind=order&method=midtrans"],
  ["Pesanan diterima, transfer bank", "kind=order&method=transfer"],
  ["Pembayaran belum masuk", "kind=reminder&method=midtrans"],
  ["Pembayaran diterima", "kind=paid&method=midtrans"],
  ["Kode lupa password", "kind=otp"],
];

// Email ke tamu di /admin/pembayaran: status SMTP dari hPanel, kirim email uji ke operator, dan
// pratinjau setiap email (EN dan ID) dengan pesanan contoh.
export default function GuestMailPanel({ configured, issues, sender }) {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const test = async () => {
    setBusy(true);
    const response = await fetch("/api/admin/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ test: "mail" }) });
    setResult(await response.json().catch(() => ({ ok: false, message: "Tidak ada jawaban." })));
    setBusy(false);
  };
  return (
    <section className="grid gap-4 rounded-card bg-white p-5 ring-1 ring-mist">
      <div className="grid gap-1">
        <h2 className="text-xl text-abyss">Email ke tamu</h2>
        <p className="text-sm text-slate">
          Tamu menerima email saat memesan, pengingat bila pembayaran belum masuk ketika separuh waktu bayar lewat, dan email saat pembayaran diterima.
          Email dikirim dalam bahasa yang dipakai tamu saat memesan. Kode lupa password admin juga dikirim lewat akun ini.
        </p>
      </div>
      {configured ? (
        <p className="flex items-start gap-2 text-sm text-success">
          <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-success" />
          <span>
            SMTP terisi. Pengirim <strong className="text-abyss">{sender}</strong>
          </span>
        </p>
      ) : (
        <p className="flex items-start gap-2 text-sm text-ember">
          <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-sunrise" />
          <span>
            Belum aktif. Isi <code className="font-bold">{issues.join(", ")}</code> di hPanel (email Hostinger memakai smtp.hostinger.com port 465), lalu deploy ulang.
          </span>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={test}
          disabled={busy || !configured}
          className="inline-flex h-9 items-center rounded-full px-4 text-sm font-bold text-teal ring-1 ring-teal hover:bg-teal-soft disabled:opacity-50"
        >
          {busy ? "Mengirim…" : "Kirim email uji ke operator"}
        </button>
        {result && <span className={`text-sm font-semibold ${result.ok ? "text-success" : "text-danger"}`}>{result.message}</span>}
      </div>
      <div className="grid gap-2">
        <p className="text-xs font-bold tracking-[0.12em] text-slate uppercase">Pratinjau dengan pesanan contoh</p>
        <ul className="grid gap-1.5 text-sm">
          {PREVIEWS.map(([label, query]) => (
            <li key={label} className="flex flex-wrap items-center gap-x-3">
              <span className="text-abyss">{label}</span>
              {(query === "kind=otp" ? ["id"] : ["id", "en"]).map((lang) => (
                <a key={lang} href={`/api/admin/mail-preview?${query}&lang=${lang}`} target="_blank" rel="noopener" className="font-semibold text-teal hover:underline">
                  {lang === "id" ? "Indonesia" : "English"}
                </a>
              ))}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
