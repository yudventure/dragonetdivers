"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckIcon } from "@/components/icons";
import { thumbUrl } from "./upload";

/**
 * Foto di panel kiri halaman formulir selam (permintaan pemilik 2 November 2026: "sebelah kiri brandingan
 * dragonet dan gambar terbaik dari galeri sedang diving"). Tim memilih satu foto dari galeri beranda; tanpa
 * pilihan dipakai foto bawaan. photos = [{ id, src, caption }], current = mediaId terpilih atau "".
 */
export default function WaiverPhotoPicker({ photos, current, fallback }) {
  const router = useRouter();
  const [chosen, setChosen] = useState(current);
  const [state, setState] = useState({ busy: "", message: "", error: false });

  async function choose(mediaId) {
    setState({ busy: mediaId ?? "bawaan", message: "", error: false });
    const response = await fetch("/api/admin/waiver-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId }),
    }).catch(() => null);
    const result = (await response?.json().catch(() => ({}))) ?? {};
    if (!response?.ok) return setState({ busy: "", message: result.error || "Belum tersimpan. Coba lagi.", error: true });
    setChosen(mediaId ?? "");
    setState({ busy: "", message: mediaId ? "Foto dipasang di halaman formulir." : "Kembali ke foto bawaan.", error: false });
    router.refresh();
  }

  const Tile = ({ id, src, caption }) => {
    const on = (id ?? "") === chosen;
    return (
      <li>
        <button
          type="button"
          onClick={() => !on && choose(id)}
          disabled={Boolean(state.busy)}
          aria-pressed={on}
          className={`group relative block aspect-[3/4] w-full overflow-hidden rounded-input ring-offset-2 transition ${on ? "ring-3 ring-teal" : "ring-1 ring-mist hover:ring-2 hover:ring-lagoon"}`}
        >
          <img src={src} alt={caption} loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
          {on && (
            <span className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-teal text-white shadow-float">
              <CheckIcon className="size-4" />
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 truncate bg-linear-to-t from-abyss/80 to-transparent px-2 pt-6 pb-1.5 text-left text-xs font-semibold text-white">
            {caption}
          </span>
          {state.busy === (id ?? "bawaan") && <span className="absolute inset-0 grid place-items-center bg-white/70 text-sm font-bold text-teal">Menyimpan…</span>}
        </button>
      </li>
    );
  };

  return (
    <section className="grid gap-4 rounded-card bg-white p-5 ring-1 ring-mist sm:p-6">
      <div className="grid gap-1">
        <h2 className="text-xl text-abyss">Foto di samping formulir</h2>
        <p className="text-sm text-slate">
          Tampil besar di sebelah kiri formulir (di ponsel di atasnya), bersama logo dan nama Dragonet Divers. Pilih foto penyelam terbaik dari
          galeri. Foto tegak paling pas; foto dipotong mengikuti bentuk panel dengan objek di tengah.
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <Tile id={null} src={fallback} caption="Foto bawaan" />
        {photos.map((photo) => (
          <Tile key={photo.id} id={photo.id} src={thumbUrl(photo.src, 384)} caption={photo.caption} />
        ))}
      </ul>
      {photos.length === 0 && <p className="text-sm text-slate">Galeri belum berisi foto. Unggah foto di Situs web, Galeri foto & video.</p>}
      {state.message && (
        <p role={state.error ? "alert" : "status"} className={`text-sm font-semibold ${state.error ? "text-danger" : "text-teal"}`}>
          {state.message}
        </p>
      )}
    </section>
  );
}
