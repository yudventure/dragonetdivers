import AdminGate from "@/admin/AdminGate";
import AdminShell, { Card, DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import { ExportLink, monthParam, MonthNav, SectionTitle } from "@/admin/parts";
import RecordManager, { QuickAdd } from "@/admin/RecordManager";
import SettingsForm from "@/admin/SettingsForm";
import { availability, covers, monthGrid, orderHoldsPlaces, POOL_LABEL, SERVICE_OPTIONS } from "@/lib/modules/calendar";
import { isDate, shortDay, witDate } from "@/lib/records";
import { lowAt } from "@/lib/slots";
import { currentAdmin } from "@/server/admin-auth";
import { calendarMonth, refOptions } from "@/server/admin-data";
import { databaseStatus } from "@/server/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kalender reservasi" };

const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const service = (key) => SERVICE_OPTIONS.find(([k]) => k === key)?.[1] ?? "Semua layanan";

const CHIP = {
  confirmed: "bg-teal text-white",
  pending: "bg-sunrise-wash text-ember ring-1 ring-sunrise",
  paid: "bg-success text-white",
  waiting: "bg-white text-ember ring-1 ring-sunrise",
  closed: "bg-abyss text-white",
};
const LEGEND = [
  ["confirmed", "Dikonfirmasi"],
  ["pending", "Belum dikonfirmasi"],
  ["paid", "Lunas online"],
  ["waiting", "Menunggu bayar online"],
  ["closed", "Tutup"],
];

// Pemakaian tempat per kelompok kapasitas (layanan wakilnya untuk availability()).
const POOLS = [
  ["diving", "fun-dives", "Selam"],
  ["snorkeling", "snorkeling", "Snorkel"],
];

/** Orang terisi dan kapasitas tiap kelompok di satu tanggal; kelompok tanpa batas dan tanpa tamu tidak ditampilkan. */
function usage(date, data) {
  return POOLS.map(([pool, service, label]) => ({ pool, label, ...availability({ date, service, capacity: data.capacity, orders: data.orders, reservations: data.reservations }) })).filter(
    (u) => u.capacity || u.used,
  );
}

const meterTone = (u) => (u.left === 0 ? "bg-danger" : u.left <= lowAt(u.capacity) ? "bg-sunrise" : "bg-teal");

/** Baris "Selam 12/30" dengan bilah terisi di sel kalender. */
function Meter({ u }) {
  return (
    <span className="grid gap-0.5" title={u.capacity ? `${u.label}: ${u.used} dari ${u.capacity} orang, sisa ${u.left}` : `${u.label}: ${u.used} orang`}>
      <span className="flex items-baseline justify-between gap-1 text-[11px] leading-none font-semibold text-slate">
        <span>{u.closed ? `${u.label} tutup` : u.label}</span>
        <span className={`tabular-nums ${u.capacity && u.left === 0 ? "text-danger" : "text-abyss"}`}>{u.capacity ? `${u.used}/${u.capacity}` : `${u.used} org`}</span>
      </span>
      {u.capacity > 0 && (
        <span className="h-1.5 overflow-hidden rounded-full bg-mist">
          <span className={`block h-full rounded-full ${meterTone(u)}`} style={{ width: `${Math.min(100, (u.used / u.capacity) * 100)}%` }} />
        </span>
      )}
    </span>
  );
}

/** Kegiatan satu hari: pesanan website dan reservasi tim, dengan warna chip. */
function agenda(date, { orders, reservations }) {
  const items = [];
  for (const r of reservations.filter((r) => covers(r, date) && r.status !== "cancelled")) {
    items.push(
      r.status === "closed"
        ? { tone: "closed", text: `Tutup · ${service(r.service)}`, reservation: r }
        : { tone: r.status, text: `${r.guestName} · ${service(r.service)}`, reservation: r },
    );
  }
  for (const o of orders.filter((o) => o.date === date && orderHoldsPlaces(o))) {
    items.push({ tone: o.status === "paid" ? "paid" : "waiting", text: `${o.name} · ${o.packageName}`, order: o });
  }
  return items;
}

// /admin/kalender: kalender bulanan reservasi (mengikuti Zanclus). Pesanan website tampil otomatis;
// reservasi dari WhatsApp, datang langsung, atau agen dicatat di sini. Tanggal tutup dan kapasitas harian
// juga dipakai checkout website.
export default async function CalendarPage({ searchParams }) {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const params = await searchParams;
  const month = monthParam(params.bulan);
  const today = witDate();
  const day = isDate(params.hari) && params.hari.startsWith(month) ? params.hari : today.startsWith(month) ? today : `${month}-01`;
  const database = await databaseStatus();
  let data = null;
  if (database.ok) data = await calendarMonth(month).catch((error) => console.error(`[admin/kalender] ${error.code ?? error.message}`));
  const partners = data ? refOptions(data.partners) : [];
  const dayItems = data ? agenda(day, data) : [];
  const dayOrders = dayItems.filter((i) => i.order);
  const dayReservations = data ? data.reservations.filter((r) => covers(r, day)) : [];
  const avail = (s) => availability({ date: day, service: s, capacity: data.capacity, orders: data.orders.filter((o) => o.date === day), reservations: dayReservations });

  return (
    <AdminShell admin={admin} active="kalender">
      <ModuleTitle title="Kalender reservasi">
        Pesanan dari website tampil otomatis. Catat juga reservasi dari WhatsApp, tamu yang datang langsung, dan agen, lalu tutup tanggal yang tidak
        dijual. Tanggal tutup dan kapasitas harian ikut diperiksa checkout website.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {data && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MonthNav month={month} path="/admin/kalender" />
            <ExportLink query={{ type: "reservasi", bulan: month }} />
          </div>
          <ul className="flex flex-wrap gap-2 text-xs font-semibold" aria-label="Keterangan warna">
            {LEGEND.map(([tone, label]) => (
              <li key={tone} className={`rounded-full px-2.5 py-1 ${CHIP[tone]}`}>
                {label}
              </li>
            ))}
          </ul>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate">
            <span>
              <span className="font-semibold text-abyss">Selam 12/30</span> berarti 12 tamu sudah terisi dari kapasitas harian.
            </span>
            {[
              ["bg-teal", "Masih longgar"],
              ["bg-sunrise", "Hampir penuh"],
              ["bg-danger", "Penuh"],
            ].map(([tone, label]) => (
              <span key={label} className="flex items-center gap-1.5">
                <i aria-hidden="true" className={`h-1.5 w-5 rounded-full ${tone}`} />
                {label}
              </span>
            ))}
          </p>

          <div className="relative overflow-x-auto rounded-card bg-white ring-1 ring-mist">
            <div className="grid min-w-[720px] grid-cols-7">
              {WEEKDAYS.map((d) => (
                <div key={d} className="border-b border-mist bg-foam px-2 py-2 text-center text-xs font-bold tracking-[0.1em] text-slate uppercase">
                  {d}
                </div>
              ))}
              {monthGrid(month).map((date, i) => {
                if (!date) return <div key={`x${i}`} className="min-h-28 border-b border-r border-mist bg-foam/50" />;
                const items = agenda(date, data);
                const pools = usage(date, data);
                const selected = date === day;
                return (
                  <a
                    key={date}
                    href={`/admin/kalender?bulan=${month}&hari=${date}#hari`}
                    aria-current={selected ? "date" : undefined}
                    className={`grid min-h-32 content-start gap-1 border-b border-r border-mist p-1.5 transition-colors hover:bg-teal-wash ${selected ? "bg-teal-wash ring-2 ring-teal ring-inset" : ""}`}
                  >
                    <span className={`grid size-7 place-items-center rounded-full text-sm font-bold ${date === today ? "bg-abyss text-white" : "text-abyss"}`}>{Number(date.slice(8))}</span>
                    {pools.map((u) => (
                      <Meter key={u.pool} u={u} />
                    ))}
                    {items.slice(0, 3).map((it, j) => (
                      <span key={j} className={`truncate rounded px-1.5 py-0.5 text-[11px] leading-tight font-semibold ${CHIP[it.tone]}`}>
                        {it.text}
                      </span>
                    ))}
                    {items.length > 3 && <span className="text-[11px] font-semibold text-slate">+{items.length - 3} lainnya</span>}
                  </a>
                );
              })}
            </div>
          </div>

          <section id="hari" className="grid scroll-mt-28 gap-4">
            <SectionTitle>Agenda {shortDay(day)}</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              {["fun-dives", "snorkeling"].map((s) => {
                const a = avail(s);
                const pool = s === "fun-dives" ? "diving" : "snorkeling";
                return (
                  <p key={s} className="rounded-card bg-white p-4 text-sm ring-1 ring-mist">
                    <span className="block font-semibold text-slate">{POOL_LABEL[pool]}</span>
                    <span className="font-display text-xl font-semibold text-abyss">
                      {a.closed ? "Tutup" : a.capacity ? `${a.used} / ${a.capacity} orang` : `${a.used} orang`}
                    </span>
                    {!a.closed && a.capacity > 0 && (
                      <span className={`ml-2 font-bold ${a.left === 0 ? "text-danger" : "text-teal"}`}>{a.left === 0 ? "Penuh" : `Sisa ${a.left} tempat`}</span>
                    )}
                    {!a.closed && !a.capacity && <span className="ml-2 text-slate">tanpa batas</span>}
                  </p>
                );
              })}
            </div>
            {dayOrders.length > 0 && (
              <Card title="Pesanan website">
                <ul className="grid gap-2 text-sm">
                  {dayOrders.map(({ order: o }) => (
                    <li key={`${o.code}-${o.item ?? 0}`} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${CHIP[o.status === "paid" ? "paid" : "waiting"]}`}>{o.status === "paid" ? "Lunas" : "Menunggu bayar"}</span>
                      <span className="font-semibold text-abyss">{o.name}</span>
                      <span className="text-slate">
                        {o.packageName} · {o.guests} orang ·{" "}
                        <a href={`https://wa.me/${o.whatsapp}`} target="_blank" rel="noopener" className="font-semibold text-teal hover:underline">
                          WhatsApp
                        </a>{" "}
                        ·{" "}
                        <a href={`/admin/pesanan?status=${o.status}`} className="font-semibold text-teal hover:underline">
                          {o.code}
                        </a>
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
            <div className="flex flex-wrap gap-2">
              <QuickAdd
                kind="reservation"
                defaults={{ startDate: day, status: "closed", service: "all" }}
                refs={{ partnerId: partners }}
                label="Tutup tanggal ini"
                title={`Tutup ${shortDay(day)}`}
              />
            </div>
            <RecordManager
              kind="reservation"
              records={dayReservations}
              refs={{ partnerId: partners }}
              defaults={{ startDate: day }}
              addLabel="Catat reservasi tanggal ini"
              columns={["guestName", "service", "participants", "status", "payStatus", "source"]}
              empty="Belum ada reservasi tim di tanggal ini."
              search={false}
            />
          </section>

          <section className="grid gap-4">
            <SectionTitle>Daftar reservasi bulan ini</SectionTitle>
            <RecordManager
              kind="reservation"
              records={data.reservations}
              refs={{ partnerId: partners }}
              defaults={{ startDate: day }}
              columns={["startDate", "guestName", "service", "participants", "status", "payStatus", "amount", "source"]}
              empty="Belum ada reservasi tim bulan ini. Pesanan website tetap tampil di kalender."
            />
          </section>

          <Card title="Kapasitas harian">
            <p className="text-sm text-slate">
              Jumlah tamu paling banyak per hari (bawaan 30 untuk menyelam). Pesanan lunas, pesanan yang masih menunggu bayar, dan reservasi yang belum
              dibatalkan ikut dihitung; paket-paket satu pesanan di tanggal yang sama dihitung satu rombongan. Sisa tempat tampil di kalender halaman
              layanan, dan checkout website menolak tanggal yang sudah penuh. Isi 0 bila tidak dibatasi.
            </p>
            <SettingsForm
              endpoint="/api/admin/calendar"
              bodyKey="capacity"
              initial={{ diving: String(data.capacity.diving), snorkeling: String(data.capacity.snorkeling) }}
              fields={[
                { key: "diving", label: POOL_LABEL.diving, type: "number", hint: "Mis. jumlah kursi perahu selam." },
                { key: "snorkeling", label: POOL_LABEL.snorkeling, type: "number" },
              ]}
              submitLabel="Simpan kapasitas"
            />
          </Card>
        </>
      )}
    </AdminShell>
  );
}
