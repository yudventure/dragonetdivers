"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckIcon, SearchIcon } from "@/components/icons";
import { googleVerificationsOf } from "@/lib/seo";
import { INPUT } from "./RecordManager";

const BOX = "grid content-start gap-5 rounded-card bg-white p-5 shadow-[0_1px_2px_rgb(10_50_59/0.05)] ring-1 ring-mist sm:p-6";
const OUTLINE = "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold text-teal ring-1 ring-teal transition-colors duration-200 ease-brand hover:bg-teal-soft";
const CONSOLE = "https://search.google.com/search-console";

function CopyButton({ value, label = "Salin" }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={OUTLINE}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          setDone(false);
        }
      }}
    >
      {done ? <CheckIcon className="size-4" /> : null}
      {done ? "Disalin" : label}
    </button>
  );
}

function Address({ value }) {
  return <code className="min-w-0 rounded-input bg-foam px-3 py-2 font-mono text-sm break-all text-abyss ring-1 ring-mist">{value}</code>;
}

function Chip({ ok, children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${ok ? "bg-success/10 text-success" : "bg-foam text-slate ring-1 ring-mist"}`}
    >
      {ok && <CheckIcon className="size-3.5" />}
      {children}
    </span>
  );
}

const lines = (codes) => (codes ? codes.split(" ").join("\n") : "");

/**
 * /admin/google: status pendaftaran, langkah di Google Search Console, langkah pindah domain, dan kolom kode
 * verifikasi tag HTML (bisa beberapa, satu per baris). Kode disimpan lewat /api/admin/google dan langsung
 * dipasang di <head> beranda (app/[lang]/layout.jsx). oldUrls = domain lama yang dialihkan ke siteUrl.
 */
export default function GoogleSearchConsole({ initial, siteUrl, oldUrls = [], pages }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [value, setValue] = useState(lines(initial));
  const [state, setState] = useState({ busy: false, ok: false, message: "" });
  const sitemap = `${siteUrl}/sitemap.xml`;
  const robots = `${siteUrl}/robots.txt`;
  const typed = googleVerificationsOf(value);
  const savedCodes = saved ? saved.split(" ") : [];

  async function save(code) {
    setState({ busy: true, ok: false, message: "" });
    const response = await fetch("/api/admin/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => null);
    const result = await response?.json().catch(() => ({}));
    if (!response?.ok) return setState({ busy: false, ok: false, message: result?.error || "Belum tersimpan. Coba lagi." });
    setSaved(result.code);
    setValue(lines(result.code));
    setState({
      busy: false,
      ok: true,
      message: result.code
        ? "Kode tersimpan dan sudah terpasang di beranda. Sekarang klik Verifikasi (Verify) di Search Console."
        : "Kode dihapus dari beranda.",
    });
    router.refresh();
  }

  const steps = [
    {
      text: "Buka Google Search Console dan masuk dengan akun Google dive center.",
      action: (
        <a href={CONSOLE} target="_blank" rel="noopener" className={`${OUTLINE} justify-self-start`}>
          Buka Search Console ↗
        </a>
      ),
    },
    {
      text: "Pilih Tambahkan properti (Add property), lalu Awalan URL (URL prefix) di sebelah kanan, isi alamat website ini, dan klik Lanjutkan (Continue).",
      action: (
        <div className="flex flex-wrap items-center gap-2">
          <Address value={siteUrl} />
          <CopyButton value={siteUrl} />
        </div>
      ),
    },
    { text: "Di bagian Metode verifikasi lainnya (Other verification methods), buka Tag HTML (HTML tag) lalu klik Salin (Copy)." },
    { text: "Tempel di kolom Kode verifikasi di halaman ini, lalu klik Simpan kode." },
    { text: "Kembali ke Search Console dan klik Verifikasi (Verify). Biarkan kodenya tetap tersimpan di sini, karena Google memeriksanya lagi sesekali." },
    {
      text: "Buka menu Peta Situs (Sitemaps), tulis sitemap.xml, lalu klik Kirim (Submit). Data pencarian pertama biasanya muncul beberapa hari kemudian.",
      action: (
        <div className="flex flex-wrap items-center gap-2">
          <Address value={sitemap} />
          <CopyButton value={sitemap} />
        </div>
      ),
    },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
      {oldUrls.length > 0 && (
        <MoveSteps siteUrl={siteUrl} oldUrls={oldUrls} sitemap={sitemap} />
      )}
      <section className={BOX} aria-labelledby="gsc-steps">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-teal-soft text-teal">
            <SearchIcon className="size-5" />
          </span>
          <div className="grid gap-0.5">
            <h2 id="gsc-steps" className="text-xl text-abyss">
              Langkah pendaftaran
            </h2>
            <p className="text-sm text-slate">Cukup sekali. Setelah terverifikasi, Search Console menampilkan kata kunci, jumlah klik, dan halaman yang muncul di Google.</p>
          </div>
        </div>
        <ol className="grid gap-4">
          {steps.map((step, i) => (
            <li key={step.text} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-abyss text-sm font-bold text-white">{i + 1}</span>
              <div className="grid gap-2 pt-1">
                <p className="text-abyss">{step.text}</p>
                {step.action}
              </div>
            </li>
          ))}
        </ol>
        <p className="rounded-input bg-foam p-4 text-sm text-slate ring-1 ring-mist">
          Memilih properti Domain? Verifikasinya lewat data TXT di DNS domain (hPanel, menu Domain lalu DNS / Nameserver), jadi kolom kode di sini
          boleh dibiarkan kosong. Sitemap tetap dikirim seperti langkah 6.
        </p>
      </section>

      <aside className="grid gap-6 xl:sticky xl:top-28 xl:col-start-2 xl:row-span-2 xl:row-start-1">
        <form
          className={BOX}
          onSubmit={(e) => {
            e.preventDefault();
            save(value);
          }}
        >
          <div className="grid gap-1">
            <h2 className="text-xl text-abyss">Kode verifikasi</h2>
            <p className="text-sm text-slate">
              Tempel seluruh tag dari Search Console atau kodenya saja. Bisa lebih dari satu, satu per baris (mis. kode properti domain lama dan
              domain baru).
            </p>
          </div>
          <label className="grid gap-2">
            <span className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-abyss">
              Kode verifikasi Google
              {saved ? <Chip ok>{savedCodes.length > 1 ? `${savedCodes.length} kode terpasang` : "Terpasang di beranda"}</Chip> : <Chip>Belum diisi</Chip>}
            </span>
            <textarea
              id="site-googleVerification"
              value={value}
              rows={4}
              onChange={(e) => {
                setValue(e.target.value);
                if (state.message) setState({ busy: false, ok: false, message: "" });
              }}
              placeholder='<meta name="google-site-verification" content="..." />'
              spellCheck={false}
              autoComplete="off"
              aria-invalid={value.trim() && typed === null ? true : undefined}
              className={`${INPUT} h-auto py-2.5 font-mono text-sm leading-relaxed`}
            />
          </label>
          {saved && (
            <div className="grid gap-1 text-xs text-slate">
              Yang terpasang di beranda
              {savedCodes.map((code) => (
                <code key={code} className="rounded-input bg-foam px-3 py-2 font-mono break-all text-abyss ring-1 ring-mist">{`<meta name="google-site-verification" content="${code}">`}</code>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={state.busy || !value.trim() || (typed !== null && typed.join(" ") === saved)}
              className="inline-flex h-11 items-center justify-center rounded-full bg-teal px-6 font-bold text-white hover:bg-teal-dark disabled:bg-mist disabled:text-slate"
            >
              {state.busy ? "Menyimpan…" : "Simpan kode"}
            </button>
            {saved && (
              <button
                type="button"
                disabled={state.busy}
                onClick={() => save("")}
                className="inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-bold text-danger ring-1 ring-danger/40 transition-colors duration-200 ease-brand hover:bg-danger/5 disabled:opacity-50"
              >
                {savedCodes.length > 1 ? "Hapus semua kode" : "Hapus kode"}
              </button>
            )}
          </div>
          {state.message && (
            <p role={state.ok ? "status" : "alert"} className={`text-sm font-semibold ${state.ok ? "text-success" : "text-danger"}`}>
              {state.message}
            </p>
          )}
        </form>

        <section className={BOX} aria-labelledby="gsc-files">
          <div className="grid gap-1">
            <h2 id="gsc-files" className="text-xl text-abyss">
              Yang sudah disiapkan
            </h2>
            <p className="text-sm text-slate">Dibuat otomatis dan selalu mengikuti layanan yang tampil di website.</p>
          </div>
          <ul className="grid gap-3 text-sm">
            <li className="grid gap-2">
              <span className="flex flex-wrap items-center gap-2 font-semibold text-abyss">
                Sitemap <Chip ok>{pages} halaman</Chip>
              </span>
              <span className="text-slate">
                Beranda dan halaman layanan dalam English, Indonesia, Mandarin, dan Korea.
                {oldUrls.length > 0 && ` Dibuka lewat ${oldUrls.map((u) => u.replace("https://", "")).join(" atau ")}, isinya alamat domain lama yang dialihkan ke ${siteUrl.replace(/^https?:\/\//, "")}.`}
              </span>
              <a href={sitemap} target="_blank" rel="noopener" className="font-semibold break-all text-teal underline underline-offset-2">
                {sitemap}
              </a>
            </li>
            <li className="grid gap-2">
              <span className="flex flex-wrap items-center gap-2 font-semibold text-abyss">
                robots.txt <Chip ok>Siap</Chip>
              </span>
              <span className="text-slate">Semua halaman publik boleh dibaca Google, dashboard admin tidak.</span>
              <a href={robots} target="_blank" rel="noopener" className="font-semibold break-all text-teal underline underline-offset-2">
                {robots}
              </a>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

/**
 * Langkah pindah domain di Search Console (pemilik, akhir Oktober 2026: dragonetdivers.com → domain utama).
 * Properti lama tetap disimpan dan terverifikasi (kodenya tetap terpasang di sini), lalu Perubahan alamat
 * (Change of address) memindahkan hasil pencarian ke properti baru. Sitemap domain lama otomatis berisi
 * alamat lama yang dialihkan (app/sitemap.js).
 */
function MoveSteps({ siteUrl, oldUrls, sitemap }) {
  const oldNames = oldUrls.map((u) => u.replace("https://", "")).join(" atau ");
  const steps = [
    {
      text: `Di Search Console tambahkan properti baru Awalan URL (URL prefix) untuk domain baru. Properti lama ${oldNames} jangan dihapus.`,
      action: (
        <div className="flex flex-wrap items-center gap-2">
          <Address value={siteUrl} />
          <CopyButton value={siteUrl} />
        </div>
      ),
    },
    {
      text: "Pilih Tag HTML (HTML tag), salin tagnya, lalu tempel di kolom Kode verifikasi pada baris baru di bawah kode lama. Kode lama jangan dihapus, supaya properti lama tetap terverifikasi. Klik Simpan kode, lalu Verifikasi (Verify).",
    },
    {
      text: "Di properti baru buka Peta Situs (Sitemaps), tulis sitemap.xml, lalu klik Kirim (Submit).",
      action: (
        <div className="flex flex-wrap items-center gap-2">
          <Address value={sitemap} />
          <CopyButton value={sitemap} />
        </div>
      ),
    },
    {
      text: `Di properti lama ${oldNames} buka Setelan (Settings), lalu Perubahan alamat (Change of address). Pilih properti baru, klik Validasi dan perbarui (Validate & update). Google memindahkan hasil pencarian ke domain baru dalam beberapa minggu.`,
    },
    {
      text: `Sitemap di properti lama biarkan saja. Sitemap itu sekarang berisi alamat ${oldNames} yang dialihkan ke domain baru, jadi Google cepat menemukan pengalihannya. Biarkan ${oldNames} tetap tersambung ke website (Parked Domain) paling tidak setahun.`,
    },
  ];
  return (
    <section className={BOX} aria-labelledby="gsc-move">
      <div className="grid gap-1">
        <h2 id="gsc-move" className="text-xl text-abyss">
          Pindah domain
        </h2>
        <p className="text-sm text-slate">
          Website sudah pindah dari {oldNames} ke {siteUrl.replace(/^https?:\/\//, "")}. Lakukan sekali supaya Google memindahkan hasil
          pencarian ke domain baru.
        </p>
      </div>
      <ol className="grid gap-4">
        {steps.map((step, i) => (
          <li key={step.text} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3">
            <span className="grid size-8 place-items-center rounded-full bg-teal text-sm font-bold text-white">{i + 1}</span>
            <div className="grid gap-2 pt-1">
              <p className="text-abyss">{step.text}</p>
              {step.action}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
