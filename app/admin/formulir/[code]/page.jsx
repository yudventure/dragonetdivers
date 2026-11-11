import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import AdminGate from "@/admin/AdminGate";
import AdminShell from "@/admin/AdminShell";
import AutoPrint from "@/admin/AutoPrint";
import PrintButton from "@/admin/PrintButton";
import WaiverDocument from "@/admin/WaiverDocument";
import { localeNamesId } from "@/lib/i18n";
import { contact, site, whatsappNumber } from "@/lib/site";
import { isWaiverCode } from "@/lib/waiver";
import { waiverFileName } from "@/lib/waiver-document";
import { currentAdmin } from "@/server/admin-auth";
import { waiverByCode } from "@/server/waivers";

export const dynamic = "force-dynamic";

const load = cache((code) => waiverByCode(code).catch((error) => console.error(`[admin/formulir] ${error.code ?? error.message}`)));

// Judul halaman = nama file PDF (peramban menamai PDF dari judul halaman): nomor surat, nama, dan negara.
// Hanya untuk operator yang masuk, supaya nama tamu tidak muncul di judul halaman bagi yang lain.
export async function generateMetadata({ params }) {
  const { code } = await params;
  if (!isWaiverCode(code) || !(await currentAdmin())) return { title: "Formulir selam" };
  const w = await load(code);
  return { title: w ? { absolute: waiverFileName(w) } : "Formulir selam" };
}

// /admin/formulir/<kode>: ringkasan untuk tim (Bahasa Indonesia) dan dokumen formulir selam bermerek Dragonet
// (src/admin/WaiverDocument.jsx) yang tampil persis seperti hasil cetak atau PDF-nya. Saat dicetak hanya
// dokumennya yang tercetak.
export default async function WaiverDetailPage({ params }) {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const { code } = await params;
  if (!isWaiverCode(code)) notFound();
  const w = await load(code);
  if (!w) notFound();
  const fileName = waiverFileName(w);

  return (
    <AdminShell admin={admin} active="formulir">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <Link href="/admin/formulir" className="text-sm font-bold text-teal hover:underline">
          ← Meja peninjauan
        </Link>
        <span className="flex flex-wrap gap-2">
          <a
            href={`/api/admin/export?type=formulir&kode=${w.code}`}
            className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-bold text-teal ring-1 ring-mist transition-colors duration-200 ease-brand hover:ring-teal"
          >
            ⤓ Excel
          </a>
          <PrintButton title={fileName} label="⤓ Unduh PDF atau cetak" />
        </span>
      </div>
      <div className="grid gap-1 print:hidden">
        <p className="font-mono text-sm text-slate">{w.code}</p>
        <h1 className="text-3xl leading-tight text-abyss">{w.name}</h1>
        <p className="text-slate">
          {w.nationality} · ditandatangani{" "}
          {new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jayapura" }).format(new Date(w.createdAt))} WIT ·
          bahasa {localeNamesId[w.lang] ?? w.lang}
          {w.order && (
            <>
              {" "}
              · pesanan <span className="font-mono">{w.order}</span>
            </>
          )}
        </p>
      </div>
      {w.clearance ? (
        <p className="rounded-card bg-sunrise-wash p-4 font-semibold text-abyss ring-1 ring-sunrise print:hidden">
          Perlu persetujuan dokter sebelum menyelam karena ada jawaban Ya pada pertanyaan yang memerlukan evaluasi dokter. Minta surat evaluasi
          dokter (Diver Medical) sebelum tamu menyelam.
        </p>
      ) : (
        <p className="rounded-card bg-success/10 p-4 font-semibold text-success print:hidden">Tidak perlu persetujuan dokter menurut kuesioner medis.</p>
      )}
      <p className="text-sm text-slate print:hidden">
        Dokumen di bawah ini yang tercetak atau tersimpan sebagai PDF. Klik Unduh PDF atau cetak, lalu pilih Simpan sebagai PDF (Save as PDF) di
        tujuan cetak. Nama filenya otomatis <span className="font-mono font-semibold text-abyss">{fileName}.pdf</span>.
      </p>
      <AutoPrint title={fileName} />
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 print:m-0 print:overflow-visible print:p-0">
        <WaiverDocument w={w} contact={{ address: contact.address, email: contact.email, whatsapp: whatsappNumber() }} host={new URL(site.url).host} />
      </div>
    </AdminShell>
  );
}
