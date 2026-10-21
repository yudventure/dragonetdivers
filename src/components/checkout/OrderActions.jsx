"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Salin nomor rekening ke clipboard. */
export function CopyButton({ value, label, done }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value.replace(/[\s.-]/g, ""));
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {}
      }}
      className="h-8 rounded-full px-3 text-xs font-bold text-teal ring-1 ring-teal transition-colors duration-200 ease-brand hover:bg-teal-soft"
    >
      {copied ? done : label}
    </button>
  );
}

/**
 * Selama pembayaran Midtrans/PayPal masih menunggu, halaman pesanan memuat ulang statusnya tiap 15 detik
 * (hanya saat tab terlihat, paling lama sekitar 10 menit), jadi tamu yang baru kembali dari halaman bayar
 * melihat "lunas" tanpa menekan apa pun.
 */
export function AutoRefresh({ seconds = 15, times = 40 }) {
  const router = useRouter();
  useEffect(() => {
    let left = times;
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (--left <= 0) clearInterval(timer);
      router.refresh();
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds, times]);
  return null;
}
