"use client";

import { useEffect, useState } from "react";
import { CloseIcon, LockIcon } from "@/components/icons";

// Bilah kecil untuk operator saat mode developer aktif (Bahasa Indonesia saja, seperti /admin). Status
// hanya ditanyakan ke /api/developer bila peramban ini pernah masuk /admin (cookie dd_operator) atau
// sedang pratinjau, jadi pengunjung biasa tidak membuat permintaan tambahan.
const HINT = /(?:^|;\s*)(?:dd_operator|dd_pratinjau)=/;
const LINK = "font-bold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white";

export default function DeveloperBar() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!HINT.test(document.cookie)) return;
    let alive = true;
    fetch("/api/developer", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body) => alive && body?.show && setStatus(body))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!status) return null;
  const detail = status.site ? "Seluruh website ditutup untuk pengunjung." : `${status.count} kunci aktif untuk pengunjung.`;
  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto flex max-w-fit flex-wrap items-center gap-x-4 gap-y-1 rounded-card bg-abyss py-2.5 pr-2 pl-4 text-sm text-white shadow-float sm:rounded-full"
    >
      <span className="flex items-center gap-2 font-bold">
        <LockIcon className="size-4" />
        {status.preview ? "Pratinjau pengunjung" : "Mode developer aktif"}
      </span>
      {status.preview ? (
        <a href="?pratinjau=admin" className={LINK}>
          Kembali ke tampilan admin
        </a>
      ) : (
        <>
          <span className="text-white/80">{detail}</span>
          <a href="?pratinjau=pengunjung" className={LINK}>
            Lihat seperti pengunjung
          </a>
          <a href="/admin/developer" className={LINK}>
            Atur
          </a>
        </>
      )}
      <button type="button" onClick={() => setStatus(null)} aria-label="Tutup bilah" className="grid size-8 place-items-center rounded-full hover:bg-white/10">
        <CloseIcon className="size-4" />
      </button>
    </div>
  );
}
