"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImageIcon, TrashIcon, UploadIcon } from "@/components/icons";
import { prepareImage } from "@/lib/image-prep";
import { discardUpload, thumbUrl, uploadPhoto } from "./upload";

const ACCEPT = "image/*,.heic,.heif";
// Foto kartu memenuhi panel atas kartu (kira-kira 3:2 di beranda, 4:3 di halaman layanan).
const MIN_WIDTH = 1200;

/**
 * Panel "Layanan di website" di /admin/paket, satu kartu per layanan.
 * - Sakelar tampil/disimpan: layanan yang disimpan tidak muncul di menu, beranda, footer, dan halamannya
 *   (404), dan paketnya tidak bisa dipesan; paket dan harganya tetap tersimpan.
 * - Foto kartu (permintaan pemilik 2 November 2026, "tambahkan tombol ganti foto"): Ganti foto mengunggah
 *   foto (diperkecil di peramban, src/lib/image-prep.js) lalu memasangnya; Pakai ilustrasi bawaan
 *   melepasnya. Foto tampil di kartu beranda, menu Layanan, dan bagian atas halaman layanannya.
 * Semua langsung disimpan lewat /api/admin/services. services = [{ slug, title, count, art, image }].
 */
export default function ServiceVisibility({ services, hidden: initial }) {
  const router = useRouter();
  const [hidden, setHidden] = useState(initial);
  const [state, setState] = useState({ busy: "", message: "", error: false });
  const shown = services.length - hidden.length;

  const post = async (body) => {
    const response = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    const result = (await response?.json().catch(() => ({}))) ?? {};
    return { ok: Boolean(response?.ok), result };
  };

  async function toggle(slug, show) {
    const before = hidden;
    const next = show ? hidden.filter((s) => s !== slug) : [...hidden, slug];
    setHidden(next);
    setState({ busy: slug, message: "", error: false });
    const { ok, result } = await post({ hidden: next });
    if (!ok) {
      setHidden(before);
      return setState({ busy: "", message: result.error || "Belum tersimpan. Coba lagi.", error: true });
    }
    setHidden(result.hidden);
    const title = services.find((s) => s.slug === slug)?.title;
    setState({ busy: "", message: show ? `${title} tampil lagi di website.` : `${title} disimpan dan tidak tampil di website.`, error: false });
    router.refresh();
  }

  async function changePhoto(service, file, onProgress) {
    setState({ busy: `foto:${service.slug}`, message: "", error: false });
    const ready = await prepareImage(file);
    if (ready.error) return setState({ busy: "", message: ready.error, error: true });
    let saved;
    try {
      saved = await uploadPhoto(ready.file, { onProgress });
    } catch (e) {
      return setState({ busy: "", message: e.message, error: true });
    }
    const { ok, result } = await post({ image: { slug: service.slug, mediaId: saved.id } });
    if (!ok) {
      discardUpload(saved.id);
      return setState({ busy: "", message: result.error || "Foto belum terpasang. Coba lagi.", error: true });
    }
    const small = ready.width && ready.width < MIN_WIDTH;
    setState({
      busy: "",
      message: small
        ? `Foto ${service.title} terpasang, tapi lebarnya hanya ${ready.width} px sehingga bisa tampak buram. Idealnya minimal ${MIN_WIDTH} × 800 px.`
        : `Foto ${service.title} terpasang dan langsung tampil di website.`,
      error: Boolean(small),
    });
    router.refresh();
  }

  async function resetPhoto(service) {
    if (!window.confirm(`Kembali ke ilustrasi bawaan untuk ${service.title}? Foto yang dipasang ikut terhapus.`)) return;
    setState({ busy: `foto:${service.slug}`, message: "", error: false });
    const { ok, result } = await post({ image: { slug: service.slug, mediaId: null } });
    setState(ok ? { busy: "", message: `${service.title} kembali memakai ilustrasi bawaan.`, error: false } : { busy: "", message: result.error || "Belum tersimpan. Coba lagi.", error: true });
    if (ok) router.refresh();
  }

  return (
    <section className="grid gap-4 rounded-card bg-white p-5 ring-1 ring-mist">
      <div className="grid max-w-[68ch] gap-1">
        <h2 className="text-xl text-abyss">Layanan di website</h2>
        <p className="text-sm text-slate">
          {shown} dari {services.length} layanan tampil. Layanan yang disimpan tidak muncul di menu, beranda, footer, dan halamannya, dan paketnya tidak
          bisa dipesan. Paket dan harganya tetap tersimpan, jadi bisa ditampilkan lagi kapan saja.
        </p>
        <p className="text-sm text-slate">
          Ganti foto mengganti gambar kartu layanan di beranda, di menu Layanan, dan di bagian atas halaman layanannya. Foto mendatar paling pas, minimal{" "}
          {MIN_WIDTH} × 800 px, dengan objek utama di tengah.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <ServiceItem
            key={service.slug}
            service={service}
            on={!hidden.includes(service.slug)}
            last={!hidden.includes(service.slug) && shown === 1}
            busy={state.busy}
            onToggle={(show) => toggle(service.slug, show)}
            onPhoto={(file, onProgress) => changePhoto(service, file, onProgress)}
            onReset={() => resetPhoto(service)}
          />
        ))}
      </ul>
      {state.message && (
        <p role={state.error ? "alert" : "status"} className={`text-sm font-semibold ${state.error ? "text-danger" : "text-teal"}`}>
          {state.message}
        </p>
      )}
    </section>
  );
}

function ServiceItem({ service, on, last, busy, onToggle, onPhoto, onReset }) {
  const input = useRef(null);
  const [progress, setProgress] = useState(null);
  const uploading = busy === `foto:${service.slug}`;
  const pick = async (file) => {
    setProgress(0);
    await onPhoto(file, setProgress);
    setProgress(null);
  };
  return (
    <li className={`flex flex-col overflow-hidden rounded-input ring-1 ${on ? "bg-foam ring-mist" : "bg-white ring-line-strong"}`}>
      <div className="relative aspect-[3/2] overflow-hidden bg-[radial-gradient(ellipse_at_50%_42%,var(--color-white)_0%,var(--color-lagoon-wash)_48%,color-mix(in_srgb,var(--color-lagoon)_30%,var(--color-white))_100%)]">
        {service.image ? (
          <img src={thumbUrl(service.image.src)} alt={`Foto kartu ${service.title}`} className="size-full object-cover" />
        ) : (
          <img src={service.art} alt={`Ilustrasi bawaan ${service.title}`} className="absolute inset-0 m-auto h-[74%] w-auto max-w-[80%] object-contain" />
        )}
        <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-abyss">
          <ImageIcon className="size-3.5" />
          {service.image ? "Foto dari admin" : "Ilustrasi bawaan"}
        </span>
        {uploading && (
          <span className="absolute inset-0 grid place-items-center bg-white/75 text-sm font-bold text-teal">
            {progress === null ? "Menyimpan…" : `Mengunggah ${Math.round(progress * 100)}%`}
          </span>
        )}
      </div>
      <label className={`flex items-start justify-between gap-4 p-4 pb-3 ${last ? "cursor-not-allowed" : "cursor-pointer"}`}>
        <span className="grid gap-1">
          <span className="flex flex-wrap items-center gap-2 font-semibold text-abyss">
            {service.title}
            {!on && <span className="rounded-full bg-mist px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate uppercase">Disimpan</span>}
          </span>
          <span className="text-sm text-slate">
            {on ? "Tampil di website" : "Tidak tampil"} · {service.count} paket
          </span>
        </span>
        <input
          type="checkbox"
          role="switch"
          aria-label={`Tampilkan ${service.title} di website`}
          checked={on}
          disabled={Boolean(busy) || last}
          onChange={(e) => onToggle(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="relative mt-0.5 h-7 w-12 shrink-0 rounded-full bg-line-strong transition-colors duration-200 ease-brand peer-checked:bg-teal peer-focus-visible:ring-3 peer-focus-visible:ring-lagoon/40 peer-disabled:opacity-60 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-200 peer-checked:after:translate-x-5"
        />
      </label>
      <div className="mt-auto flex flex-wrap items-center gap-2 px-4 pb-4">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={Boolean(busy)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-teal ring-1 ring-teal hover:bg-teal-soft disabled:opacity-50"
        >
          <UploadIcon className="size-4" />
          Ganti foto
        </button>
        {service.image && (
          <button
            type="button"
            onClick={onReset}
            disabled={Boolean(busy)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-slate hover:bg-white hover:text-abyss disabled:opacity-50"
          >
            <TrashIcon className="size-4" />
            Pakai ilustrasi bawaan
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-label={`Foto kartu ${service.title}`}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) pick(file);
            e.target.value = "";
          }}
        />
      </div>
    </li>
  );
}
