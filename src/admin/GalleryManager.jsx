"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowIcon, CheckIcon, EyeIcon, EyeOffIcon, ImageIcon, PlayIcon, TrashIcon, UploadIcon } from "@/components/icons";
import { prepareImage } from "@/lib/image-prep";
import { PHOTO_RULES, photoAdvice, TILE_GUIDE, tileFor, VIDEO_GUIDE } from "@/lib/media-guide";
import { SIZES } from "@/lib/modules/site";
import { parseVideoUrl } from "@/lib/video-embed";
import BulkPhotoUpload from "./BulkPhotoUpload";
import { INPUT, removeRecord } from "./RecordManager";
import { thumbUrl, uploadPhoto } from "./upload";

const ACCEPT = "image/*,.heic,.heif";
const BOX = "rounded-card bg-white ring-1 ring-mist shadow-[0_1px_2px_rgb(10_50_59/0.05)]";
const SOLID = "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-teal px-5 font-bold text-white hover:bg-teal-dark disabled:bg-mist disabled:text-slate";
const OUTLINE = "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 font-bold text-teal ring-1 ring-teal hover:bg-teal-soft";
const ICON_BUTTON = "grid size-9 place-items-center rounded-full text-slate hover:bg-foam hover:text-abyss disabled:opacity-30 disabled:hover:bg-transparent";
const ADVICE_TONE = { good: "bg-success/10 text-success", fair: "bg-sunrise-wash text-ember", small: "bg-danger/10 text-danger" };

const blank = (type) => ({ type, mediaId: "", url: "", captionId: "", captionEn: "", size: "auto", order: 0, active: true });
const SIZE_TEXT = {
  auto: { label: "Otomatis", text: "Mengikuti susunan mosaik beranda (besar, kecil, tinggi bergantian)" },
  ...Object.fromEntries(Object.entries(TILE_GUIDE).map(([key, g]) => [key, { label: g.label, text: `${g.shape}, minimal ${g.minWidth} × ${g.minHeight} px` }])),
};
// Sel yang dipakai tiap ukuran di petak contoh 4 × 2 (kolom, baris).
const CELLS = { small: [[0, 0]], wide: [[0, 0], [1, 0]], tall: [[0, 0], [0, 1]], big: [[0, 0], [1, 0], [0, 1], [1, 1]] };

/** Simpan satu item galeri (seluruh isinya); "" bila berhasil, atau pesan galat. */
async function saveItem(item) {
  const { id, ...data } = item;
  const response = await fetch("/api/admin/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "gallery", id: id ?? null, data }),
  });
  const result = await response.json().catch(() => ({}));
  return response.ok ? "" : result.error || "Belum tersimpan. Coba lagi.";
}

/** Gambar yang menampilkan ikon pengganti bila gagal dimuat (mis. gambar video yang tidak bisa diambil). */
function Thumb({ src, alt = "", video = false, className = "size-full object-cover" }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className="grid size-full place-items-center text-slate">{video ? <PlayIcon className="size-8" /> : <ImageIcon className="size-8" />}</span>;
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}

function MiniGrid({ size }) {
  const cells = CELLS[size] ?? [];
  return (
    <span aria-hidden="true" className="grid w-14 shrink-0 grid-cols-4 grid-rows-2 gap-0.5">
      {Array.from({ length: 8 }, (_, i) => {
        const on = cells.some(([x, y]) => x === i % 4 && y === Math.floor(i / 4));
        return <span key={i} className={`h-3 rounded-[3px] ${on ? "bg-teal" : size === "auto" && i === 0 ? "border border-dashed border-teal" : "bg-mist"}`} />;
      })}
    </span>
  );
}

/** Panduan ukuran foto dan video, terbuka dengan sendirinya selama galeri masih kosong. */
function MediaGuide({ open }) {
  return (
    <details open={open} className={`group ${BOX}`}>
      <summary className="flex cursor-pointer list-none items-center gap-3 p-5 [&::-webkit-details-marker]:hidden">
        <span className="grid size-10 place-items-center rounded-full bg-teal-soft text-teal">
          <ImageIcon className="size-5" />
        </span>
        <span className="grid gap-0.5">
          <span className="font-semibold text-abyss">Panduan ukuran foto dan video</span>
          <span className="text-sm text-slate">Supaya galeri tajam di layar besar maupun ponsel.</span>
        </span>
        <ArrowIcon className="ml-auto size-4 rotate-90 text-slate transition-transform duration-200 group-open:-rotate-90" />
      </summary>
      <div className="grid gap-6 border-t border-mist p-5 lg:grid-cols-2">
        <div className="grid content-start gap-3">
          <h3 className="font-sans text-sm font-bold text-abyss">Foto</h3>
          <ul className="grid divide-y divide-mist rounded-input ring-1 ring-mist">
            {Object.entries(TILE_GUIDE).map(([key, g]) => (
              <li key={key} className="flex items-center gap-3 p-3 text-sm">
                <MiniGrid size={key} />
                <span className="grid gap-0.5">
                  <span className="font-semibold text-abyss">Petak {g.label}</span>
                  <span className="text-slate">
                    {g.shape}, minimal <span className="font-semibold text-abyss tabular-nums">{`${g.minWidth} × ${g.minHeight} px`}</span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-slate">
            {PHOTO_RULES.formats}, maksimal {PHOTO_RULES.maxMb} MB. Ukuran terbaik {PHOTO_RULES.best}. Website memperkecil dan mengompres foto otomatis,
            jadi tidak perlu diedit dulu.
          </p>
        </div>
        <div className="grid content-start gap-3">
          <h3 className="font-sans text-sm font-bold text-abyss">Video (tautan)</h3>
          <ul className="grid divide-y divide-mist rounded-input ring-1 ring-mist">
            {VIDEO_GUIDE.map((v) => (
              <li key={v.kind} className="grid gap-0.5 p-3 text-sm">
                <span className="font-semibold text-abyss">{v.kind}</span>
                <span className="text-slate">
                  {v.shape}, <span className="font-semibold text-abyss tabular-nums">{v.size}</span>, petak {v.tile}
                </span>
              </li>
            ))}
          </ul>
          <ul className="grid gap-1.5 text-sm text-slate">
            {[
              "Letakkan objek utama di tengah, karena foto dan video dipotong mengikuti bentuk petak.",
              "Unggah videonya dulu ke YouTube, TikTok, Instagram, atau Facebook, lalu tempel tautan dari tombol Bagikan.",
              "Video YouTube dan TikTok diputar otomatis tanpa suara dan berulang di beranda. Video YouTube tampil tanpa tombol apa pun; diketuk, membuka kanal YouTube pemilik videonya.",
            ].map((tip) => (
              <li key={tip} className="grid grid-cols-[18px_1fr] gap-2">
                <CheckIcon className="mt-0.5 size-4 text-teal" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}

/** Area unggah foto: tarik dan lepas atau klik, dengan placeholder yang jelas. */
function PhotoDrop({ busy, onFile }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
        disabled={busy}
        className={`grid min-h-60 w-full place-items-center gap-3 rounded-card border-2 border-dashed p-6 text-center transition-colors duration-200 ease-brand ${
          over ? "border-teal bg-teal-wash" : "border-line-strong/40 bg-foam hover:border-teal hover:bg-teal-wash"
        }`}
      >
        <span className="grid size-14 place-items-center rounded-full bg-white text-teal shadow-float ring-1 ring-mist">
          <UploadIcon className="size-6" />
        </span>
        <span className="grid gap-1">
          <span className="text-lg font-semibold text-abyss">Tarik foto ke sini, atau klik untuk memilih</span>
          <span className="text-sm text-slate">
            {PHOTO_RULES.formats} · maks. {PHOTO_RULES.maxMb} MB · terbaik {PHOTO_RULES.best}
          </span>
        </span>
        <span className="inline-flex h-10 items-center rounded-full bg-teal px-5 text-sm font-bold text-white">Pilih foto dari perangkat</span>
      </button>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Tampilan petak di beranda: foto atau gambar video dipotong mengikuti bentuk petaknya. */
function TilePreview({ src, tile, video, busy, progress = 0 }) {
  const g = TILE_GUIDE[tile];
  return (
    <figure className="grid gap-2">
      <div
        className={`relative mx-auto w-full overflow-hidden rounded-card bg-foam ring-1 ring-mist ${tile === "tall" ? "max-w-[220px]" : tile === "small" ? "max-w-[320px]" : "max-w-[520px]"}`}
        style={{ aspectRatio: g.aspect }}
      >
        <Thumb key={src} src={src} video={video} />
        {video && src && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-12 place-items-center rounded-full bg-abyss/70 text-white">
              <PlayIcon className="size-5" />
            </span>
          </span>
        )}
        {busy && <span className="absolute inset-0 grid place-items-center bg-white/70 text-sm font-bold text-teal">Mengunggah {Math.round(progress * 100)}%</span>}
      </div>
      <figcaption className="text-center text-xs text-slate">Tampilan di beranda, petak {g.label}</figcaption>
    </figure>
  );
}

/** Form tambah atau ubah satu item galeri. */
function ItemForm({ initial, onDone, onCancel }) {
  const [value, setValue] = useState(initial);
  const [local, setLocal] = useState(null); // { url, width, height } foto yang baru dipilih
  const [busy, setBusy] = useState("");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const form = useRef(null);
  const set = (key, v) => setValue((current) => ({ ...current, [key]: v }));
  useEffect(() => form.current?.scrollIntoView({ behavior: "smooth", block: "start" }), []);
  useEffect(() => () => local && URL.revokeObjectURL(local.url), [local]);

  const video = value.type === "embed" ? parseVideoUrl(value.url) : null;
  // Posisi di beranda (item yang tampil), supaya "Otomatis" menunjukkan petak mosaiknya.
  const position = initial.position ?? null;
  const tile = tileFor(value.size, { type: value.type, vertical: Boolean(video?.vertical), position });
  const photoSrc = local?.url ?? (value.mediaId ? `/api/media/${value.mediaId}` : null);
  const dims = local ?? (value.mediaId && initial.mediaId === value.mediaId ? { width: initial.width, height: initial.height } : null);
  const advice = value.type === "photo" && dims ? photoAdvice(dims, value.size, position) : null;

  // Foto diperkecil di peramban lalu diunggah dengan coba ulang otomatis (src/lib/image-prep.js, ./upload.js).
  async function upload(file) {
    setError("");
    setBusy("upload");
    setProgress(0);
    const ready = await prepareImage(file);
    if (ready.error) {
      setBusy("");
      return setError(ready.error);
    }
    setLocal({ url: URL.createObjectURL(ready.file), width: ready.width, height: ready.height });
    try {
      const saved = await uploadPhoto(ready.file, { onProgress: setProgress });
      set("mediaId", saved.id);
    } catch (e) {
      setError(e.message);
      setLocal(null);
    } finally {
      setBusy("");
    }
  }

  async function save(event) {
    event.preventDefault();
    setBusy("save");
    setError("");
    const message = await saveItem(value);
    setBusy("");
    if (message) setError(message);
    else onDone();
  }

  return (
    <form ref={form} onSubmit={save} className="grid scroll-mt-28 gap-6 rounded-card bg-white p-5 shadow-float ring-2 ring-teal sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl text-abyss">{initial.id ? "Ubah item galeri" : value.type === "photo" ? "Tambah foto" : "Tambah video"}</h2>
        <div className="flex rounded-full bg-foam p-1 ring-1 ring-mist" role="radiogroup" aria-label="Jenis">
          {[
            ["photo", "Foto", ImageIcon],
            ["embed", "Video", PlayIcon],
          ].map(([k, label, Icon]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={value.type === k}
              onClick={() => set("type", k)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-bold ${value.type === k ? "bg-white text-abyss shadow-float" : "text-slate hover:text-abyss"}`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="grid gap-4">
          {value.type === "photo" ? (
            photoSrc ? (
              <div className="grid gap-3">
                <TilePreview src={photoSrc} tile={tile} busy={busy === "upload"} progress={progress} />
                {advice && (
                  <p className={`rounded-input px-3 py-2 text-sm font-semibold ${ADVICE_TONE[advice.level]}`}>
                    {advice.message}
                    {advice.suggest && (
                      <button type="button" onClick={() => set("size", advice.suggest)} className="ml-1 underline underline-offset-2">
                        Pakai petak {TILE_GUIDE[advice.suggest].label}, lebih cocok dengan bentuk foto ini.
                      </button>
                    )}
                  </p>
                )}
                <PhotoDropButton busy={busy === "upload"} onFile={upload} />
              </div>
            ) : (
              <PhotoDrop busy={busy === "upload"} onFile={upload} />
            )
          ) : (
            <div className="grid gap-3">
              <label className="grid gap-1.5">
                <span className="text-sm font-semibold text-abyss">Tautan video</span>
                <input
                  type="url"
                  value={value.url}
                  onChange={(e) => set("url", e.target.value)}
                  placeholder="https://www.youtube.com/shorts/…"
                  className={INPUT}
                />
                <span className="text-xs text-slate">YouTube, Shorts, TikTok, Instagram, atau Facebook. Salin dari tombol Bagikan di aplikasinya.</span>
              </label>
              {value.url &&
                (video ? (
                  <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success">
                    <CheckIcon className="size-4" />
                    {video.label}, video {video.vertical ? "tegak" : "mendatar"}
                  </p>
                ) : (
                  <p className="rounded-input bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
                    Tautan belum dikenali. Pakai tautan lengkap, bukan tautan pendek seperti vt.tiktok.com.
                  </p>
                ))}
              <TilePreview src={video?.thumbnail ?? null} tile={tile} video />
            </div>
          )}
        </div>

        <div className="grid content-start gap-4">
          <label className="grid gap-1.5">
            <span className="flex justify-between text-sm font-semibold text-abyss">
              Keterangan (Indonesia)<span className="font-normal text-slate tabular-nums">{value.captionId.length}/120</span>
            </span>
            <input value={value.captionId} onChange={(e) => set("captionId", e.target.value)} maxLength={120} required placeholder="Mis. Pari manta di Manta Ridge" className={INPUT} />
          </label>
          <label className="grid gap-1.5">
            <span className="flex justify-between text-sm font-semibold text-abyss">
              Keterangan (English)<span className="font-normal text-slate tabular-nums">{value.captionEn.length}/120</span>
            </span>
            <input value={value.captionEn} onChange={(e) => set("captionEn", e.target.value)} maxLength={120} required placeholder="E.g. Manta ray at Manta Ridge" className={INPUT} />
            <span className="text-xs text-slate">Dibaca pembaca layar dan tampil saat foto dibuka besar.</span>
          </label>
          <fieldset className="grid gap-2">
            <legend className="mb-1.5 text-sm font-semibold text-abyss">Ukuran petak</legend>
            {SIZES.map(([key]) => {
              const checked = value.size === key;
              return (
                <label
                  key={key}
                  className={`flex cursor-pointer items-center gap-3 rounded-input p-3 ring-1 transition-colors ${checked ? "bg-teal-wash ring-2 ring-teal" : "ring-mist hover:bg-foam"}`}
                >
                  <input type="radio" name="size" value={key} checked={checked} onChange={() => set("size", key)} className="sr-only" />
                  <MiniGrid size={key} />
                  <span className="grid gap-0.5 text-sm">
                    <span className="font-semibold text-abyss">{SIZE_TEXT[key].label}</span>
                    <span className="text-xs text-slate">{SIZE_TEXT[key].text}</span>
                  </span>
                  {checked && <CheckIcon className="ml-auto size-4 text-teal" />}
                </label>
              );
            })}
          </fieldset>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-input p-3 ring-1 ring-mist">
            <span className="grid gap-0.5 text-sm">
              <span className="font-semibold text-abyss">Tampil di beranda</span>
              <span className="text-xs text-slate">Matikan untuk menyimpan tanpa menampilkannya dulu.</span>
            </span>
            <input type="checkbox" checked={value.active} onChange={(e) => set("active", e.target.checked)} className="peer sr-only" />
            <span className="flex h-7 w-12 shrink-0 items-center rounded-full bg-mist p-1 transition-colors peer-checked:bg-teal peer-focus-visible:ring-3 peer-focus-visible:ring-lagoon/40">
              <span className={`size-5 rounded-full bg-white shadow-float transition-transform ${value.active ? "translate-x-5" : ""}`} />
            </span>
          </label>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-input bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 border-t border-mist pt-5">
        <button type="submit" disabled={Boolean(busy) || (value.type === "photo" && !value.mediaId) || (value.type === "embed" && !video)} className={SOLID}>
          {busy === "save" ? "Menyimpan…" : initial.id ? "Simpan perubahan" : "Simpan ke galeri"}
        </button>
        <button type="button" onClick={onCancel} className="inline-flex h-11 items-center rounded-full px-5 font-semibold text-slate hover:text-abyss">
          Batal
        </button>
        {value.type === "photo" && !value.mediaId && <span className="text-sm text-slate">Unggah fotonya dulu.</span>}
      </div>
    </form>
  );
}

/** Tombol kecil "Ganti foto" di bawah pratinjau. */
function PhotoDropButton({ busy, onFile }) {
  const input = useRef(null);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => input.current?.click()} disabled={busy} className={`${OUTLINE} h-10 text-sm`}>
        <UploadIcon className="size-4" />
        Ganti foto
      </button>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// Galeri beranda /admin/situs: unggah banyak foto sekaligus (BulkPhotoUpload), ubah satu item dengan
// pratinjau petak dan cek resolusi, tempel tautan video, atur urutan dengan tombol naik turun, dan
// tampilkan atau sembunyikan tanpa menghapus.
export default function GalleryManager({ items }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const shown = items.filter((item) => item.active).length;
  // Urutan tiap item yang tampil di beranda (mulai 0), untuk petak mosaik ukuran "Otomatis".
  const positions = new Map();
  for (const item of items) if (item.active) positions.set(item.id, positions.size);
  const done = () => {
    setEditing(null);
    router.refresh();
  };
  const run = async (key, task) => {
    setBusy(key);
    setError("");
    const message = await task();
    setBusy("");
    if (message) setError(message);
    router.refresh();
  };
  const remove = (item) =>
    window.confirm("Hapus item galeri ini? Fotonya ikut terhapus dan tidak bisa dikembalikan.") && run(`del:${item.id}`, () => removeRecord("gallery", item.id));
  const toggle = (item) => run(`vis:${item.id}`, () => saveItem({ ...item, active: !item.active }));
  // Tukar posisi lalu beri nomor urut baru (10, 20, ...) pada item yang urutannya berubah.
  const move = (index, step) =>
    run(`move:${index}`, async () => {
      const list = [...items];
      [list[index], list[index + step]] = [list[index + step], list[index]];
      for (const [i, item] of list.entries()) {
        if ((item.order ?? 0) === i * 10) continue;
        const message = await saveItem({ ...item, order: i * 10 });
        if (message) return message;
      }
      return "";
    });

  return (
    <div className="grid gap-5">
      <div className={`flex flex-wrap items-center justify-between gap-4 p-5 ${BOX}`}>
        <div className="flex flex-wrap gap-6">
          {[
            ["Tampil di beranda", shown],
            ["Disembunyikan", items.length - shown],
          ].map(([label, n]) => (
            <div key={label} className="grid">
              <span className="font-display text-3xl font-semibold text-abyss tabular-nums">{n}</span>
              <span className="text-sm text-slate">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setAdding(true);
            }}
            className={SOLID}
          >
            <UploadIcon className="size-[18px]" />
            Tambah foto
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setEditing(blank("embed"));
            }}
            className={OUTLINE}
          >
            <PlayIcon className="size-[18px]" />
            Tambah video
          </button>
          <a href="/#gallery" target="_blank" rel="noopener" className="inline-flex h-11 items-center px-3 text-sm font-semibold text-teal hover:underline">
            Lihat di beranda ↗
          </a>
        </div>
      </div>

      <MediaGuide open={items.length === 0} />

      {error && (
        <p role="alert" className="rounded-input bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      {adding && (
        <BulkPhotoUpload
          minOrder={Math.min(0, ...items.map((item) => item.order ?? 0))}
          onDone={({ keepOpen } = {}) => {
            if (!keepOpen) setAdding(false);
            router.refresh();
          }}
          onCancel={() => setAdding(false)}
        />
      )}
      {editing && <ItemForm key={editing.id ?? `new-${editing.type}`} initial={editing} onDone={done} onCancel={() => setEditing(null)} />}

      {items.length === 0 ? (
        <div className={`grid justify-items-center gap-3 p-10 text-center ${BOX}`}>
          <span className="grid size-14 place-items-center rounded-full bg-foam text-slate ring-1 ring-mist">
            <ImageIcon className="size-6" />
          </span>
          <p className="font-semibold text-abyss">Galeri masih kosong</p>
          <p className="max-w-[48ch] text-sm text-slate">
            Selama belum ada foto atau video di sini, beranda memakai galeri bawaan. Begitu satu item tampil, galeri bawaan diganti isianmu.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => {
            const video = item.type === "embed" ? parseVideoUrl(item.url) : null;
            // Foto ditampilkan lewat pengecil gambar Next.js (640 px), bukan file 2400 px utuh.
            const src = item.type === "photo" ? thumbUrl(`/api/media/${item.mediaId}`) : video?.thumbnail;
            const tile = tileFor(item.size, { type: item.type, vertical: Boolean(video?.vertical), position: positions.get(item.id) ?? null });
            return (
              <li key={item.id} className={`flex min-w-0 flex-col overflow-hidden ${BOX} ${item.active ? "" : "opacity-75"}`}>
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-foam">
                  <Thumb src={src} alt={item.captionId} video={item.type !== "photo"} />
                  <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-abyss tabular-nums">#{index + 1}</span>
                  <span
                    className={`absolute top-2 right-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${item.active ? "bg-success text-white" : "bg-abyss text-white"}`}
                  >
                    {item.active ? "Tampil" : "Disembunyikan"}
                  </span>
                  <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-abyss/75 px-2 py-0.5 text-[11px] font-bold text-white">
                    {item.type === "photo" ? <ImageIcon className="size-3.5" /> : <PlayIcon className="size-3.5" />}
                    {item.type === "photo" ? "Foto" : (video?.label ?? "Video")} · petak {TILE_GUIDE[tile].label}
                    {(item.size ?? "auto") === "auto" && item.active ? " (otomatis)" : ""}
                  </span>
                </div>
                <div className="grid gap-0.5 p-4 pb-2">
                  <p className="leading-snug font-semibold text-abyss">{item.captionId}</p>
                  <p className="text-sm text-slate">{item.captionEn}</p>
                  {item.type === "photo" && item.width && <p className="text-xs text-slate tabular-nums">{`${item.width} × ${item.height} px`}</p>}
                </div>
                <div className="mt-auto flex items-center gap-1 border-t border-mist p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdding(false);
                      setEditing({ ...item, position: positions.get(item.id) ?? null });
                    }}
                    className="inline-flex h-9 items-center rounded-full px-3 text-sm font-bold text-teal hover:bg-teal-soft"
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(item)}
                    disabled={Boolean(busy)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-slate hover:bg-foam hover:text-abyss"
                  >
                    {item.active ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                    {item.active ? "Sembunyikan" : "Tampilkan"}
                  </button>
                  <span className="ml-auto flex">
                    <button type="button" onClick={() => move(index, -1)} disabled={Boolean(busy) || index === 0} aria-label="Pindah ke depan" title="Pindah ke depan" className={ICON_BUTTON}>
                      <ArrowIcon className="size-4 -rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={Boolean(busy) || index === items.length - 1}
                      aria-label="Pindah ke belakang"
                      title="Pindah ke belakang"
                      className={ICON_BUTTON}
                    >
                      <ArrowIcon className="size-4 rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      disabled={Boolean(busy)}
                      aria-label="Hapus"
                      title="Hapus"
                      className="grid size-9 place-items-center rounded-full text-danger hover:bg-danger/10"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
