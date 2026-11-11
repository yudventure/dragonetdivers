"use client";

import { useEffect, useRef, useState } from "react";
import { INPUT } from "./RecordManager";

const PRIMARY =
  "inline-flex h-11 items-center justify-center rounded-full bg-teal px-6 font-bold text-white hover:bg-teal-dark disabled:bg-mist disabled:text-slate";
const SECONDARY =
  "inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-bold text-teal ring-1 ring-teal hover:bg-teal-soft disabled:opacity-50";
const witTime = (iso) =>
  iso
    ? `${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jayapura" }).format(new Date(iso))} WIT`
    : "";

/**
 * Spreadsheet formulir selam di /admin/formulir/pengaturan (permintaan pemilik 2 November 2026: "buatkan hasil form bisa
 * langsung rapih di spreadsheet"): unduh Excel, dan Google Sheets yang terisi sendiri lewat Apps Script milik tim
 * (skrip dari appsScript di src/lib/waiver-sheet.js, API /api/admin/waiver-sheet). Selama formulir masih
 * dikirim di belakang layar, keadaannya ditanyakan ulang tiap 2,5 detik.
 */
export default function WaiverSheetPanel({ initial, script, total }) {
  const [status, setStatus] = useState(initial);
  const [url, setUrl] = useState(initial.url ?? "");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState({ text: "", error: false });
  const [copied, setCopied] = useState(false);
  const polls = useRef(0);

  // Tanya keadaan selama pengiriman berjalan (atau sebentar setelah dimulai, sebelum server menandainya).
  useEffect(() => {
    if (!status.running && !(status.pending > 0 && polls.current > 0 && polls.current < 4)) {
      polls.current = 0;
      return;
    }
    const timer = setTimeout(async () => {
      polls.current += 1;
      const response = await fetch("/api/admin/waiver-sheet", { cache: "no-store" }).catch(() => null);
      const next = response?.ok ? await response.json().catch(() => null) : null;
      if (next) setStatus(next);
    }, 2500);
    return () => clearTimeout(timer);
  }, [status]);

  async function act(action, body = {}) {
    setBusy(action);
    setMessage({ text: "", error: false });
    const response = await fetch("/api/admin/waiver-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    }).catch(() => null);
    const result = (await response?.json().catch(() => null)) ?? {};
    setBusy("");
    if (!response?.ok) return setMessage({ text: result.error || "Belum berhasil. Periksa koneksi lalu coba lagi.", error: true });
    polls.current = 1;
    setStatus(result);
    setMessage({
      text:
        action === "connect"
          ? "Tersambung. Lembar Diving Waivers sudah disiapkan dan formulir sedang dikirim."
          : action === "disconnect"
            ? "Website berhenti mengirim ke spreadsheet. Isi spreadsheet tidak dihapus."
            : "Formulir sedang dikirim ke spreadsheet.",
      error: false,
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setMessage({ text: "Salin otomatis tidak bisa di peramban ini. Pilih semua teks skrip lalu salin manual.", error: true });
    }
  }

  const tone = !status.connected ? "idle" : status.lastError ? "error" : "ok";
  const chip = {
    idle: ["Belum tersambung", "bg-foam text-slate ring-mist"],
    ok: [status.running ? "Mengirim…" : "Tersambung", "bg-teal-soft text-teal ring-teal/40"],
    error: ["Ada kendala", "bg-sunrise-wash text-ember ring-sunrise"],
  }[tone];

  return (
    <section className="grid gap-5 rounded-card bg-white p-5 ring-1 ring-mist sm:p-6">
      <div className="grid gap-1">
        <h2 className="text-xl text-abyss">Spreadsheet formulir</h2>
        <p className="text-sm text-slate">
          Satu baris per penyelam dengan kolom tetap seperti sheet Divers Liability Release. Nomor telepon dan kontak darurat tetap teks (tidak
          berubah jadi #ERROR!), tanggal tersusun rapi, baris judul menempel dengan filter, dan kolom medis berwarna bila perlu persetujuan dokter.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div className="grid content-start gap-3 rounded-card bg-foam p-4 ring-1 ring-mist">
          <h3 className="font-sans text-base font-bold text-abyss">Unduh Excel</h3>
          <p className="text-sm text-slate">
            {total} formulir dalam satu file .xlsx, yang paling lama di atas. Bisa dibuka di Excel atau diimpor ke Google Sheets (File, Import).
          </p>
          <a href="/api/admin/export?type=formulir" className={`${SECONDARY} w-fit bg-white`}>
            ⤓ Unduh Excel
          </a>
        </div>

        <div className="grid content-start gap-3 rounded-card bg-foam p-4 ring-1 ring-mist">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-sans text-base font-bold text-abyss">Google Sheets otomatis</h3>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${chip[1]}`}>{chip[0]}</span>
          </div>
          {status.connected ? (
            <>
              <p className="text-sm text-slate">
                Setiap formulir yang masuk langsung ditambahkan ke lembar Diving Waivers.
                {status.lastSync ? ` Terakhir terkirim ${witTime(status.lastSync)}.` : ""}{" "}
                {status.pending > 0 ? `${status.pending} formulir menunggu dikirim.` : "Semua formulir sudah ada di spreadsheet."}
              </p>
              {status.lastError && (
                <p role="alert" className="rounded-input bg-sunrise-wash px-3 py-2 text-sm font-semibold text-ember ring-1 ring-sunrise">
                  {status.lastError}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {status.sheet && (
                  <a href={status.sheet} target="_blank" rel="noopener" className={`${SECONDARY} bg-white`}>
                    Buka spreadsheet
                  </a>
                )}
                {status.pending > 0 && (
                  <button type="button" onClick={() => act("sync")} disabled={Boolean(busy) || status.running} className={SECONDARY}>
                    {busy === "sync" ? "Mengirim…" : "Kirim sekarang"}
                  </button>
                )}
                <button type="button" onClick={() => act("resend")} disabled={Boolean(busy) || status.running} className={SECONDARY}>
                  {busy === "resend" ? "Mengirim…" : "Kirim ulang semua"}
                </button>
                <button
                  type="button"
                  onClick={() => window.confirm("Berhenti mengirim formulir ke spreadsheet ini? Isi spreadsheet tidak dihapus.") && act("disconnect")}
                  disabled={Boolean(busy)}
                  className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold text-slate hover:bg-white hover:text-abyss"
                >
                  Putuskan
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate">
              Sambungkan sekali, lalu setiap formulir yang ditandatangani tamu langsung masuk ke spreadsheet tim. Formulir yang sudah ada ikut dikirim.
            </p>
          )}
        </div>
      </div>

      <details open={!status.connected} className="group rounded-card ring-1 ring-mist">
        <summary className="cursor-pointer list-none px-4 py-3 font-bold text-abyss [&::-webkit-details-marker]:hidden">
          <span className="inline-block w-5 text-teal transition-transform group-open:rotate-90">›</span>
          {status.connected ? "Ganti spreadsheet atau pasang ulang skrip" : "Cara menyambungkan Google Sheets (sekitar 5 menit)"}
        </summary>
        <div className="grid gap-4 border-t border-mist px-4 py-4">
          <ol className="grid list-decimal gap-2.5 pl-5 text-sm text-abyss marker:font-bold marker:text-teal">
            <li>
              Buka <span className="font-semibold">sheets.google.com</span> dengan akun Google tim, lalu buat spreadsheet baru (misalnya Dragonet Divers
              Waivers). Spreadsheet yang sudah ada juga bisa, website membuat lembar Diving Waivers sendiri di dalamnya.
            </li>
            <li>
              Di spreadsheet itu klik <span className="font-semibold">Extensions</span> lalu <span className="font-semibold">Apps Script</span>. Hapus
              semua isi Code.gs, tempel skrip di bawah (tombol Salin skrip), lalu klik ikon simpan.
            </li>
            <li>
              Klik <span className="font-semibold">Deploy</span>, <span className="font-semibold">New deployment</span>, ikon roda gigi, pilih{" "}
              <span className="font-semibold">Web app</span>. Execute as diisi <span className="font-semibold">Me</span>, Who has access diisi{" "}
              <span className="font-semibold">Anyone</span>, lalu Deploy. Saat diminta izin klik Authorize access dan pilih akun tim (bila muncul
              peringatan Google hasn&apos;t verified this app, klik Advanced lalu Go to project).
            </li>
            <li>
              Salin <span className="font-semibold">Web app URL</span> yang berakhiran /exec, tempel di kolom paling bawah, lalu klik Sambungkan.
              Website menguji alamatnya, menyiapkan lembar Diving Waivers, lalu mengirim semua formulir.
            </li>
          </ol>

          <div className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-abyss">Skrip untuk Apps Script</span>
              <button type="button" onClick={copy} className={SECONDARY}>
                {copied ? "Skrip disalin" : "Salin skrip"}
              </button>
            </div>
            <pre className="max-h-56 overflow-auto rounded-input bg-abyss p-3 font-mono text-xs leading-relaxed text-white/90">{script}</pre>
            <p className="text-xs text-slate">
              Skrip berisi kode rahasia khusus website ini, jadi jangan dibagikan. Kalau skripnya pernah diubah, tempel ulang lalu Deploy, Manage
              deployments, ikon pensil, Version diisi New version.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              act("connect", { url });
            }}
            className="grid gap-2"
          >
            <label htmlFor="sheet-url" className="text-sm font-semibold text-abyss">
              Web app URL
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                id="sheet-url"
                type="url"
                inputMode="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/…/exec"
                className={`${INPUT} min-w-0 flex-1 basis-72 font-mono text-sm`}
                required
              />
              <button type="submit" disabled={Boolean(busy)} className={PRIMARY}>
                {busy === "connect" ? "Menguji…" : "Sambungkan"}
              </button>
            </div>
          </form>
        </div>
      </details>

      {message.text && (
        <p role={message.error ? "alert" : "status"} className={`text-sm font-semibold ${message.error ? "text-danger" : "text-success"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
