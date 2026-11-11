"use client";

import { useEffect } from "react";

/**
 * Tombol PDF di meja peninjauan membuka /admin/formulir/<kode>?unduh=1 di tab baru: setelah huruf, logo, dan
 * tanda tangan termuat, jendela cetak terbuka sendiri (pilih Simpan sebagai PDF), dengan nama file title
 * (nomor surat, nama, negara). ?unduh dibuang dari alamat supaya memuat ulang halaman tidak mencetak lagi.
 */
export default function AutoPrint({ title }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("unduh") !== "1") return;
    url.searchParams.delete("unduh");
    window.history.replaceState(window.history.state, "", url);
    let cancelled = false;
    (async () => {
      await document.fonts?.ready;
      const images = [...document.querySelectorAll(".waiver-doc img")];
      await Promise.all(
        images.map((img) =>
          img.complete
            ? null
            : new Promise((done) => {
                img.addEventListener("load", done, { once: true });
                img.addEventListener("error", done, { once: true });
              }),
        ),
      );
      if (cancelled) return;
      document.title = title;
      setTimeout(() => !cancelled && window.print(), 200);
    })();
    return () => {
      cancelled = true;
    };
  }, [title]);
  return null;
}
