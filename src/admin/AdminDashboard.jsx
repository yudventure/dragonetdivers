import Image from "next/image";
import heroPhoto from "../assets/ocean-manta-loop.webp";
import { gallery } from "@/content/gallery";
import { greeting, SELF_SERVICE, setupChecklist } from "@/lib/admin-overview";
import { socialLinks, whatsappNumber } from "@/lib/site";
import { witDate } from "@/lib/records";
import { adminWarnings } from "@/server/admin-auth";
import { todaySummary } from "@/server/admin-data";
import { databaseStatus } from "@/server/db";
import { orderCounts } from "@/server/orders";
import { getSeaConditions } from "@/server/sea-conditions";
import { siteGallery } from "@/server/site-gallery";
import { ArrowIcon, CheckIcon, WavesIcon } from "../components/icons";
import AdminShell, { Card } from "./AdminShell";
import LiveClock from "./LiveClock";

const number = (n, digits = 0) => (n == null ? "–" : new Intl.NumberFormat("id-ID", { maximumFractionDigits: digits }).format(n));

async function todayInfo(databaseOk, today) {
  if (!databaseOk) return null;
  try {
    return await todaySummary(today);
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

// "Ringkasan cepat": kartu sambutan berjam WIT dan ringkasan berisi data nyata (pesanan, tamu hari ini dari
// kalender, kondisi laut Open-Meteo, status pengaturan situs). Kerangka di AdminShell.
export default async function AdminDashboard({ admin }) {
  const [sea, database] = await Promise.all([getSeaConditions().catch(() => null), databaseStatus()]);
  const today = witDate();
  const [day, orders, ownGallery] = await Promise.all([todayInfo(database.ok, today), orderSummary(database.ok), database.ok ? siteGallery() : null]);
  const socials = socialLinks().length;
  const illustrations = ownGallery ? 0 : gallery.filter((item) => item.illustration).length;
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
    day == null
      ? "Database belum terhubung, jadi pesanan, kalender, dan modul tim belum bisa dipantau di sini."
      : waiting > 0
        ? `${number(waiting)} pesanan menunggu pembayaran.`
        : day.guests > 0
          ? `${number(day.guests)} tamu dijadwalkan hari ini.`
          : "Tidak ada pesanan yang menunggu dan belum ada tamu dijadwalkan hari ini.";

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
        <Card title="Tamu hari ini">
          <p className="font-display text-4xl font-semibold text-abyss tabular-nums">{day ? number(day.guests) : "–"}</p>
          <p className="text-sm text-slate">
            {day ? (
              <>
                {day.closed ? "Tanggal ini ditutup · " : ""}
                <a href="/admin/kalender" className="font-semibold text-teal hover:underline">
                  Buka kalender reservasi
                </a>
              </>
            ) : (
              "Hubungkan database untuk mulai mencatat."
            )}
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

      <div className="grid items-start gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="grid content-start gap-4">
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
                    {!item.done && item.href && (
                      <a href={item.href} className="inline-flex w-fit items-center gap-1 text-sm font-bold text-teal hover:underline">
                        Atur sekarang
                        <ArrowIcon className="size-4" />
                      </a>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Kelola website sendiri">
            <p className="text-sm text-slate">Semua ini bisa diubah langsung dari admin dan langsung tampil di website, tanpa membuka hPanel.</p>
            <ul className="mt-1 grid gap-1 sm:grid-cols-2">
              {SELF_SERVICE.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="group grid gap-0.5 rounded-input p-2.5 hover:bg-foam">
                    <span className="flex items-center gap-1.5 font-semibold text-abyss group-hover:text-teal">
                      {item.label}
                      <ArrowIcon className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                    </span>
                    <span className="text-sm text-slate">{item.text}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="border-t border-mist pt-3 text-xs text-slate">
              Yang tetap di hPanel hanya kunci rahasia, yaitu database, Midtrans, PayPal, email SMTP, dan password admin awal.
            </p>
          </Card>
        </div>

        <div className="grid content-start gap-4">
          <Card title="Perlu perhatian">
            {day == null ? (
              <p className="text-sm text-slate">Hubungkan database untuk melihat pesanan yang perlu ditindaklanjuti.</p>
            ) : waiting === 0 ? (
              <p className="text-sm text-slate">Tidak ada pesanan yang menunggu pembayaran.</p>
            ) : (
              <a href="/admin/pesanan?status=pending" className="text-sm font-semibold text-teal hover:underline">
                {number(waiting)} pesanan menunggu pembayaran
              </a>
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
