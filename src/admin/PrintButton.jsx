"use client";

/** Tombol cetak halaman (formulir selam di /admin/formulir/<kode>). */
export default function PrintButton({ label = "Cetak atau simpan PDF" }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-bold text-teal ring-1 ring-mist transition-colors duration-200 ease-brand hover:ring-teal"
    >
      {label}
    </button>
  );
}
