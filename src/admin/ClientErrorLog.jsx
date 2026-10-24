"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const wit = (iso) =>
  `${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jayapura" }).format(new Date(iso))} WIT`;

/** Galat terakhir di peramban admin (dicatat app/admin/error.jsx), untuk dikirim ke developer bila perlu. */
export default function ClientErrorLog({ errors }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function clear() {
    if (!window.confirm("Hapus semua catatan galat?")) return;
    setBusy(true);
    await fetch("/api/admin/client-error", { method: "DELETE" }).catch(() => {});
    setBusy(false);
    router.refresh();
  }

  return (
    <section className="grid gap-3 rounded-card bg-white p-5 ring-1 ring-mist">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <h2 className="text-xl text-abyss">Galat di peramban admin</h2>
          <p className="text-sm text-slate">
            Dicatat otomatis bila halaman admin gagal tampil (lalu dimuat ulang sendiri). Kirim tangkapan layar daftar ini ke developer bila ada
            masalah yang berulang.
          </p>
        </div>
        {errors.length > 0 && (
          <button type="button" onClick={clear} disabled={busy} className="inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold text-danger hover:bg-danger/10">
            Hapus catatan
          </button>
        )}
      </div>
      {errors.length === 0 ? (
        <p className="rounded-input bg-foam px-3 py-2 text-sm text-slate">Belum ada galat tercatat.</p>
      ) : (
        <ul className="grid gap-2">
          {errors.map((e) => (
            <li key={`${e.at}-${e.message}`} className="grid gap-1 rounded-input bg-foam p-3 text-sm">
              <span className="flex flex-wrap gap-x-3 text-xs text-slate">
                <span className="font-semibold text-abyss">{wit(e.at)}</span>
                {e.url && <span className="font-mono">{e.url}</span>}
                {e.digest && <span className="font-mono">{e.digest}</span>}
              </span>
              <span className="font-mono text-xs break-words text-abyss">{e.message}</span>
              {e.stack && <span className="font-mono text-[11px] break-words text-slate">{e.stack}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
