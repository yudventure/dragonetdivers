"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { maintenanceText } from "@/content/maintenance";
import { LOCKABLE_PAGES, LOCKABLE_SECTIONS, lockCount, OPERATOR_COOKIE } from "@/lib/developer";
import { INPUT } from "./RecordManager";

const AREA = "min-h-24 w-full rounded-input border border-line-strong bg-white px-3 py-2 text-abyss outline-none focus:border-teal focus:ring-3 focus:ring-lagoon/40";
const BOX = "grid content-start gap-4 rounded-card bg-white p-5 shadow-[0_1px_2px_rgb(10_50_59/0.05)] ring-1 ring-mist";

function Check({ checked, onChange, disabled, children, hint }) {
  return (
    <label className={`flex items-start gap-3 rounded-input px-3 py-2.5 ring-1 ring-mist ${disabled ? "opacity-50" : "cursor-pointer hover:bg-foam"}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 accent-teal" />
      <span className="grid gap-0.5">
        <span className="text-[15px] font-semibold text-abyss">{children}</span>
        {hint && <span className="text-xs text-slate">{hint}</span>}
      </span>
    </label>
  );
}

const toggle = (list, key, on) => (on ? [...new Set([...list, key])] : list.filter((k) => k !== key));

function statusText(d) {
  if (!d.enabled) return "Mati. Semua halaman terbuka untuk pengunjung.";
  if (d.site) return "Aktif. Seluruh website ditutup untuk pengunjung.";
  const count = lockCount(d);
  return count ? `Aktif. ${count} kunci berlaku untuk pengunjung.` : "Aktif, tetapi belum ada yang ditutup.";
}

// Form /admin/developer. Memilih kunci saat mode developer mati langsung menyalakannya; mematikan mode
// developer membuka semua kunci tanpa menghapus pilihannya.
export default function DeveloperSettings({ initial }) {
  const router = useRouter();
  const [d, setD] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [state, setState] = useState({ busy: false, message: "", ok: false });
  const set = (patch) => setD((v) => ({ ...v, ...patch }));
  const lock = (patch) => setD((v) => ({ ...v, ...patch, enabled: true }));
  const changed = JSON.stringify(d) !== JSON.stringify(saved);

  // Bilah operator di situs publik hanya muncul bila peramban ini ditandai pernah masuk /admin.
  useEffect(() => {
    document.cookie = `${OPERATOR_COOKIE}=1; path=/; max-age=${12 * 3600}; samesite=lax`;
  }, []);

  async function save(event) {
    event.preventDefault();
    setState({ busy: true, message: "", ok: false });
    const response = await fetch("/api/admin/developer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ developer: d }) });
    const result = await response.json().catch(() => ({}));
    if (response.ok) {
      setD(result.developer);
      setSaved(result.developer);
      router.refresh();
    }
    setState({ busy: false, ok: response.ok, message: response.ok ? "Tersimpan. Berlaku untuk pengunjung dalam beberapa detik." : result.error || "Belum tersimpan." });
  }

  return (
    <form onSubmit={save} className="grid gap-6">
      <section className={BOX}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-1">
            <h2 className="text-xl text-abyss">Status</h2>
            <p className={`text-sm font-semibold ${saved.enabled ? "text-ember" : "text-success"}`}>{statusText(saved)}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={d.enabled}
            onClick={() => set({ enabled: !d.enabled })}
            className="flex items-center gap-3 rounded-full py-1 pr-1 pl-4 text-sm font-bold text-abyss ring-1 ring-mist hover:bg-foam"
          >
            Mode developer {d.enabled ? "aktif" : "mati"}
            <span className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors duration-200 ${d.enabled ? "bg-teal" : "bg-mist"}`}>
              <span className={`size-5 rounded-full bg-white shadow-float transition-transform duration-200 ${d.enabled ? "translate-x-5" : ""}`} />
            </span>
          </button>
        </div>
        <p className="text-sm text-slate">
          Setelah disimpan, buka{" "}
          <a href="/?pratinjau=pengunjung" target="_blank" rel="noopener" className="font-semibold text-teal underline underline-offset-4">
            situs seperti pengunjung
          </a>{" "}
          untuk memeriksa hasilnya selama 30 menit. Bilah di bawah layar situs membawa kamu kembali ke tampilan admin.
        </p>
      </section>

      <section className={BOX}>
        <h2 className="text-xl text-abyss">Yang ditutup</h2>
        <Check checked={d.site} onChange={(on) => (on ? lock({ site: true }) : set({ site: false }))} hint="Semua halaman, termasuk checkout. Halaman status pesanan tetap terbuka.">
          Tutup seluruh website
        </Check>
        <div className="grid gap-2">
          <h3 className="font-sans text-sm font-bold text-slate">Halaman</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {LOCKABLE_PAGES.map(([key, label, path]) => (
              <Check key={key} checked={d.site || d.pages.includes(key)} disabled={d.site} onChange={(on) => (on ? lock : set)({ pages: toggle(d.pages, key, on) })} hint={path === "/checkout" ? "Halaman checkout dan pemesanan baru" : path}>
                {label}
              </Check>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <h3 className="font-sans text-sm font-bold text-slate">Bagian beranda</h3>
          <p className="text-xs text-slate">Bagian yang ditutup diganti kartu &ldquo;sedang diperbarui&rdquo;, bagian lain tetap tampil.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {LOCKABLE_SECTIONS.map(([key, label]) => (
              <Check
                key={key}
                checked={d.site || d.pages.includes("home") || d.sections.includes(key)}
                disabled={d.site || d.pages.includes("home")}
                onChange={(on) => (on ? lock : set)({ sections: toggle(d.sections, key, on) })}
              >
                {label}
              </Check>
            ))}
          </div>
        </div>
      </section>

      <section className={BOX}>
        <h2 className="text-xl text-abyss">Pesan untuk pengunjung</h2>
        <p className="text-sm text-slate">Boleh dikosongkan. Tanpa pesan, halaman perawatan memakai teks bawaan di bawah ini. Pengunjung halaman Mandarin dan Korea melihat pesan English, atau teks bawaan dalam bahasanya bila kosong.</p>
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            ["id", "Bahasa Indonesia"],
            ["en", "English"],
          ].map(([lang, label]) => (
            <label key={lang} className="grid content-start gap-1.5">
              <span className="text-sm font-semibold text-abyss">{label}</span>
              <textarea
                value={d.message[lang]}
                maxLength={400}
                onChange={(e) => set({ message: { ...d.message, [lang]: e.target.value } })}
                placeholder={maintenanceText[lang].siteText}
                className={AREA}
              />
            </label>
          ))}
        </div>
        <label className="grid max-w-xs content-start gap-1.5">
          <span className="text-sm font-semibold text-abyss">Perkiraan selesai (WIT)</span>
          <input type="datetime-local" value={d.until} onChange={(e) => set({ until: e.target.value })} className={INPUT} />
          <span className="text-xs text-slate">Tampil di halaman perawatan. Boleh dikosongkan.</span>
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={state.busy || !changed}
          className="inline-flex h-11 items-center rounded-full bg-teal px-6 font-bold text-white hover:bg-teal-dark disabled:bg-mist disabled:text-slate"
        >
          {state.busy ? "Menyimpan…" : "Simpan"}
        </button>
        {state.message && !(state.ok && changed) ? (
          <span className={`text-sm font-semibold ${state.ok ? "text-success" : "text-danger"}`}>{state.message}</span>
        ) : (
          changed && !state.busy && <span className="text-sm text-slate">Ada perubahan yang belum disimpan.</span>
        )}
      </div>
    </form>
  );
}
