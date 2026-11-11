"use client";

import { useRef } from "react";
import { SearchIcon } from "@/components/icons";
import { INPUT } from "./RecordManager";

const SELECT = `${INPUT} cursor-pointer pr-8`;

/**
 * Cari dan filter di meja peninjauan formulir selam (/admin/formulir): nama, nomor formulir, email, atau WhatsApp,
 * lalu negara, sertifikat, medis, dan waktu selam. Formulir biasa (GET), jadi filternya ada di alamat halaman dan
 * ikut ke rekap Excel; pilihan yang diganti langsung dikirim, kolom cari dengan Enter atau tombol Cari.
 * filter = reviewFilter, options = reviewOptions (negara dan agensi yang ada).
 */
export default function WaiverFilters({ filter, options }) {
  const form = useRef(null);
  const submit = () => form.current?.requestSubmit();
  const Select = ({ name, label, children }) => (
    <label className="grid gap-1">
      <span className="text-xs font-semibold text-slate">{label}</span>
      <select name={name} defaultValue={filter[name]} onChange={submit} className={SELECT}>
        {children}
      </select>
    </label>
  );

  return (
    <form ref={form} method="get" action="/admin/formulir" role="search" className="grid gap-3 rounded-card bg-white p-4 ring-1 ring-mist sm:p-5">
      <label className="grid gap-1">
        <span className="text-xs font-semibold text-slate">Cari nama, nomor formulir, email, atau WhatsApp</span>
        <span className="flex gap-2">
          <span className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2 text-slate" />
            <input type="search" name="q" defaultValue={filter.q} placeholder="mis. Jean, HJG72, 0812…" maxLength={100} className={`${INPUT} pl-10`} />
          </span>
          <button type="submit" className="h-11 shrink-0 rounded-full bg-teal px-5 font-bold text-white hover:bg-teal-dark">
            Cari
          </button>
        </span>
      </label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select name="negara" label="Negara">
          <option value="">Semua negara</option>
          {options.countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </Select>
        <Select name="sertifikat" label="Sertifikat">
          <option value="">Semua</option>
          <option value="ada">Sudah bersertifikat</option>
          <option value="belum">Belum bersertifikat (ikut kursus)</option>
          {options.agencies.length > 0 && (
            <optgroup label="Agensi">
              {options.agencies.map((agency) => (
                <option key={agency} value={agency}>
                  {agency}
                </option>
              ))}
            </optgroup>
          )}
        </Select>
        <Select name="medis" label="Medis">
          <option value="">Semua</option>
          <option value="dokter">Perlu dokter</option>
          <option value="aman">Aman</option>
        </Select>
        <Select name="waktu" label="Tanggal selam">
          <option value="">Semua tanggal</option>
          <option value="akan">Hari ini dan nanti</option>
          <option value="lalu">Sudah lewat</option>
        </Select>
      </div>
    </form>
  );
}
