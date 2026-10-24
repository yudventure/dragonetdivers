"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ACCOUNT_LIMIT, DUE_HOURS } from "@/lib/checkout";

const INPUT = "h-11 w-full rounded-input border border-line-strong bg-white px-3 text-abyss outline-none focus:border-teal focus:ring-3 focus:ring-lagoon/40";
const rupiah = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

function Status({ ok, children }) {
  return (
    <p className={`flex items-start gap-2 text-sm ${ok ? "text-success" : "text-ember"}`}>
      <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${ok ? "bg-success" : "bg-sunrise"}`} />
      <span>{children}</span>
    </p>
  );
}

function Method({ title, checked, onChange, ready, children }) {
  return (
    <section className={`grid gap-3 rounded-card bg-white p-5 ring-1 ${checked && ready ? "ring-teal" : "ring-mist"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl text-abyss">{title}</h2>
        <label className="flex items-center gap-2 text-sm font-semibold text-abyss">
          <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-teal" />
          Tawarkan di checkout
        </label>
      </div>
      {children}
      {checked && !ready && <p className="text-sm font-semibold text-ember">Belum tampil di checkout sampai semua syarat di atas terpenuhi.</p>}
    </section>
  );
}

/** Tombol uji koneksi ke Midtrans atau PayPal dengan key dari hPanel. */
function TestButton({ provider }) {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    const response = await fetch("/api/admin/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ test: provider }) });
    setResult(await response.json().catch(() => ({ ok: false, message: "Tidak ada jawaban." })));
    setBusy(false);
  };
  const reason = { missing: "Key belum diisi di hPanel.", key: "Key ditolak. Periksa lagi isinya di hPanel.", network: "Tidak bisa terhubung." };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={run} disabled={busy} className="inline-flex h-9 items-center rounded-full px-4 text-sm font-bold text-teal ring-1 ring-teal hover:bg-teal-soft disabled:opacity-50">
        {busy ? "Menguji…" : "Uji koneksi"}
      </button>
      {result && (
        <span className={`text-sm font-semibold ${result.ok ? "text-success" : "text-danger"}`}>
          {result.ok ? "Terhubung, key diterima." : [reason[result.reason], result.message].filter(Boolean).join(" ")}
        </span>
      )}
    </div>
  );
}

// Pengaturan /admin/pembayaran: empat cara bayar dengan syaratnya masing-masing, rekening transfer,
// dan batas waktu bayar. Disimpan lewat /api/admin/payments (validatePayments di src/lib/checkout.js).
export default function PaymentSettings({ initial, status, providers, rate }) {
  const router = useRouter();
  const [value, setValue] = useState(() => ({ ...initial, accounts: initial.accounts.length ? initial.accounts : [{ bank: "", number: "", holder: "" }] }));
  const [state, setState] = useState({ busy: false, error: "", saved: false });
  const set = (patch) => setValue((v) => ({ ...v, ...patch }));
  const setAccount = (i, key, text) => set({ accounts: value.accounts.map((a, j) => (j === i ? { ...a, [key]: text } : a)) });
  const { midtrans, paypal } = providers;
  const accounts = value.accounts.filter((a) => a.bank && a.number && a.holder).length;

  async function save(event) {
    event.preventDefault();
    setState({ busy: true, error: "", saved: false });
    const response = await fetch("/api/admin/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ settings: value }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return setState({ busy: false, error: result.error || "Belum tersimpan.", saved: false });
    setState({ busy: false, error: "", saved: true });
    router.refresh();
  }

  return (
    <form onSubmit={save} className="grid gap-5">
      <Method title="Midtrans (kartu, e-wallet, QRIS, virtual account)" checked={value.midtrans} onChange={(midtrans) => set({ midtrans })} ready={status.midtrans.keys}>
        {midtrans.configured ? (
          <Status ok={midtrans.issues.length === 0}>
            Server key …{midtrans.ending || "?"} terbaca, mode {midtrans.production ? "pembayaran sungguhan (production)" : "uji coba (sandbox)"}.
          </Status>
        ) : (
          <Status ok={false}>MIDTRANS_SERVER_KEY belum diisi di hPanel. Tambahkan MIDTRANS_PRODUCTION=true bila memakai key production.</Status>
        )}
        {midtrans.issues.map((issue) => (
          <Status key={issue} ok={false}>
            {issue}
          </Status>
        ))}
        <p className="text-sm text-slate">
          Notifikasi pembayaran dikirim otomatis ke <code className="font-semibold break-all text-abyss">{midtrans.notifyUrl}</code>. Alamat yang sama boleh juga
          diisi di dashboard Midtrans (Settings → Payment → Notification URL).
        </p>
        {midtrans.lastError && (
          <p className="text-sm text-danger">
            Jawaban terakhir Midtrans ({midtrans.lastError.stage}, {midtrans.lastError.status}): {midtrans.lastError.message || "tanpa pesan"}
          </p>
        )}
        <TestButton provider="midtrans" />
      </Method>

      <Method title="PayPal" checked={value.paypal} onChange={(paypal) => set({ paypal })} ready={status.paypal.keys && status.paypal.rate}>
        {paypal.configured ? (
          <Status ok>
            Client ID …{paypal.ending || "?"} dan secret terbaca, mode {paypal.live ? "pembayaran sungguhan (live)" : "uji coba (sandbox)"}.
          </Status>
        ) : (
          <Status ok={false}>PAYPAL_CLIENT_ID dan PAYPAL_CLIENT_SECRET belum diisi di hPanel. Tambahkan PAYPAL_MODE=live untuk pembayaran sungguhan.</Status>
        )}
        {rate ? (
          <Status ok>
            PayPal menagih dalam dolar AS dengan kurs {rate.source === "ecb" ? "Bank Sentral Eropa hari ini" : "dari USD_IDR_RATE"}: US$1 ≈ {rupiah(rate.idrPerUsd)}.
          </Status>
        ) : (
          <Status ok={false}>Kurs dolar belum tersedia, jadi PayPal belum bisa ditawarkan. Isi USD_IDR_RATE di hPanel bila kurs harian tidak terbaca.</Status>
        )}
        {paypal.lastError && (
          <p className="text-sm text-danger">
            Jawaban terakhir PayPal ({paypal.lastError.stage}, {paypal.lastError.status}): {paypal.lastError.message || "tanpa pesan"}
          </p>
        )}
        <TestButton provider="paypal" />
      </Method>

      <Method title="Transfer bank" checked={value.transfer} onChange={(transfer) => set({ transfer })} ready={accounts > 0}>
        <p className="text-sm text-slate">
          Tamu melihat rekening ini di halaman pesanannya, lalu mengirim bukti transfer. Tandai lunas di Pesanan setelah dana masuk.
        </p>
        <div className="grid gap-3">
          {value.accounts.map((account, i) => (
            <div key={i} className="grid gap-3 rounded-input bg-foam p-3 sm:grid-cols-[1fr_1.2fr_1.4fr_auto] sm:items-end">
              <label className="grid gap-1 text-sm font-semibold text-abyss">
                Bank
                <input value={account.bank} onChange={(e) => setAccount(i, "bank", e.target.value)} placeholder="BCA" maxLength={40} className={INPUT} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-abyss">
                Nomor rekening
                <input value={account.number} onChange={(e) => setAccount(i, "number", e.target.value)} inputMode="numeric" maxLength={30} className={INPUT} />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-abyss">
                Atas nama
                <input value={account.holder} onChange={(e) => setAccount(i, "holder", e.target.value)} maxLength={80} className={INPUT} />
              </label>
              <button
                type="button"
                onClick={() => set({ accounts: value.accounts.filter((_, j) => j !== i) })}
                className="h-11 rounded-full px-4 text-sm font-semibold text-danger hover:bg-danger/10"
              >
                Hapus
              </button>
            </div>
          ))}
          {value.accounts.length < ACCOUNT_LIMIT && (
            <button
              type="button"
              onClick={() => set({ accounts: [...value.accounts, { bank: "", number: "", holder: "" }] })}
              className="w-fit text-sm font-bold text-teal hover:underline"
            >
              + Tambah rekening
            </button>
          )}
        </div>
      </Method>

      <Method title="Tunai di dive center" checked={value.cash} onChange={(cash) => set({ cash })} ready>
        <p className="text-sm text-slate">
          Tamu memesan sekarang dan membayar tunai saat tiba. Tempatnya ditahan tanpa batas waktu bayar, dan halaman pesanannya menampilkan
          alamat dari Kontak. Setelah uangnya diterima, tekan Tunai diterima di Pesanan supaya pesanan lunas dan tamu mendapat email pembayaran
          diterima. Pesanan yang tidak jadi dibatalkan di sana juga.
        </p>
      </Method>

      <section className="grid gap-3 rounded-card bg-white p-5 ring-1 ring-mist">
        <h2 className="text-xl text-abyss">Batas waktu bayar</h2>
        <label className="grid max-w-xs gap-1.5 text-sm font-semibold text-abyss">
          Pesanan online dan transfer ditutup bila belum dibayar setelah
          <select value={value.dueHours} onChange={(e) => set({ dueHours: Number(e.target.value) })} className={INPUT}>
            {DUE_HOURS.map((h) => (
              <option key={h} value={h}>
                {h} jam
              </option>
            ))}
          </select>
        </label>
      </section>

      {state.error && (
        <p role="alert" className="rounded-input bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={state.busy}
          className="inline-flex h-11 items-center rounded-full bg-teal px-6 font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark disabled:bg-mist disabled:text-slate"
        >
          {state.busy ? "Menyimpan…" : "Simpan pengaturan"}
        </button>
        {state.saved && <span className="text-sm font-semibold text-success">Tersimpan.</span>}
      </div>
    </form>
  );
}
