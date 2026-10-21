import Image from "next/image";
import logo from "../../brand/logo/dragonet-divers-logo.png";
import heroPhoto from "../assets/ocean-manta-loop.webp";
import { gallery } from "@/content/gallery";
import { greeting, setupChecklist } from "@/lib/admin-overview";
import { socialLinks, whatsappNumber } from "@/lib/site";
import { adminWarnings } from "@/server/admin-auth";
import { databaseStatus, query } from "@/server/db";
import { getSeaConditions } from "@/server/sea-conditions";
import {
  ArrowIcon,
  BoxIcon,
  CalendarIcon,
  CheckIcon,
  GlobeIcon,
  GridIcon,
  LifeBuoyIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
  WavesIcon,
} from "../components/icons";
import LiveClock from "./LiveClock";
import LogoutButton from "./LogoutButton";

// Menu mengikuti dashboard Zanclus. Baru "Ringkasan cepat" yang aktif; modul lain dibangun bertahap
// sesuai prioritas pemilik dan ditandai "Segera".
const MENU = [
  { label: "Ringkasan cepat", icon: GridIcon, active: true },
  { label: "Kalender reservasi", icon: CalendarIcon },
  { label: "Tamu", icon: UserIcon },
  { label: "Situs web", icon: GlobeIcon },
  { label: "PR & mitra", icon: LifeBuoyIcon },
  { label: "HRD", icon: UsersIcon },
  { label: "Keuangan", icon: WalletIcon },
  { label: "Gudang", icon: BoxIcon },
];

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

function Card({ title, children, className = "" }) {
  return (
    <section className={`grid content-start gap-2 rounded-card bg-white p-5 shadow-[0_1px_2px_rgb(10_50_59/0.05)] ring-1 ring-mist ${className}`}>
      <h2 className="font-sans text-sm font-semibold text-slate">{title}</h2>
      {children}
    </section>
  );
}

// Dashboard operator: kepala halaman, menu samping, kartu sambutan berjam WIT, dan ringkasan cepat
// berisi data nyata (permintaan booking dari MySQL, kondisi laut Open-Meteo, status pengaturan situs).
export default async function AdminDashboard({ admin }) {
  const [sea, database] = await Promise.all([getSeaConditions().catch(() => null), databaseStatus()]);
  const bookings = await bookingSummary(database.ok);
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
  const initials = admin.email.slice(0, 2).toUpperCase();
  const headline =
    bookings == null
      ? "Database belum terhubung, jadi permintaan booking belum bisa dipantau di sini."
      : bookings.fresh > 0
        ? `${number(bookings.fresh)} permintaan booking baru menunggu jawaban.`
        : "Tidak ada permintaan booking yang menunggu jawaban saat ini.";

  return (
    <div className="min-h-dvh bg-foam">
      <header className="sticky top-0 z-20 bg-white/95 shadow-[0_1px_0_rgb(10_50_59/0.06),0_6px_20px_rgb(10_50_59/0.04)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:h-[72px] sm:px-8">
          <a href="/admin" className="flex items-center gap-3">
            <Image src={logo} alt="" width={40} height={40} className="size-10" />
            <span className="hidden font-display text-lg font-semibold text-teal sm:inline">Dragonet Divers</span>
          </a>
          <span className="ml-1 border-l border-mist pl-4 text-xs font-bold tracking-[0.18em] text-teal">ADMIN</span>
          <div className="ml-auto flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noopener"
              className="hidden h-10 items-center gap-2 rounded-full border border-mist px-4 text-sm font-semibold text-abyss transition-colors duration-200 ease-brand hover:border-teal hover:text-teal sm:inline-flex"
            >
              Kembali ke situs ↗
            </a>
            <span className="flex items-center gap-2 rounded-full border border-mist py-1 pr-3 pl-1" title={admin.email}>
              <span className="grid size-8 place-items-center rounded-full bg-abyss text-xs font-bold text-white">{initials}</span>
              <span className="hidden max-w-[14rem] truncate text-sm font-semibold text-abyss md:inline">{admin.email}</span>
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[280px_1fr] lg:gap-10 lg:py-10">
        <nav aria-label="Menu admin" className="grid content-start gap-4 lg:sticky lg:top-28">
          <p className="hidden text-xs font-bold tracking-[0.16em] text-teal lg:block">MENU</p>
          <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:gap-1 lg:overflow-visible lg:px-0">
            {MENU.map(({ label, icon: Icon, active }) => (
              <li key={label} className="shrink-0">
                {active ? (
                  <a
                    href="/admin"
                    aria-current="page"
                    className="flex h-11 items-center gap-3 rounded-input bg-abyss px-4 font-semibold whitespace-nowrap text-white shadow-float"
                  >
                    <Icon className="size-5" />
                    {label}
                  </a>
                ) : (
                  <span aria-disabled="true" className="flex h-11 items-center gap-3 rounded-input px-4 whitespace-nowrap text-slate/70" title="Segera">
                    <Icon className="size-5" />
                    {label}
                    <span className="ml-auto rounded-full bg-teal-wash px-2 py-0.5 text-[10px] font-bold tracking-wide text-teal uppercase">Segera</span>
                  </span>
                )}
              </li>
            ))}
          </ul>
          {sea && (
            <div className="hidden gap-2 rounded-card bg-teal-wash p-4 text-sm text-abyss ring-1 ring-teal-soft lg:grid">
              <p className="text-xs font-bold tracking-[0.16em] text-teal">LAUT HARI INI</p>
              <p>
                Gelombang {number(sea.sea.waveM, 1)} m{sea.sea.seaState ? ` (${sea.sea.seaState.toLowerCase()})` : ""}, arus {number(sea.sea.currentKn, 1)} knot, angin{" "}
                {number(sea.weather.windKmh)} km/jam.
              </p>
            </div>
          )}
        </nav>

        <main className="grid content-start gap-6">
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

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        </main>
      </div>
    </div>
  );
}
