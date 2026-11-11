import Link from "next/link";
import AdminGate from "@/admin/AdminGate";
import AdminShell, { DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import { CopyText } from "@/admin/CopyText";
import WaiverAgreementForm from "@/admin/WaiverAgreementForm";
import WaiverPhotoPicker from "@/admin/WaiverPhotoPicker";
import WaiverSheetPanel from "@/admin/WaiverSheetPanel";
import learnDiver from "@/assets/learn-diver.webp";
import { defaultAgreements } from "@/content/waiver-agreement";
import { site } from "@/lib/site";
import { appsScript } from "@/lib/waiver-sheet";
import { currentAdmin } from "@/server/admin-auth";
import { databaseStatus } from "@/server/db";
import { listRecords } from "@/server/records";
import { getSetting } from "@/server/settings";
import { ensureSheetToken, pendingCount, sheetSyncRunning } from "@/server/waiver-sheet";
import { DEFAULT_AGREEMENT, getAgreement, waiverTotal } from "@/server/waivers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengaturan formulir" };

// /admin/formulir/pengaturan: pengaturan formulir selam, terpisah dari meja peninjauan di /admin/formulir
// (permintaan pemilik 11 November 2026). Tautan formulir untuk tamu, spreadsheet (unduh Excel dan Google Sheets
// otomatis, WaiverSheetPanel.jsx), foto di samping formulir, dan teks perjanjian empat bahasa.
export default async function WaiverSettingsPage() {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const database = await databaseStatus();
  const [agreement, gallery, photo, sheet, pending, total] = database.ok
    ? await Promise.all([
        getAgreement().catch(() => DEFAULT_AGREEMENT),
        listRecords("gallery").catch(() => []),
        getSetting("waiver_photo", { mediaId: "" }).catch(() => ({ mediaId: "" })),
        ensureSheetToken().catch(() => null),
        pendingCount().catch(() => 0),
        waiverTotal().catch(() => 0),
      ])
    : [DEFAULT_AGREEMENT, [], { mediaId: "" }, null, 0, 0];
  // Foto galeri yang bisa dipilih untuk panel kiri /waiver (yang tampil lebih dulu).
  const photos = gallery
    .filter((r) => r.type === "photo" && r.mediaId)
    .sort((a, b) => Number(b.active) - Number(a.active) || (a.order ?? 0) - (b.order ?? 0))
    .map((r) => ({ id: r.mediaId, src: `/api/media/${r.mediaId}`, caption: r.captionId }));
  const link = `${site.url}/waiver`;

  return (
    <AdminShell admin={admin} active="formulir-pengaturan">
      <ModuleTitle title="Pengaturan formulir">
        Tautan formulir untuk tamu, spreadsheet, foto di samping formulir, dan teks perjanjian. Formulir yang sudah masuk ditinjau di{" "}
        <Link href="/admin/formulir" className="font-semibold text-teal hover:underline">
          Meja peninjauan
        </Link>
        .
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {database.ok && (
        <>
          <section className="grid gap-3 rounded-card bg-white p-5 ring-1 ring-mist">
            <h2 className="font-sans text-sm font-semibold text-slate">Tautan formulir untuk tamu</h2>
            <CopyText value={link} />
            <p className="text-xs text-slate">Tautan dari halaman pesanan otomatis terhubung ke pesanannya. Untuk di meja dive center, jadikan tautan ini kode QR.</p>
          </section>
          {sheet?.token && (
            <WaiverSheetPanel
              initial={{
                connected: Boolean(sheet.url),
                url: sheet.url,
                pending,
                running: sheetSyncRunning(),
                lastSync: sheet.lastSync,
                lastError: sheet.lastError,
                sheet: sheet.lastSheet,
              }}
              script={appsScript(sheet.token)}
              total={total}
            />
          )}
          <WaiverPhotoPicker photos={photos} current={photos.some((p) => p.id === photo.mediaId) ? photo.mediaId : ""} fallback={learnDiver.src} />
          <WaiverAgreementForm
            initial={{ en: agreement.en ?? "", id: agreement.id ?? "", zh: agreement.zh ?? "", ko: agreement.ko ?? "" }}
            fallback={defaultAgreements}
            custom={Boolean(agreement.en || agreement.id || agreement.zh || agreement.ko)}
          />
        </>
      )}
    </AdminShell>
  );
}
