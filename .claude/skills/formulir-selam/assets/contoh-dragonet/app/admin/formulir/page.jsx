import Link from "next/link";
import AdminGate from "@/admin/AdminGate";
import AdminShell, { DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import WaiverFilters from "@/admin/WaiverFilters";
import { Stats } from "@/admin/parts";
import { cleanWhatsApp, witToday } from "@/lib/checkout";
import { localeNamesId } from "@/lib/i18n";
import { displayPhone, waiverFileName } from "@/lib/waiver-document";
import { filterQuery, filterWaivers, isFiltered, reviewFilter, reviewOptions } from "@/lib/waiver-review";
import { currentAdmin } from "@/server/admin-auth";
import { databaseStatus } from "@/server/db";
import { listWaivers } from "@/server/waivers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meja peninjauan formulir" };

const dateId = (date) =>
  date ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`)) : "";
const witId = (iso) =>
  iso ? `${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jayapura" }).format(new Date(iso))} WIT` : "";
// Nomor tersimpan "+6281…" (sejak 11 November 2026) dirapikan; nomor lama tampil apa adanya.
const phoneText = (phone) => (phone?.startsWith("+") ? displayPhone(phone) : phone || "");
const ACTION =
  "inline-flex h-8 items-center gap-1 rounded-full px-3 text-xs font-bold ring-1 transition-colors duration-200 ease-brand whitespace-nowrap";

// /admin/formulir: meja peninjauan formulir selam (permintaan pemilik 11 November 2026: pengaturan formulir dipisah,
// filter "berdasarkan nama, negara, sertifikat atau sesuai nomor formulirnya", dan "setiap individunya juga bisa
// didownload langsung"). Cari dan filter (src/lib/waiver-review.js), rekap Excel sesuai filter, dan di tiap baris
// unduh PDF (membuka dokumen lalu jendela cetak, nama file nomor_nama_negara) dan Excel satu formulir. Email dan
// WhatsApp di kolom terpisah. Pengaturan (tautan, spreadsheet, foto, perjanjian) di /admin/formulir/pengaturan.
export default async function WaiverReviewPage({ searchParams }) {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const database = await databaseStatus();
  const filter = reviewFilter(await searchParams);
  const waivers = database.ok ? await listWaivers().catch((error) => console.error(`[admin/formulir] ${error.code ?? error.message}`)) : null;
  const today = witToday();
  const shown = waivers ? filterWaivers(waivers, filter, today) : [];
  const upcoming = waivers?.filter((w) => w.date >= today) ?? [];
  const query = filterQuery(filter);

  return (
    <AdminShell admin={admin} active="formulir">
      <ModuleTitle title="Meja peninjauan">
        Formulir selam yang sudah ditandatangani tamu. Cari dan saring, buka untuk meninjau, lalu unduh PDF atau Excel tiap tamu. Tautan formulir,
        spreadsheet, foto, dan teks perjanjian ada di{" "}
        <Link href="/admin/formulir/pengaturan" className="font-semibold text-teal hover:underline">
          Pengaturan formulir
        </Link>
        .
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
          <WaiverFilters filter={filter} options={reviewOptions(waivers)} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate">
              {isFiltered(filter) ? (
                <>
                  Menampilkan <strong className="text-abyss">{shown.length}</strong> dari {waivers.length} formulir.{" "}
                  <Link href="/admin/formulir" className="font-semibold text-teal hover:underline">
                    Hapus filter
                  </Link>
                </>
              ) : (
                <>
                  Semua <strong className="text-abyss">{waivers.length}</strong> formulir, terbaru di atas.
                </>
              )}
            </p>
            {shown.length > 0 && (
              <a
                href={`/api/admin/export?type=formulir${query ? `&${query}` : ""}`}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-teal ring-1 ring-mist transition-colors duration-200 ease-brand hover:ring-teal"
              >
                ⤓ Unduh rekap Excel ({shown.length})
              </a>
            )}
          </div>
          {shown.length === 0 ? (
            <p className="rounded-card bg-white p-5 text-slate ring-1 ring-mist">
              {waivers.length === 0 ? "Belum ada formulir yang masuk." : "Tidak ada formulir yang cocok dengan pencarian dan filter ini."}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-card bg-white ring-1 ring-mist">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="bg-foam text-xs tracking-[0.08em] text-slate uppercase">
                  <tr>
                    <th className="px-3 py-3 font-bold">Penyelam</th>
                    <th className="px-3 py-3 font-bold">WhatsApp</th>
                    <th className="px-3 py-3 font-bold">Email</th>
                    <th className="px-3 py-3 font-bold">Tanggal selam</th>
                    <th className="px-3 py-3 font-bold">Sertifikasi</th>
                    <th className="px-3 py-3 font-bold">Medis</th>
                    <th className="px-3 py-3 font-bold">Unduh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist">
                  {shown.map((w) => {
                    const wa = cleanWhatsApp(w.phone);
                    const file = waiverFileName(w);
                    return (
                      <tr key={w.code} className="align-top">
                        <td className="px-3 py-3">
                          <Link href={`/admin/formulir/${w.code}`} className="font-bold text-teal underline-offset-2 hover:underline">
                            {w.name}
                          </Link>
                          <span className="block font-mono text-xs text-abyss">{w.code}</span>
                          <span className="block text-xs text-slate">
                            {w.nationality} · {w.data.age ?? ""} th{w.minor ? " · di bawah 18" : ""} · bahasa {localeNamesId[w.lang] ?? w.lang}
                            {w.order ? ` · pesanan ${w.order}` : ""}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {w.phone ? (
                            wa ? (
                              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" className="font-semibold text-teal hover:underline">
                                {phoneText(w.phone)}
                              </a>
                            ) : (
                              <span className="text-abyss">{w.phone}</span>
                            )
                          ) : (
                            <span className="text-slate">–</span>
                          )}
                        </td>
                        <td className="min-w-[12.5rem] px-3 py-3">
                          {w.email ? (
                            // Dipotong ke baris baru di depan @ bila tidak muat, bukan di tengah kata.
                            <a href={`mailto:${w.email}`} className="text-abyss [overflow-wrap:anywhere] hover:text-teal hover:underline">
                              {w.email.split("@")[0]}
                              <wbr />@{w.email.split("@").slice(1).join("@")}
                            </a>
                          ) : (
                            <span className="text-slate">–</span>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-abyss">
                          {dateId(w.date)}
                          <span className="block text-xs text-slate">Diisi {witId(w.createdAt)}</span>
                        </td>
                        <td className="px-3 py-3 text-abyss">
                          {w.data.certified === false ? "Belum bersertifikat" : [w.data.certAgency, w.data.certLevel].filter(Boolean).join(" · ")}
                          {w.data.loggedDives != null && <span className="block text-xs text-slate">{w.data.loggedDives} penyelaman</span>}
                        </td>
                        <td className="px-3 py-3">
                          {w.clearance ? (
                            <span className="inline-flex rounded-full bg-sunrise-wash px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-ember ring-1 ring-sunrise">Perlu dokter</span>
                          ) : (
                            <span className="inline-flex rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success">Aman</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span className="flex flex-col items-start gap-1.5">
                            <a
                              href={`/admin/formulir/${w.code}?unduh=1`}
                              target="_blank"
                              rel="noopener"
                              title={`Unduh PDF ${file}.pdf`}
                              className={`${ACTION} bg-teal text-white ring-teal hover:bg-teal-dark`}
                            >
                              ⤓ PDF
                            </a>
                            <a
                              href={`/api/admin/export?type=formulir&kode=${w.code}`}
                              title={`Unduh Excel ${file}.xlsx`}
                              className={`${ACTION} bg-white text-teal ring-mist hover:ring-teal`}
                            >
                              ⤓ Excel
                            </a>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
