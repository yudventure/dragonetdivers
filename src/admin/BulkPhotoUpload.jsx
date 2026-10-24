"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CloseIcon, ImageIcon, UploadIcon } from "@/components/icons";
import { MAX_BATCH, prepareImage } from "@/lib/image-prep";
import { photoAdvice, TILE_GUIDE, tileFor } from "@/lib/media-guide";
import { SIZES } from "@/lib/modules/site";
import { INPUT } from "./RecordManager";
import { discardUpload, saveGalleryPhotos, uploadPhoto } from "./upload";

// Dua foto diunggah bersamaan; server mengolahnya satu per satu (src/server/media.js).
const PARALLEL = 2;
const ACCEPT = "image/*,.heic,.heif";
const SOLID = "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-teal px-5 font-bold text-white hover:bg-teal-dark disabled:bg-mist disabled:text-slate";
const ADVICE_TONE = { fair: "text-ember", small: "text-danger" };
// Keterangan awal untuk semua foto; bisa diganti di panel atau per foto.
const SHARED = { id: "Raja Ampat bersama Dragonet Divers", en: "Raja Ampat with Dragonet Divers" };

const STATUS = {
  preparing: "Memperkecil…",
  waiting: "Menunggu giliran",
  uploading: "Mengunggah",
  done: "Terunggah",
  error: "Gagal",
};
const kb = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);
let counter = 0;

/**
 * Panel "Tambah foto" di /admin/situs: pilih atau tarik satu sampai 40 foto sekaligus. Tiap foto diperkecil
 * di perangkat (src/lib/image-prep.js), diunggah dua-dua dengan progres dan coba ulang otomatis
 * (src/admin/upload.js), lalu semua disimpan ke galeri dengan satu tombol. Keterangan umum dipakai foto
 * yang keterangannya dikosongkan. Foto yang dihapus dari panel atau dibatalkan ikut dihapus dari server.
 * minOrder = urutan terkecil di galeri, supaya foto baru tampil paling depan sesuai urutan dipilih.
 */
export default function BulkPhotoUpload({ minOrder = 0, onDone, onCancel }) {
  const [entries, setEntries] = useState([]);
  const [shared, setShared] = useState({ ...SHARED, active: true });
  const [over, setOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const panel = useRef(null);
  const picker = useRef(null);
  const files = useRef(new Map()); // key → File siap unggah
  const queue = useRef([]);
  const running = useRef(0);
  const preparing = useRef(Promise.resolve());
  const latest = useRef(entries);
  latest.current = entries;

  const update = (key, patch) => setEntries((list) => list.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  const busy = entries.some((e) => ["preparing", "waiting", "uploading"].includes(e.status));
  const done = entries.filter((e) => e.status === "done");
  const failed = entries.filter((e) => e.status === "error");

  useEffect(() => panel.current?.scrollIntoView({ behavior: "smooth", block: "start" }), []);
  // Peringatan bila halaman ditutup saat foto masih diunggah atau belum disimpan.
  useEffect(() => {
    if (!busy && !done.length) return;
    const warn = (event) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy, done.length]);
  useEffect(() => () => latest.current.forEach((e) => e.preview && URL.revokeObjectURL(e.preview)), []);

  function pump() {
    while (running.current < PARALLEL && queue.current.length) {
      const key = queue.current.shift();
      const file = files.current.get(key);
      if (!file) continue;
      running.current += 1;
      update(key, { status: "uploading", progress: 0, retry: 0, error: "" });
      let shown = 0;
      uploadPhoto(file, {
        onProgress: (p) => {
          if (Math.abs(p - shown) < 0.05 && p < 1) return; // cukup tiap 5%
          shown = p;
          update(key, { progress: p });
        },
        onRetry: (n) => update(key, { retry: n }),
      })
        .then((saved) => {
          files.current.delete(key);
          update(key, { status: "done", progress: 1, mediaId: saved.id });
        })
        .catch((e) => update(key, { status: "error", error: e.message }))
        .finally(() => {
          running.current -= 1;
          pump();
        });
    }
  }

  function add(list) {
    setError("");
    const room = MAX_BATCH - latest.current.length;
    const picked = [...list].slice(0, Math.max(0, room));
    if (list.length > picked.length) setError(`Paling banyak ${MAX_BATCH} foto sekali unggah. ${list.length - picked.length} foto tidak ikut, unggah setelah ini.`);
    const fresh = picked.map((file) => ({ key: `f${++counter}`, name: file.name, status: "preparing", progress: 0, captionId: "", captionEn: "", size: "auto" }));
    setEntries((current) => [...current, ...fresh]);
    // Disiapkan satu per satu (membaca foto besar memakan memori, terutama di ponsel).
    for (const [i, file] of picked.entries()) {
      const key = fresh[i].key;
      preparing.current = preparing.current.then(async () => {
        const ready = await prepareImage(file).catch(() => ({ error: "Foto ini tidak bisa dibaca." }));
        if (!latest.current.some((e) => e.key === key)) return; // sudah dibuang dari panel
        if (ready.error) return update(key, { status: "error", error: ready.error, fatal: true });
        files.current.set(key, ready.file);
        update(key, { status: "waiting", preview: URL.createObjectURL(ready.file), width: ready.width, height: ready.height, bytes: ready.file.size, original: file.size });
        queue.current.push(key);
        pump();
      });
    }
  }

  function retry(entry) {
    queue.current.push(entry.key);
    update(entry.key, { status: "waiting", error: "" });
    pump();
  }

  function drop(entry) {
    files.current.delete(entry.key);
    queue.current = queue.current.filter((k) => k !== entry.key);
    if (entry.mediaId) discardUpload(entry.mediaId);
    if (entry.preview) URL.revokeObjectURL(entry.preview);
    setEntries((list) => list.filter((e) => e.key !== entry.key));
  }

  function cancel() {
    if (done.length && !window.confirm(`Batalkan ${done.length} foto yang sudah terunggah? Foto ini dihapus dan tidak masuk galeri.`)) return;
    queue.current = [];
    for (const e of latest.current) if (e.mediaId) discardUpload(e.mediaId);
    onCancel();
  }

  async function save() {
    const ready = latest.current.filter((e) => e.status === "done");
    const missing = ready.some((e) => !e.captionId.trim()) && !shared.id.trim();
    const missingEn = ready.some((e) => !e.captionEn.trim()) && !shared.en.trim();
    if (missing || missingEn) return setError("Isi keterangan umum (Indonesia dan English), atau keterangan di setiap foto.");
    setSaving(true);
    setError("");
    const start = Math.max(-999, Math.min(0, minOrder) - ready.length);
    const message = await saveGalleryPhotos(
      ready.map((e, i) => ({
        mediaId: e.mediaId,
        captionId: e.captionId.trim() || shared.id.trim(),
        captionEn: e.captionEn.trim() || shared.en.trim(),
        size: e.size,
        order: start + i,
        active: shared.active,
      })),
    );
    setSaving(false);
    if (message) return setError(message);
    if (failed.length || busy) {
      // Yang tersimpan dikeluarkan dari panel; yang gagal atau belum selesai tetap bisa dicoba lagi.
      setEntries((list) => list.filter((e) => e.status !== "done"));
      onDone({ keepOpen: true });
    } else onDone();
  }

  const summary = [
    done.length && `${done.length} terunggah`,
    entries.filter((e) => ["preparing", "waiting", "uploading"].includes(e.status)).length && `${entries.filter((e) => ["preparing", "waiting", "uploading"].includes(e.status)).length} sedang diproses`,
    failed.length && `${failed.length} gagal`,
  ].filter(Boolean);

  return (
    <section ref={panel} aria-labelledby="bulk-title" className="grid scroll-mt-28 gap-5 rounded-card bg-white p-5 shadow-float ring-2 ring-teal sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2 id="bulk-title" className="text-xl text-abyss">
            Tambah foto
          </h2>
          <p className="max-w-[70ch] text-sm text-slate">
            Pilih satu atau banyak foto sekaligus (paling banyak {MAX_BATCH}). Foto diperkecil dulu di perangkatmu, jadi unggahan cepat walau
            sinyal lemah, dan dicoba ulang otomatis bila koneksi putus.
          </p>
        </div>
        <button type="button" onClick={cancel} aria-label="Tutup panel" className="grid size-10 place-items-center rounded-full text-slate hover:bg-foam hover:text-abyss">
          <CloseIcon className="size-5" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => picker.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (e.dataTransfer.files?.length) add(e.dataTransfer.files);
        }}
        disabled={entries.length >= MAX_BATCH}
        className={`grid w-full place-items-center gap-2 rounded-card border-2 border-dashed p-6 text-center transition-colors duration-200 ease-brand disabled:opacity-60 ${
          entries.length ? "min-h-28" : "min-h-56"
        } ${over ? "border-teal bg-teal-wash" : "border-line-strong/40 bg-foam hover:border-teal hover:bg-teal-wash"}`}
      >
        <span className="grid size-12 place-items-center rounded-full bg-white text-teal shadow-float ring-1 ring-mist">
          <UploadIcon className="size-5" />
        </span>
        <span className="text-lg font-semibold text-abyss">{entries.length ? "Tambah foto lain" : "Tarik foto ke sini, atau klik untuk memilih banyak foto"}</span>
        <span className="text-sm text-slate">JPG, PNG, WebP, atau HEIC (iPhone) · otomatis diperkecil ke 2400 px</span>
      </button>
      <input
        ref={picker}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        tabIndex={-1}
        data-testid="bulk-input"
        onChange={(e) => {
          if (e.target.files?.length) add(e.target.files);
          e.target.value = "";
        }}
      />

      {entries.length > 0 && (
        <>
          <div className="grid gap-3 rounded-card bg-foam p-4 ring-1 ring-mist md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-abyss">Keterangan umum (Indonesia)</span>
              <input value={shared.id} onChange={(e) => setShared((s) => ({ ...s, id: e.target.value }))} maxLength={120} className={INPUT} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold text-abyss">Keterangan umum (English)</span>
              <input value={shared.en} onChange={(e) => setShared((s) => ({ ...s, en: e.target.value }))} maxLength={120} className={INPUT} />
            </label>
            <label className="flex h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-abyss">
              <input type="checkbox" checked={shared.active} onChange={(e) => setShared((s) => ({ ...s, active: e.target.checked }))} className="size-4 accent-teal" />
              Langsung tampil di beranda
            </label>
            <p className="text-xs text-slate md:col-span-3">Dipakai foto yang keterangannya dikosongkan. Keterangan dibaca pembaca layar dan tampil saat foto dibuka besar.</p>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {entries.map((entry, index) => {
              // Foto baru tampil paling depan sesuai urutan di sini, jadi posisinya di mosaik = index.
              const advice = entry.width ? photoAdvice({ width: entry.width, height: entry.height }, entry.size, index) : null;
              const label = entry.status === "uploading" ? `${STATUS.uploading} ${Math.round((entry.progress ?? 0) * 100)}%` : STATUS[entry.status];
              return (
                <li key={entry.key} data-status={entry.status} className="flex min-w-0 flex-col overflow-hidden rounded-card bg-white ring-1 ring-mist">
                  <div className="relative aspect-[4/3] bg-foam">
                    {entry.preview ? (
                      <img src={entry.preview} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center text-slate">
                        <ImageIcon className="size-8" />
                      </span>
                    )}
                    <span
                      className={`absolute top-2 left-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        entry.status === "done" ? "bg-success text-white" : entry.status === "error" ? "bg-danger text-white" : "bg-white/90 text-abyss"
                      }`}
                    >
                      {entry.status === "done" && <CheckIcon className="size-3.5" />}
                      {label}
                      {entry.status === "uploading" && entry.retry ? ` · coba ke-${entry.retry + 1}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => drop(entry)}
                      aria-label={`Buang ${entry.name}`}
                      className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-white/90 text-slate hover:text-danger"
                    >
                      <CloseIcon className="size-4" />
                    </button>
                    {["uploading", "waiting"].includes(entry.status) && (
                      <span className="absolute inset-x-0 bottom-0 h-1.5 bg-white/60">
                        <span className="block h-full bg-teal transition-[width] duration-300" style={{ width: `${Math.round((entry.progress ?? 0) * 100)}%` }} />
                      </span>
                    )}
                  </div>
                  <div className="grid gap-2 p-3">
                    <p className="truncate text-xs text-slate" title={entry.name}>
                      {entry.name}
                      {entry.width ? ` · ${entry.width} × ${entry.height}` : ""}
                      {entry.bytes ? ` · ${kb(entry.bytes)}` : ""}
                      {entry.original && entry.bytes && entry.original > entry.bytes * 1.3 ? ` (dari ${kb(entry.original)})` : ""}
                    </p>
                    {entry.status === "error" && (
                      <div className="grid gap-1.5">
                        <p role="alert" className="text-xs font-semibold text-danger">
                          {entry.error}
                        </p>
                        {!entry.fatal && (
                          <button type="button" onClick={() => retry(entry)} className="w-fit text-xs font-bold text-teal hover:underline">
                            Coba unggah lagi
                          </button>
                        )}
                      </div>
                    )}
                    {advice && advice.level !== "good" && <p className={`text-xs font-semibold ${ADVICE_TONE[advice.level]}`}>{advice.message}</p>}
                    <input
                      value={entry.captionId}
                      onChange={(e) => update(entry.key, { captionId: e.target.value })}
                      maxLength={120}
                      placeholder={shared.id || "Keterangan (Indonesia)"}
                      aria-label={`Keterangan Indonesia untuk ${entry.name}`}
                      className={`${INPUT} h-9 text-sm`}
                    />
                    <input
                      value={entry.captionEn}
                      onChange={(e) => update(entry.key, { captionEn: e.target.value })}
                      maxLength={120}
                      placeholder={shared.en || "Caption (English)"}
                      aria-label={`Keterangan English untuk ${entry.name}`}
                      className={`${INPUT} h-9 text-sm`}
                    />
                    <select
                      value={entry.size}
                      onChange={(e) => update(entry.key, { size: e.target.value })}
                      aria-label={`Ukuran petak untuk ${entry.name}`}
                      className={`${INPUT} h-9 text-sm`}
                    >
                      {SIZES.map(([key]) => (
                        <option key={key} value={key}>
                          Petak {key === "auto" ? `otomatis (${TILE_GUIDE[tileFor("auto", { position: index })].label.toLowerCase()})` : TILE_GUIDE[key].label.toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {error && (
        <p role="alert" className="rounded-input bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 border-t border-mist pt-5">
        <button type="button" onClick={save} disabled={saving || done.length === 0} className={SOLID}>
          {saving ? "Menyimpan…" : done.length ? `Simpan ${done.length} foto ke galeri` : "Simpan ke galeri"}
        </button>
        <button type="button" onClick={cancel} disabled={saving} className="inline-flex h-11 items-center rounded-full px-5 font-semibold text-slate hover:text-abyss">
          Batal
        </button>
        {summary.length > 0 && (
          <span aria-live="polite" className="text-sm text-slate">
            {summary.join(" · ")}
          </span>
        )}
      </div>
    </section>
  );
}
