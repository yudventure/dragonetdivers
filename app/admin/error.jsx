"use client";

import { useEffect, useState } from "react";
import { shouldAutoReload } from "@/lib/client-errors";

const KEY = "dd_admin_reload";

/** Waktu muat ulang otomatis terakhir (ms), 0 bila belum pernah, atau null bila sessionStorage tidak bisa dipakai. */
function lastReload() {
  try {
    return Number(sessionStorage.getItem(KEY)) || 0;
  } catch {
    return null;
  }
}

// Penangkap galat halaman admin. Laporan pemilik Oktober 2026: setelah Simpan di galeri muncul layar bawaan
// "This page couldn't load", padahal Reload berhasil. Di sini galatnya dilaporkan ke server
// (/api/admin/client-error, tampil di /admin/developer), lalu halaman dimuat ulang penuh sekali secara
// otomatis. Bila galat muncul lagi dalam semenit, kartu ini tampil dengan pesannya dan tombol muat ulang.
export default function AdminError({ error, reset }) {
  const [reloading, setReloading] = useState(false);
  const message = String(error?.message || error || "Galat tidak dikenal");

  useEffect(() => {
    const report = JSON.stringify({
      message,
      digest: error?.digest ?? "",
      stack: String(error?.stack ?? ""),
      url: `${window.location.pathname}${window.location.search}`,
      agent: navigator.userAgent,
    });
    try {
      const sent = navigator.sendBeacon?.("/api/admin/client-error", new Blob([report], { type: "application/json" }));
      if (!sent) fetch("/api/admin/client-error", { method: "POST", body: report, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    } catch {} // laporan tidak boleh menambah galat
    if (shouldAutoReload(lastReload())) {
      try {
        sessionStorage.setItem(KEY, String(Date.now()));
      } catch {}
      setReloading(true);
      window.location.reload();
    }
  }, [error, message]);

  return (
    <main className="grid min-h-dvh place-items-center bg-foam p-6">
      <section role="alert" className="grid w-full max-w-lg gap-4 rounded-card bg-white p-6 shadow-float ring-1 ring-mist sm:p-8">
        <h1 className="text-2xl text-abyss">{reloading ? "Memuat ulang halaman…" : "Halaman admin perlu dimuat ulang"}</h1>
        <p className="text-slate">
          Data yang sudah berhasil disimpan tidak hilang. Muat ulang halaman untuk melanjutkan. Bila pesan ini terus muncul, kirim tangkapan layar
          pesan di bawah ke developer.
        </p>
        <p className="rounded-input bg-foam px-3 py-2 font-mono text-xs break-words text-abyss">
          {message}
          {error?.digest ? ` · ${error.digest}` : ""}
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-11 items-center rounded-full bg-teal px-5 font-bold text-white hover:bg-teal-dark"
          >
            Muat ulang halaman
          </button>
          <button type="button" onClick={() => reset()} className="inline-flex h-11 items-center rounded-full px-5 font-bold text-teal ring-1 ring-teal hover:bg-teal-soft">
            Coba lagi
          </button>
        </div>
      </section>
    </main>
  );
}
