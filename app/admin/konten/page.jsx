import AdminGate from "@/admin/AdminGate";
import AdminShell, { Card, DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import { ExportLink, monthParam, MonthNav, SectionTitle } from "@/admin/parts";
import RecordManager from "@/admin/RecordManager";
import { monthGrid } from "@/lib/modules/calendar";
import { contentSummary } from "@/lib/modules/pr";
import { monthRange, witDate } from "@/lib/records";
import { currentAdmin } from "@/server/admin-auth";
import { databaseStatus } from "@/server/db";
import { listRecords } from "@/server/records";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kalender konten" };

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
// Warna chip per platform, dari palet brand.
const PLATFORM = { instagram: "bg-mandarin-wash text-ember", tiktok: "bg-abyss text-white", facebook: "bg-teal-soft text-teal", youtube: "bg-danger/10 text-danger", website: "bg-lagoon-wash text-teal" };
const live = (p) => p.status === "published" || p.status === "evaluated";
const number = (n) => new Intl.NumberFormat("id-ID").format(n);

// /admin/konten: kalender konten media sosial (mengikuti Zanclus): rencanakan, tandai tayang, lalu isi
// hasilnya (tayangan, jangkauan, suka, dll.) untuk evaluasi bulanan.
export default async function ContentPage({ searchParams }) {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const month = monthParam((await searchParams).bulan);
  const { from, to } = monthRange(month);
  const database = await databaseStatus();
  const posts = database.ok ? await listRecords("post", { from, to }).catch((error) => console.error(`[admin/konten] ${error.code ?? error.message}`)) : null;
  const summary = posts ? contentSummary(posts) : null;
  const today = witDate();
  return (
    <AdminShell admin={admin} active="konten">
      <ModuleTitle title="Kalender konten">
        Rencanakan konten Instagram, TikTok, Facebook, YouTube, dan website per hari. Setelah tayang, isi tautan dan hasilnya supaya evaluasi bulanan
        langsung terlihat.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {posts && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MonthNav month={month} path="/admin/konten" />
            <ExportLink query={{ type: "konten", bulan: month }} />
          </div>
          <p className="text-xs text-slate">Chip pudar = ide atau draf. Chip tebal = terjadwal atau tayang.</p>
          <div className="overflow-x-auto rounded-card bg-white ring-1 ring-mist">
            <div className="grid min-w-[720px] grid-cols-7">
              {WEEKDAYS.map((d) => (
                <div key={d} className="border-b border-mist bg-foam px-2 py-2 text-center text-xs font-bold tracking-[0.1em] text-slate uppercase">
                  {d}
                </div>
              ))}
              {monthGrid(month).map((date, i) => {
                if (!date) return <div key={`x${i}`} className="min-h-24 border-b border-r border-mist bg-foam/50" />;
                const day = posts.filter((p) => p.date === date);
                return (
                  <div key={date} className="grid min-h-24 content-start gap-1 border-b border-r border-mist p-1.5">
                    <span className={`grid size-7 place-items-center rounded-full text-sm font-bold ${date === today ? "bg-abyss text-white" : "text-abyss"}`}>{Number(date.slice(8))}</span>
                    {day.map((p) => (
                      <span
                        key={p.id}
                        title={p.title}
                        className={`truncate rounded px-1.5 py-0.5 text-[11px] leading-tight font-semibold ${PLATFORM[p.platform]} ${p.status === "idea" || p.status === "draft" ? "opacity-55" : ""}`}
                      >
                        {p.time ? `${p.time} ` : ""}
                        {p.title}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          <SectionTitle>Konten bulan ini</SectionTitle>
          <RecordManager
            kind="post"
            records={posts.sort((a, b) => a.date.localeCompare(b.date) || String(a.time).localeCompare(String(b.time)))}
            defaults={{ date: today.startsWith(month) ? today : from }}
            addLabel="Konten baru"
            empty="Belum ada konten yang direncanakan bulan ini."
          />
          <Card title="Hasil bulan ini">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="grid content-start gap-1.5 text-sm">
                <p className="font-semibold text-abyss">Rencana dan tayang</p>
                {summary.platforms.length === 0 ? (
                  <p className="text-slate">Belum ada konten.</p>
                ) : (
                  summary.platforms.map((p) => (
                    <p key={p.key} className="flex justify-between gap-3">
                      <span>{p.label}</span>
                      <span className="tabular-nums">
                        {p.live} dari {p.planned} tayang
                      </span>
                    </p>
                  ))
                )}
              </div>
              <div className="grid content-start gap-1.5 text-sm">
                <p className="font-semibold text-abyss">Status</p>
                {summary.status.map((s) => (
                  <p key={s.key} className="flex justify-between gap-3">
                    <span>{s.label}</span>
                    <span className="tabular-nums">{s.count}</span>
                  </p>
                ))}
              </div>
              <div className="grid content-start gap-1.5 text-sm">
                <p className="font-semibold text-abyss">Hasil konten yang tayang ({posts.filter(live).length})</p>
                {summary.metrics.map((m) => (
                  <p key={m.key} className="flex justify-between gap-3">
                    <span>{m.label}</span>
                    <span className="font-semibold tabular-nums">{number(m.total)}</span>
                  </p>
                ))}
              </div>
            </div>
          </Card>
        </>
      )}
    </AdminShell>
  );
}
