"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TrashIcon } from "@/components/icons";
import { ARRIVALS, canTrash } from "@/lib/waiver-review";

// Tombol meja peninjauan formulir selam (permintaan pemilik 16 November 2026): konfirmasi kedatangan, pindahkan
// ke sampah (hanya uji coba atau tidak datang), pulihkan, dan hapus permanen. Lewat /api/admin/waivers/<kode>,
// lalu halaman dimuat ulang datanya (router.refresh).

const TONE = {
  "": "bg-white text-slate ring-mist",
  datang: "bg-success/10 text-success ring-success/40",
  tidak: "bg-sunrise-wash text-ember ring-sunrise",
  uji: "bg-lagoon-wash text-lagoon ring-lagoon/40",
};

async function send(code, init) {
  const response = await fetch(`/api/admin/waivers/${code}`, {
    ...init,
    headers: { "Content-Type": "application/json" },
  }).catch(() => null);
  const result = (await response?.json().catch(() => null)) ?? {};
  if (!response?.ok) throw new Error(result.error || "Belum berhasil. Periksa koneksi lalu coba lagi.");
}

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  // then = alamat tujuan setelah berhasil (mis. kembali ke sampah setelah hapus permanen dari halaman detail).
  const run = async (name, task, then) => {
    setBusy(name);
    try {
      await task();
      if (then) router.push(then);
      else router.refresh();
    } catch (error) {
      window.alert(error.message);
    } finally {
      setBusy("");
    }
  };
  return [busy, run];
}

/** Pilihan kedatangan berwarna: Belum dikonfirmasi, Datang, Tidak datang, Uji coba. */
export function ArrivalSelect({ code, arrival = "", name }) {
  const [value, setValue] = useState(arrival);
  const [busy, run] = useAction();
  return (
    <select
      aria-label={`Kedatangan ${name}`}
      value={value}
      disabled={Boolean(busy)}
      onChange={(e) => {
        const next = e.target.value;
        const previous = value;
        setValue(next);
        run("arrival", async () => {
          try {
            await send(code, { method: "POST", body: JSON.stringify({ action: "arrival", arrival: next }) });
          } catch (error) {
            setValue(previous);
            throw error;
          }
        });
      }}
      className={`h-8 w-full max-w-[9.5rem] cursor-pointer rounded-full px-2.5 text-xs font-bold ring-1 outline-none focus-visible:ring-2 focus-visible:ring-lagoon disabled:opacity-60 ${TONE[value] ?? TONE[""]}`}
    >
      {Object.entries(ARRIVALS).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  );
}

/** Pindahkan ke sampah. Aktif hanya untuk uji coba atau tidak datang; selain itu keterangannya di tooltip. */
export function TrashButton({ code, name, arrival, label = false }) {
  const [busy, run] = useAction();
  const allowed = canTrash({ arrival });
  const hint = allowed ? `Pindahkan formulir ${name} ke sampah` : "Ubah kedatangan menjadi Tidak datang atau Uji coba dulu untuk memindahkan ke sampah";
  return (
    <button
      type="button"
      title={hint}
      aria-label={hint}
      disabled={!allowed || Boolean(busy)}
      onClick={() =>
        window.confirm(`Pindahkan formulir ${name} (${code}) ke sampah?\n\nFormulir di sampah tidak tampil di daftar dan rekap, dan masih bisa dipulihkan.`) &&
        run("trash", () => send(code, { method: "POST", body: JSON.stringify({ action: "trash" }) }))
      }
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-full text-xs font-bold ring-1 transition-colors duration-200 ease-brand disabled:cursor-not-allowed disabled:opacity-35 ${
        label ? "px-3" : "w-8"
      } bg-white text-danger ring-mist enabled:hover:bg-danger/10 enabled:hover:ring-danger/40`}
    >
      <TrashIcon className="size-4" />
      {label && (busy ? "Memindahkan…" : "Pindahkan ke sampah")}
    </button>
  );
}

/**
 * Tombol di tampilan Sampah: pulihkan ke meja peninjauan, atau hapus permanen. deletedHref = tujuan setelah hapus
 * permanen bila dibuka dari halaman detail formulir (halamannya tidak ada lagi).
 */
export function TrashedActions({ code, name, deletedHref }) {
  const [busy, run] = useAction();
  return (
    <span className="flex flex-wrap gap-1.5">
      <button
        type="button"
        disabled={Boolean(busy)}
        onClick={() => run("restore", () => send(code, { method: "POST", body: JSON.stringify({ action: "restore" }) }))}
        className="inline-flex h-8 items-center rounded-full bg-teal px-3 text-xs font-bold whitespace-nowrap text-white hover:bg-teal-dark disabled:opacity-60"
      >
        {busy === "restore" ? "Memulihkan…" : "Pulihkan"}
      </button>
      <button
        type="button"
        disabled={Boolean(busy)}
        onClick={() =>
          window.confirm(`Hapus permanen formulir ${name} (${code})?\n\nTanda tangan dan isinya terhapus dari website dan tidak bisa dikembalikan.`) &&
          run("delete", () => send(code, { method: "DELETE" }), deletedHref)
        }
        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-bold whitespace-nowrap text-danger ring-1 ring-danger/40 hover:bg-danger/10 disabled:opacity-60"
      >
        <TrashIcon className="size-4" />
        {busy === "delete" ? "Menghapus…" : "Hapus permanen"}
      </button>
    </span>
  );
}
