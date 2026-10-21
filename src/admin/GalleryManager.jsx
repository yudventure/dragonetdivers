"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SIZES } from "@/lib/modules/site";
import { INPUT, removeRecord } from "./RecordManager";

const blank = { type: "photo", mediaId: "", url: "", captionId: "", captionEn: "", size: "auto", order: 0, active: true };
const sizeLabel = (key) => (key === "auto" ? "Ukuran otomatis" : (SIZES.find(([k]) => k === key)?.[1].split(",")[0] ?? key));

function Field({ label, hint, children }) {
  return (
    <label className="grid content-start gap-1.5">
      <span className="text-sm font-semibold text-abyss">{label}</span>
      {children}
      {hint && <span className="text-xs text-slate">{hint}</span>}
    </label>
  );
}

/** Form tambah/ubah item galeri: unggah foto (diperkecil di server) atau tautan video. */
function ItemForm({ initial, onDone, onCancel }) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const set = (key) => (e) => setValue((v) => ({ ...v, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy("upload");
    setError("");
    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/admin/media", { method: "POST", body });
    const result = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) setError(result.error || "Foto belum terunggah.");
    else setValue((v) => ({ ...v, mediaId: result.id }));
  }

  async function save(event) {
    event.preventDefault();
    setBusy("save");
    setError("");
    const response = await fetch("/api/admin/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "gallery", id: initial.id ?? null, data: value }),
    });
    const result = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) setError(result.error || "Belum tersimpan.");
    else onDone();
  }

  return (
    <form onSubmit={save} className="grid gap-5 rounded-card bg-white p-5 shadow-float ring-1 ring-teal sm:p-6">
      <h2 className="text-xl text-abyss">{initial.id ? "Ubah item galeri" : "Item galeri baru"}</h2>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Jenis">
        {[
          ["photo", "Foto"],
          ["embed", "Tautan video"],
        ].map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={value.type === k}
            onClick={() => setValue((v) => ({ ...v, type: k }))}
            className={`inline-flex h-10 items-center rounded-full px-4 text-sm font-bold ${value.type === k ? "bg-abyss text-white" : "text-abyss ring-1 ring-mist"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {value.type === "photo" ? (
        <div className="flex flex-wrap items-center gap-4">
          {value.mediaId && <img src={`/api/media/${value.mediaId}`} alt="" className="h-28 w-40 rounded-input object-cover ring-1 ring-mist" />}
          <Field label={value.mediaId ? "Ganti foto" : "Foto"} hint="JPG, PNG, WebP, atau HEIC sampai 15 MB. Diperkecil otomatis.">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={upload} disabled={busy === "upload"} className="text-sm" />
          </Field>
          {busy === "upload" && <span className="text-sm font-semibold text-teal">Mengunggah…</span>}
        </div>
      ) : (
        <Field label="Tautan video" hint="YouTube, Shorts, TikTok, Instagram, atau Facebook.">
          <input type="url" value={value.url} onChange={set("url")} placeholder="https://www.youtube.com/shorts/…" className={INPUT} />
        </Field>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Keterangan (Indonesia)" hint="Dibaca pembaca layar dan tampil saat foto dibuka.">
          <input value={value.captionId} onChange={set("captionId")} maxLength={120} required className={INPUT} />
        </Field>
        <Field label="Keterangan (English)">
          <input value={value.captionEn} onChange={set("captionEn")} maxLength={120} required className={INPUT} />
        </Field>
        <Field label="Ukuran petak">
          <select value={value.size} onChange={set("size")} className={INPUT}>
            {SIZES.map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Urutan" hint="Angka kecil tampil lebih dulu.">
          <input type="number" min={-999} max={999} value={value.order} onChange={set("order")} className={INPUT} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold text-abyss">
        <input type="checkbox" checked={value.active} onChange={set("active")} className="size-4 accent-teal" />
        Tampil di beranda
      </label>
      {error && (
        <p role="alert" className="rounded-input bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={Boolean(busy)} className="inline-flex h-11 items-center rounded-full bg-teal px-6 font-bold text-white hover:bg-teal-dark disabled:bg-mist disabled:text-slate">
          {busy === "save" ? "Menyimpan…" : "Simpan"}
        </button>
        <button type="button" onClick={onCancel} className="inline-flex h-11 items-center rounded-full px-5 font-semibold text-slate hover:text-abyss">
          Batal
        </button>
      </div>
    </form>
  );
}

// Galeri beranda /admin/situs: foto unggahan dan tautan video, dengan urutan dan ukuran petaknya.
export default function GalleryManager({ items }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const done = () => {
    setEditing(null);
    router.refresh();
  };
  async function remove(item) {
    if (!window.confirm("Hapus item galeri ini? Fotonya ikut terhapus.")) return;
    setError((await removeRecord("gallery", item.id)) || "");
    router.refresh();
  }
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setEditing(blank)} className="inline-flex h-10 items-center rounded-full border-[1.5px] border-teal px-4 text-sm font-bold text-teal hover:bg-teal-soft">
          + Tambah foto atau video
        </button>
        <a href="/#gallery" target="_blank" rel="noopener" className="text-sm font-semibold text-teal hover:underline">
          Lihat galeri di beranda ↗
        </a>
      </div>
      {error && (
        <p role="alert" className="rounded-input bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      {editing && <ItemForm key={editing.id ?? "new"} initial={editing} onDone={done} onCancel={() => setEditing(null)} />}
      {items.length === 0 ? (
        <p className="rounded-card bg-white p-5 text-sm text-slate ring-1 ring-mist">Belum ada foto atau video. Beranda masih memakai galeri bawaan.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="grid gap-3 rounded-card bg-white p-3 ring-1 ring-mist">
              <div className="relative aspect-[4/3] overflow-hidden rounded-input bg-foam">
                {item.type === "photo" ? (
                  <img src={`/api/media/${item.mediaId}`} alt={item.captionId} className="size-full object-cover" loading="lazy" />
                ) : (
                  <span className="grid size-full place-items-center p-4 text-center text-sm font-semibold break-all text-teal">▶ {item.url}</span>
                )}
                {!item.active && <span className="absolute top-2 left-2 rounded-full bg-abyss px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">Disembunyikan</span>}
              </div>
              <div className="grid gap-0.5 px-1 text-sm">
                <span className="font-semibold text-abyss">{item.captionId}</span>
                <span className="text-slate">
                  {item.captionEn} · {sizeLabel(item.size)} · urutan {item.order}
                </span>
              </div>
              <div className="flex gap-2 px-1">
                <button type="button" onClick={() => setEditing(item)} className="inline-flex h-9 items-center rounded-full px-4 text-sm font-bold text-teal ring-1 ring-teal hover:bg-teal-soft">
                  Ubah
                </button>
                <button type="button" onClick={() => remove(item)} className="inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold text-danger hover:bg-danger/10">
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

