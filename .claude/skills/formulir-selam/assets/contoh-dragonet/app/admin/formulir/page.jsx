import Link from "next/link";
import AdminGate from "@/admin/AdminGate";
import AdminShell, { DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import { CopyText } from "@/admin/CopyText";
import WaiverAgreementForm from "@/admin/WaiverAgreementForm";
import WaiverPhotoPicker from "@/admin/WaiverPhotoPicker";
import WaiverSheetPanel from "@/admin/WaiverSheetPanel";
import { Stats } from "@/admin/parts";
import learnDiver from "@/assets/learn-diver.webp";
import { defaultAgreements } from "@/content/waiver-agreement";
import { witToday } from "@/lib/checkout";
import { localeNamesId } from "@/lib/i18n";
import { appsScript } from "@/lib/waiver-sheet";
import { site } from "@/lib/site";
import { currentAdmin } from "@/server/admin-auth";
import { databaseStatus } from "@/server/db";
import { listRecords } from "@/server/records";
import { getSetting } from "@/server/settings";
import { ensureSheetToken, pendingCount, sheetSyncRunning } from "@/server/waiver-sheet";
import { DEFAULT_AGREEMENT, getAgreement, listWaivers } from "@/server/waivers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Formulir selam" };

const dateId = (date) =>
  date ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`)) : "";
const witId = (iso) =>
  iso ? `${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jayapura" }).format(new Date(iso))} WIT` : "";

// /admin/formulir: formulir selam yang diisi tamu (/waiver), terbaru di atas, dengan tanda "Perlu dokter" dari
// kuesioner medis; tautan formulir untuk dibagikan (atau dijadikan kode QR di dive center); spreadsheet (unduh
// Excel dan Google Sheets otomatis, WaiverSheetPanel.jsx); foto samping formulir; teks perjanjian.
export default async function WaiversPage() {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const database = await databaseStatus();
  const [waivers, agreement, gallery, photo, sheet, pending] = database.ok
    ? await Promise.all([
        listWaivers().catch((error) => console.error(`[admin/formulir] ${error.code ?? error.message}`)),
        getAgreement().catch(() => DEFAULT_AGREEMENT),
        listRecords("gallery").catch(() => []),
        getSetting("waiver_photo", { mediaId: "" }).catch(() => ({ mediaId: "" })),
        ensureSheetToken().catch(() => null),
        pendingCount().catch(() => 0),
      ])
    : [null, DEFAULT_AGREEMENT, [], { mediaId: "" }, null, 0];
  // Foto galeri yang bisa dipilih untuk panel kiri /waiver (yang tampil lebih dulu).
  const photos = gallery
    .filter((r) => r.type === "photo" && r.mediaId)
    .sort((a, b) => Number(b.active) - Number(a.active) || (a.order ?? 0) - (b.order ?? 0))
    .map((r) => ({ id: r.mediaId, src: `/api/media/${r.mediaId}`, caption: r.captionId }));
  const today = witToday();
  const link = `${site.url}/waiver`;
  const upcoming = waivers?.filter((w) => w.date >= today) ?? [];

  return (
    <AdminShell admin={admin} active="formulir">
      <ModuleTitle title="Formulir selam">
        Kuesioner medis dan pernyataan pelepasan tanggung jawab yang ditandatangani tiap penyelam. Tamu mendapat tautannya di halaman dan email
        pesanan selam; tamu yang datang langsung bisa membuka tautan di bawah dari ponsel.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {waivers && (
        <>
          <Stats
            items={[
              { label: "Formulir masuk", value: waivers.length },
              { label: "Akan menyelam", value: upcoming.length, hint: "Tanggal selam hari ini atau nanti" },
              { label: "Perlu persetujuan dokter", value: upcoming.filter((w) => w.clearance).length, tone: upcoming.some((w) => w.clearance) ? "warn" : undefined, hint: "Yang akan menyelam" },
              { label: "Di bawah 18 tahun", value: upcoming.filter((w) => w.minor).length, hint: "Yang akan menyelam" },
            ]}
          />
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
              total={waivers.length}
            />
          )}
          <section className="grid gap-3">
            <h2 className="text-xl text-abyss">Formulir terbaru</h2>
            {waivers.length === 0 ? (
              <p className="rounded-card bg-white p-5 text-slate ring-1 ring-mist">Belum ada formulir yang masuk.</p>
            ) : (
              <div className="overflow-x-auto rounded-card bg-white ring-1 ring-mist">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-foam text-xs tracking-[0.08em] text-slate uppercase">
                    <tr>
                      <th className="px-4 py-3 font-bold">Nama</th>
                      <th className="px-4 py-3 font-bold">Tanggal selam</th>
                      <th className="px-4 py-3 font-bold">Sertifikasi</th>
                      <th className="px-4 py-3 font-bold">Medis</th>
                      <th className="px-4 py-3 font-bold">Pesanan</th>
                      <th className="px-4 py-3 font-bold">Diisi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-mist">
                    {waivers.map((w) => (
                      <tr key={w.code} className="align-top">
                        <td className="px-4 py-3">
                          <Link href={`/admin/formulir/${w.code}`} className="font-bold text-teal underline-offset-2 hover:underline">
                            {w.name}
                          </Link>
                          <span className="block text-xs text-slate">
                            {w.nationality} · {w.data.age ?? ""} th{w.minor ? " · di bawah 18" : ""} · {localeNamesId[w.lang] ?? w.lang}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-abyss">{dateId(w.date)}</td>
                        <td className="px-4 py-3 text-abyss">
                          {w.data.certified === false ? "Belum bersertifikat" : [w.data.certAgency, w.data.certLevel].filter(Boolean).join(" · ")}
                          {w.data.loggedDives != null && <span className="block text-xs text-slate">{w.data.loggedDives} penyelaman</span>}
                        </td>
                        <td className="px-4 py-3">
                          {w.clearance ? (
                            <span className="inline-flex rounded-full bg-sunrise-wash px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-ember ring-1 ring-sunrise">Perlu dokter</span>
                          ) : (
                            <span className="inline-flex rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success">Aman</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-abyss">{w.order || "–"}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap text-slate">{witId(w.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
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
