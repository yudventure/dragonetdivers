import Image from "next/image";
import heroPhoto from "../assets/ocean-manta-loop.webp";
import { gallery } from "@/content/gallery";
import { greeting, setupChecklist } from "@/lib/admin-overview";
import { socialLinks, whatsappNumber } from "@/lib/site";
import { adminWarnings } from "@/server/admin-auth";
import { databaseStatus, query } from "@/server/db";
import { orderCounts } from "@/server/orders";
import { getSeaConditions } from "@/server/sea-conditions";
import { ArrowIcon, CheckIcon, WavesIcon } from "../components/icons";
import AdminShell, { Card } from "./AdminShell";
import LiveClock from "./LiveClock";

const ACTIVITY = { fun_dive: "Fun dive", course: "Dive course", snorkeling: "Snorkeling", island_trip: "Island trip", dusk_dive: "Dusk dive" };
const number = (n, digits = 0) => (n == null ? "–" : new Intl.NumberFormat("id-ID", { maximumFractionDigits: digits }).format(n));
const date = (d) => (d ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jayapura" }).format(new Date(d)) : "–");

async function bookingSummary(databaseOk) {
  if (!databaseOk) return null;
  try {
    const [counts] = await query(
      "SELECT COUNT(*) AS total, COALESCE(SUM(status = 'new'), 0) AS fresh, COALESCE(SUM(created_at >= DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-01')), 0) AS month FROM booking_requests",
    );
    const recent = await query("SELECT id, full_name, activity, dive_date, guests, status, created_at FROM booking_requests ORDER BY created_at DESC LIMIT 5");
    return { total: Number(counts.total), fresh: Number(counts.fresh), month: Number(counts.month), recent };
  } catch {
    return null;
  }
}

const rupiah = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

async function orderSummary(databaseOk) {
  if (!databaseOk) return null;
  try {
    return await orderCounts();
  } catch {
    return null;
  }
}

// "Ringkasan cepat": kartu sambutan berjam WIT dan ringkasan berisi data nyata (pesanan dan permintaan
// booking dari MySQL, kondisi laut Open-Meteo, status pengaturan situs). Kerangka di AdminShell.
export default async function AdminDashboard({ admin }) {
  const [sea, database] = await Promise.all([getSeaConditions().catch(() => null), databaseStatus()]);
  const [bookings, orders] = await Promise.all([bookingSummary(database.ok), orderSummary(database.ok)]);
  const socials = socialLinks().length;
  const illustrations = gallery.filter((item) => item.illustration).length;
  const checklist = setupChecklist({
    whatsapp: Boolean(whatsappNumber()),
    socials,
    database: database.ok,
    sessionSecret: adminWarnings().length === 0,
    galleryIllustrations: illustrations,
  });
  const todo = checklist.filter((item) => !item.done);
  const now = new Date();
  const waiting = orders?.pending?.count ?? 0;
  const headline =
    bookings == null
      ? "Database belum terhubung, jadi pesanan dan permintaan booking belum bisa dipantau di sini."
      : waiting > 0
        ? `${number(waiting)} pesanan menunggu pembayaran.`
        : bookings.fresh > 0
          ? `${number(bookings.fresh)} permintaan booking baru menunggu jawaban.`
          : "Tidak ada pesanan atau permintaan booking yang menunggu saat ini.";

  return (
    <AdminShell
      admin={admin}
      active="ringkasan"
      aside={
        <>
          {sea && (
            <div className="hidden gap-2 rounded-card bg-teal-wash p-4 text-sm text-abyss ring-1 ring-teal-soft lg:grid">
              <p className="text-xs font-bold tracking-[0.16em] text-teal">LAUT HARI INI</p>
              <p>
                Gelombang {number(sea.sea.waveM, 1)} m{sea.sea.seaState ? ` (${sea.sea.seaState.toLowerCase()})` : ""}, arus {number(sea.sea.currentKn, 1)} knot, angin{" "}
                {number(sea.weather.windKmh)} km/jam.
              </p>
            </div>
          )}
        </>
      }
    >
      <section className="relative isolate overflow-hidden rounded-frame bg-abyss p-6 text-white sm:p-8">
        <Image src={heroPhoto} alt="" fill sizes="(min-width: 1024px) 1000px, 100vw" className="-z-10 object-cover object-[center_40%] opacity-70" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(10_50_59/0.92)_0%,rgb(10_50_59/0.7)_55%,rgb(10_50_59/0.45)_100%)]" />
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="grid gap-2">
            <p className="text-xs font-bold tracking-[0.16em] text-sunrise">OPERATOR · RUANG KERJA DRAGONET</p>
            <h1 className="text-3xl leading-tight text-white sm:text-4xl">{greeting(now)}, tim Dragonet.</h1>
            <p className="max-w-[48ch] text-white/85">{headline}</p>
          </div>
          <LiveClock initial={now.toISOString()} />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Pesanan lunas">
          <p className="font-display text-4xl font-semibold text-abyss tabular-nums">{orders ? number(orders.paid?.count ?? 0) : "–"}</p>
          <p className="text-sm text-slate">
            {orders ? (
              <>
                {rupiah(orders.paid?.amount ?? 0)} · {number(waiting)} menunggu ·{" "}
                <a href="/admin/pesanan" className="font-semibold text-teal hover:underline">
                  Lihat pesanan
                </a>
              </>
            ) : (
              "Hubungkan database untuk menerima pesanan."
            )}
          </p>
        </Card>
        <Card title="Permintaan booking bulan ini">
          <p className="font-display text-4xl font-semibold text-abyss tabular-nums">{bookings ? number(bookings.month) : "–"}</p>
          <p className="text-sm text-slate">
            {bookings ? `${number(bookings.total)} tercatat sejak awal · ${number(bookings.fresh)} menunggu jawaban` : "Hubungkan database untuk mulai mencatat."}
          </p>
        </Card>
        <Card title="Kondisi laut · Selat Dampier">
          <p className="flex items-baseline gap-2 font-display text-4xl font-semibold text-abyss tabular-nums">
            {number(sea?.sea.waveM, 1)}
            <span className="text-lg">m</span>
            <WavesIcon className="size-6 self-center text-lagoon" />
          </p>
          <p className="text-sm text-slate">
            {sea
              ? `${sea.sea.seaState ?? "Gelombang"} · arus ${number(sea.sea.currentKn, 1)} knot · air ${number(sea.sea.waterC)} °C`
              : "Data Open-Meteo belum tersedia saat ini."}
          </p>
        </Card>
        <Card title="Status situs">
          <p className="font-display text-4xl font-semibold text-abyss">{todo.length === 0 ? "Siap" : "Online"}</p>
          <p className="text-sm text-slate">
            {database.ok ? `Database terhubung (${number(database.latencyMs)} ms)` : database.configured ? "Database tidak bisa dihubungi" : "Database belum diisi"}
            {` · ${socials} akun sosial`}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card title={`Yang perlu dilengkapi · ${checklist.length - todo.length} dari ${checklist.length} beres`}>
          <ul className="mt-1 grid gap-3">
            {checklist.map((item) => (
              <li key={item.id} className="flex gap-3">
                <span
                  className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${item.done ? "bg-success text-white" : "bg-sunrise-wash text-ember ring-1 ring-sunrise"}`}
                  aria-hidden="true"
                >
                  {item.done ? <CheckIcon className="size-4" /> : <span className="text-xs font-bold">!</span>}
                </span>
                <span className="grid gap-0.5">
                  <span className={`font-semibold ${item.done ? "text-slate line-through decoration-slate/40" : "text-abyss"}`}>{item.label}</span>
                  {!item.done && <span className="text-sm text-slate">{item.hint}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="grid content-start gap-4">
          <Card title="Permintaan terbaru">
            {bookings?.recent.length ? (
              <ul className="grid gap-3">
                {bookings.recent.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="grid">
                      <span className="font-semibold text-abyss">{b.full_name}</span>
                      <span className="text-slate">
                        {ACTIVITY[b.activity] ?? b.activity} · {b.guests} orang · {date(b.dive_date)}
                      </span>
                    </span>
                    {b.status === "new" && <span className="rounded-full bg-mandarin-wash px-2 py-0.5 text-xs font-bold text-ember">Baru</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate">Belum ada permintaan yang tercatat. Permintaan dari form booking akan muncul di sini.</p>
            )}
          </Card>
          <Card title="Tautan cepat">
            <ul className="grid gap-2 text-sm font-semibold">
              {[
                ["Lihat beranda", "/"],
                ["Cek kesehatan situs", "/api/health"],
                ["Kondisi laut (JSON)", "/api/conditions"],
              ].map(([label, href]) => (
                <li key={href}>
                  <a href={href} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-teal hover:underline">
                    {label}
                    <ArrowIcon className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
