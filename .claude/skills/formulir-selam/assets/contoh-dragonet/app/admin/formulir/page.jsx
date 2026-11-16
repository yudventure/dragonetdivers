import Link from "next/link";
import AdminGate from "@/admin/AdminGate";
import AdminShell, { DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import { ArrivalSelect, TrashButton, TrashedActions } from "@/admin/WaiverActions";
import WaiverFilters from "@/admin/WaiverFilters";
import { Stats } from "@/admin/parts";
import { TrashIcon } from "@/components/icons";
import { cleanWhatsApp, witToday } from "@/lib/checkout";
import { localeNamesId } from "@/lib/i18n";
import { displayPhone, waiverFileName } from "@/lib/waiver-document";
import { ARRIVALS, filterQuery, filterWaivers, isFiltered, reviewFilter, reviewOptions } from "@/lib/waiver-review";
import { currentAdmin } from "@/server/admin-auth";
import { databaseStatus } from "@/server/db";
import { listWaivers, trashCount } from "@/server/waivers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Meja peninjauan formulir" };

const dateId = (date) =>
  date ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`)) : "";
const witId = (iso) =>
  iso ? `${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jayapura" }).format(new Date(iso))} WIT` : "";
// Nomor tersimpan "+6281…" (sejak 11 November 2026) dirapikan; nomor lama tampil apa adanya.
const phoneText = (phone) => (phone?.startsWith("+") ? displayPhone(phone) : phone || "");
const TH = "px-3 py-3 font-bold";
const TD = "px-3 py-3";
const Dash = () => <span className="text-slate">–</span>;

/** Nama, nomor formulir, dan keterangan singkat penyelam (kolom pertama tabel). */
function Diver({ w }) {
  return (
    <>
      <Link href={`/admin/formulir/${w.code}`} className="font-bold text-teal underline-offset-2 hover:underline">
        {w.name}
      </Link>
      <span className="block font-mono text-xs text-abyss">{w.code}</span>
      <span className="block text-xs text-slate">
        {w.nationality} · {w.data.age ?? ""} th{w.minor ? " · di bawah 18" : ""} · bahasa {localeNamesId[w.lang] ?? w.lang}
        {w.order ? ` · pesanan ${w.order}` : ""}
      </span>
    </>
  );
}

const Medical = ({ w }) =>
  w.clearance ? (
    <span className="inline-flex rounded-full bg-sunrise-wash px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-ember ring-1 ring-sunrise">Perlu dokter</span>
  ) : (
    <span className="inline-flex rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success">Aman</span>
  );

// /admin/formulir: meja peninjauan formulir selam. Permintaan pemilik 11 November 2026: pengaturan formulir dipisah,
// filter "berdasarkan nama, negara, sertifikat atau sesuai nomor formulirnya", unduh tiap formulir langsung. 16 November
// 2026: di daftar cukup PDF, konfirmasi kedatangan, dan sampah untuk uji coba atau tamu yang tidak datang.
// Cari dan filter (src/lib/waiver-review.js), rekap Excel sesuai filter, kolom WhatsApp dan Email terpisah, di tiap
// baris kedatangan (ArrivalSelect), PDF (membuka dokumen lalu jendela cetak, nama file nomor_nama_negara), dan
// sampah (TrashButton, aktif untuk Tidak datang atau Uji coba). ?sampah=1 = isi sampah: pulihkan atau hapus
// permanen. Pengaturan (tautan, spreadsheet, foto, perjanjian) di /admin/formulir/pengaturan.
export default async function WaiverReviewPage({ searchParams }) {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const database = await databaseStatus();
  const params = await searchParams;
  const trash = params?.sampah === "1";
  const filter = reviewFilter(params);
  const log = (error) => console.error(`[admin/formulir] ${error.code ?? error.message}`);
  const [waivers, trashed] = database.ok
    ? await Promise.all([listWaivers(2000, { trashed: trash }).catch(log), trash ? null : trashCount().catch(() => 0)])
    : [null, 0];
  const today = witToday();
  const shown = waivers ? filterWaivers(waivers, filter, today) : [];
  const upcoming = (!trash && waivers?.filter((w) => w.date >= today)) || [];
  const query = filterQuery(filter);

  return (
    <AdminShell admin={admin} active="formulir">
      <ModuleTitle title={trash ? "Sampah formulir" : "Meja peninjauan"}>
        {trash ? (
          <>
            Formulir uji coba dan tamu yang tidak datang yang dipindahkan ke sampah. Tidak tampil di daftar, rekap, dan hitungan. Pulihkan bila keliru,
            atau hapus permanen (tanda tangan dan isinya hilang dari website).
          </>
        ) : (
          <>
            Formulir selam yang sudah ditandatangani tamu. Cari dan saring, tandai kedatangan, lalu unduh PDF tiap tamu. Formulir uji coba atau tamu yang
            tidak datang bisa dipindahkan ke sampah. Tautan formulir, spreadsheet, foto, dan teks perjanjian ada di{" "}
            <Link href="/admin/formulir/pengaturan" className="font-semibold text-teal hover:underline">
              Pengaturan formulir
            </Link>
            .
          </>
        )}
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {waivers && (
        <>
          {trash ? (
            <Link href="/admin/formulir" className="w-fit text-sm font-bold text-teal hover:underline">
              ← Kembali ke meja peninjauan
            </Link>
          ) : (
            <Stats
              items={[
                { label: "Formulir masuk", value: waivers.length },
                { label: "Akan menyelam", value: upcoming.length, hint: "Tanggal selam hari ini atau nanti" },
                { label: "Perlu persetujuan dokter", value: upcoming.filter((w) => w.clearance).length, tone: upcoming.some((w) => w.clearance) ? "warn" : undefined, hint: "Yang akan menyelam" },
                {
                  label: "Belum dikonfirmasi datang",
                  value: waivers.filter((w) => !w.arrival && w.date <= today).length,
                  hint: "Tanggal selam sudah tiba",
                },
              ]}
            />
          )}
          {!trash && <WaiverFilters filter={filter} options={reviewOptions(waivers)} />}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate">
              {trash ? (
                <>
                  <strong className="text-abyss">{waivers.length}</strong> formulir di sampah.
                </>
              ) : isFiltered(filter) ? (
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
            {!trash && (
              <span className="flex flex-wrap gap-2">
                <Link
                  href="/admin/formulir?sampah=1"
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-slate ring-1 ring-mist transition-colors duration-200 ease-brand hover:text-abyss hover:ring-line-strong"
                >
                  <TrashIcon className="size-4" />
                  Sampah ({trashed})
                </Link>
                {shown.length > 0 && (
                  <a
                    href={`/api/admin/export?type=formulir${query ? `&${query}` : ""}`}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-teal ring-1 ring-mist transition-colors duration-200 ease-brand hover:ring-teal"
                  >
                    ⤓ Unduh rekap Excel ({shown.length})
                  </a>
                )}
              </span>
            )}
          </div>
          {shown.length === 0 ? (
            <p className="rounded-card bg-white p-5 text-slate ring-1 ring-mist">
              {trash ? "Sampah kosong." : waivers.length === 0 ? "Belum ada formulir yang masuk." : "Tidak ada formulir yang cocok dengan pencarian dan filter ini."}
            </p>
          ) : trash ? (
            <div className="overflow-x-auto rounded-card bg-white ring-1 ring-mist">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-foam text-xs tracking-[0.08em] text-slate uppercase">
                  <tr>
                    <th className={TH}>Penyelam</th>
                    <th className={TH}>Tanggal selam</th>
                    <th className={TH}>Kedatangan</th>
                    <th className={TH}>Dipindahkan ke sampah</th>
                    <th className={TH}>Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist">
                  {shown.map((w) => (
                    <tr key={w.code} className="align-top">
                      <td className={TD}>
                        <Diver w={w} />
                      </td>
                      <td className={`${TD} whitespace-nowrap text-abyss`}>{dateId(w.date)}</td>
                      <td className={`${TD} text-abyss`}>{ARRIVALS[w.arrival] ?? ARRIVALS[""]}</td>
                      <td className={`${TD} text-xs text-slate`}>
                        {witId(w.trashedAt)}
                        {w.trashedBy && <span className="block">oleh {w.trashedBy}</span>}
                      </td>
                      <td className={TD}>
                        <TrashedActions code={w.code} name={w.name} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-card bg-white ring-1 ring-mist">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="bg-foam text-xs tracking-[0.08em] text-slate uppercase">
                  <tr>
                    <th className={TH}>Penyelam</th>
                    <th className={TH}>WhatsApp</th>
                    <th className={TH}>Email</th>
                    <th className={TH}>Tanggal selam</th>
                    <th className={TH}>Sertifikasi</th>
                    <th className={TH}>Medis</th>
                    <th className={TH}>Kedatangan & aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist">
                  {shown.map((w) => {
                    const wa = cleanWhatsApp(w.phone);
                    const file = waiverFileName(w);
                    return (
                      <tr key={w.code} className="align-top">
                        <td className={`${TD} min-w-[12rem]`}>
                          <Diver w={w} />
                        </td>
                        <td className={`${TD} whitespace-nowrap`}>
                          {w.phone ? (
                            wa ? (
                              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" className="font-semibold text-teal hover:underline">
                                {phoneText(w.phone)}
                              </a>
                            ) : (
                              <span className="text-abyss">{w.phone}</span>
                            )
                          ) : (
                            <Dash />
                          )}
                        </td>
                        <td className={`${TD} min-w-[10rem]`}>
                          {w.email ? (
                            // Dipotong ke baris baru di depan @ bila tidak muat, bukan di tengah kata.
                            <a href={`mailto:${w.email}`} className="text-abyss [overflow-wrap:anywhere] hover:text-teal hover:underline">
                              {w.email.split("@")[0]}
                              <wbr />@{w.email.split("@").slice(1).join("@")}
                            </a>
                          ) : (
                            <Dash />
                          )}
                        </td>
                        <td className={`${TD} whitespace-nowrap text-abyss`}>
                          {dateId(w.date)}
                          <span className="block text-xs text-slate">Diisi {witId(w.createdAt)}</span>
                        </td>
                        <td className={`${TD} text-abyss`}>
                          {w.data.certified === false ? "Belum bersertifikat" : [w.data.certAgency, w.data.certLevel].filter(Boolean).join(" · ")}
                          {w.data.loggedDives != null && <span className="block text-xs text-slate">{w.data.loggedDives} penyelaman</span>}
                        </td>
                        <td className={TD}>
                          <Medical w={w} />
                        </td>
                        <td className={`${TD} min-w-[9.5rem]`}>
                          <span title={w.arrivalBy ? `Dikonfirmasi ${w.arrivalBy}, ${witId(w.arrivalAt)}` : undefined} className="block">
                            <ArrivalSelect code={w.code} arrival={w.arrival} name={w.name} />
                          </span>
                          <span className="mt-2 flex items-center gap-1.5">
                            <a
                              href={`/admin/formulir/${w.code}?unduh=1`}
                              target="_blank"
                              rel="noopener"
                              title={`Unduh PDF ${file}.pdf`}
                              className="inline-flex h-8 items-center gap-1 rounded-full bg-teal px-3 text-xs font-bold whitespace-nowrap text-white transition-colors duration-200 ease-brand hover:bg-teal-dark"
                            >
                              ⤓ PDF
                            </a>
                            <TrashButton code={w.code} name={w.name} arrival={w.arrival} />
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
