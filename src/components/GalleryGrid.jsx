"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { format } from "@/lib/i18n";
import EmbedVideo from "./EmbedVideo";
import LoopVideo from "./LoopVideo";
import { ChevronIcon, CloseIcon } from "./icons";

const SIZES = {
  small: "",
  wide: "col-span-2",
  tall: "row-span-2",
  big: "col-span-2 row-span-2",
};

// Beranda menampilkan 12 item dulu (sisanya lewat tombol), jadi galeri yang diisi puluhan foto lewat
// /admin/situs tidak memperlambat halaman; penampil layar penuh tetap bisa berpindah ke semua foto.
const FIRST = 12;
const MORE = 12;

const tileSizes = (size) => (size === "big" || size === "wide" ? "(min-width: 768px) 600px, 100vw" : "(min-width: 768px) 300px, 50vw");

// Kisi galeri gaya bento (grid-flow-dense mengisi celah) + penampil foto layar penuh. Penampil memakai
// <dialog> (fokus dan Esc ditangani peramban), panah kiri/kanan berpindah foto, ketuk di luar foto
// menutup. Gulir halaman dikunci dengan membekukan body (position: fixed), karena Safari di iPhone
// mengabaikan overflow: hidden untuk sentuhan. t = teks galeri dalam bahasa halaman (src/content/ui.js).
export default function GalleryGrid({ items, t }) {
  const photos = items.filter((item) => item.type === "photo");
  const [open, setOpen] = useState(null);
  const [limit, setLimit] = useState(FIRST);
  const dialog = useRef(null);
  const isOpen = open != null;

  useEffect(() => {
    const el = dialog.current;
    if (!isOpen) {
      if (el.open) el.close();
      return;
    }
    if (!el.open) el.showModal();
    const y = window.scrollY;
    const body = document.body.style;
    Object.assign(body, { position: "fixed", top: `-${y}px`, left: "0", right: "0" });
    return () => {
      Object.assign(body, { position: "", top: "", left: "", right: "" });
      window.scrollTo(0, y);
    };
  }, [isOpen]);

  const step = (delta) => setOpen((i) => (i == null ? i : (i + delta + photos.length) % photos.length));
  const photo = open == null ? null : photos[open];

  return (
    <>
      <ul className="grid auto-rows-[44vw] grid-cols-2 gap-3 [grid-auto-flow:dense] sm:auto-rows-[200px] md:grid-cols-4 md:gap-4 md:auto-rows-[190px] lg:auto-rows-[220px]">
        {items.slice(0, limit).map((item, i) => (
          <li key={item.url ?? item.alt ?? item.title ?? i} className={`relative overflow-hidden rounded-card bg-foam ${SIZES[item.size] ?? ""}`}>
            {item.type === "photo" && (
              <button
                type="button"
                onClick={() => setOpen(photos.indexOf(item))}
                className="group block size-full cursor-zoom-in"
                aria-label={format(t.openPhoto, { alt: item.alt })}
              >
                <Image
                  src={item.image}
                  alt={item.alt}
                  sizes={tileSizes(item.size)}
                  placeholder="blur"
                  className="size-full object-cover transition-transform duration-500 ease-brand group-hover:scale-105"
                />
              </button>
            )}
            {item.type === "video" && (
              <LoopVideo sources={item.sources} poster={item.poster.src} className="size-full object-cover" />
            )}
            {item.type === "embed" && <EmbedVideo video={item.video} title={item.title} t={t} />}
          </li>
        ))}
      </ul>
      {items.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((n) => n + MORE)}
          className="justify-self-center rounded-full border-[1.5px] border-teal px-6 py-3 font-bold text-teal transition-colors duration-200 ease-brand hover:bg-teal-soft"
        >
          {format(t.more, { count: Math.min(MORE, items.length - limit) })}
        </button>
      )}

      <dialog
        ref={dialog}
        aria-label={photo?.alt ?? t.photo}
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === e.currentTarget && setOpen(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        className="m-auto max-h-none max-w-none overflow-visible bg-transparent p-0 backdrop:bg-abyss/90"
      >
        {photo && (
          <figure className="grid justify-items-center gap-3 px-4">
            <Image
              src={photo.image}
              alt={photo.alt}
              sizes="100vw"
              placeholder="blur"
              className="h-auto max-h-[80vh] w-auto max-w-[min(1200px,92vw)] rounded-card object-contain supports-[height:1svh]:max-h-[80svh]"
            />
            <figcaption className="max-w-[60ch] text-center text-sm text-white/85">{photo.alt}</figcaption>
          </figure>
        )}
        <button
          type="button"
          onClick={() => setOpen(null)}
          className="fixed top-4 right-4 grid size-11 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/30 hover:bg-white hover:text-abyss"
          aria-label={t.close}
        >
          <CloseIcon className="size-5" />
        </button>
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              className="fixed top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/30 hover:bg-white hover:text-abyss"
              aria-label={t.previous}
            >
              <ChevronIcon className="size-5 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              className="fixed top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white ring-1 ring-white/30 hover:bg-white hover:text-abyss"
              aria-label={t.next}
            >
              <ChevronIcon className="size-5" />
            </button>
          </>
        )}
      </dialog>
    </>
  );
}
