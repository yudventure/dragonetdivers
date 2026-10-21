import Image from "next/image";
import logo from "../../brand/logo/dragonet-divers-logo.png";
import {
  BanknoteIcon,
  BoxIcon,
  CalendarIcon,
  GlobeIcon,
  GridIcon,
  LifeBuoyIcon,
  ReceiptIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
} from "../components/icons";
import LogoutButton from "./LogoutButton";

// Menu mengikuti dashboard Zanclus: modul utama di atas, lalu kelompok Situs web, PR & mitra, HRD,
// Keuangan, dan Gudang dengan halaman-halamannya.
const MENU = [
  { key: "ringkasan", label: "Ringkasan cepat", icon: GridIcon, href: "/admin" },
  { key: "kalender", label: "Kalender reservasi", icon: CalendarIcon, href: "/admin/kalender" },
  { key: "tamu", label: "Tamu", icon: UserIcon, href: "/admin/tamu" },
  { key: "pesanan", label: "Pesanan", icon: ReceiptIcon, href: "/admin/pesanan" },
  {
    group: "Situs web",
    icon: GlobeIcon,
    items: [
      { key: "paket", label: "Paket & harga", icon: TagIcon, href: "/admin/paket" },
      { key: "situs", label: "Galeri foto & video", icon: GlobeIcon, href: "/admin/situs" },
    ],
  },
  {
    group: "PR & mitra",
    icon: LifeBuoyIcon,
    items: [
      { key: "konten", label: "Kalender konten", icon: CalendarIcon, href: "/admin/konten" },
      { key: "mitra", label: "Agen & mitra", icon: LifeBuoyIcon, href: "/admin/mitra" },
    ],
  },
  {
    group: "HRD",
    icon: UsersIcon,
    items: [
      { key: "pegawai", label: "Pegawai", icon: UsersIcon, href: "/admin/pegawai" },
      { key: "absensi", label: "Absensi", icon: CalendarIcon, href: "/admin/absensi" },
      { key: "gaji", label: "Slip gaji", icon: ReceiptIcon, href: "/admin/gaji" },
    ],
  },
  {
    group: "Keuangan",
    icon: WalletIcon,
    items: [
      { key: "pembayaran", label: "Pembayaran online", icon: BanknoteIcon, href: "/admin/pembayaran" },
      { key: "kas", label: "Buku kas", icon: WalletIcon, href: "/admin/kas" },
      { key: "laporan", label: "Laba rugi & pajak", icon: ReceiptIcon, href: "/admin/laporan" },
    ],
  },
  {
    group: "Gudang",
    icon: BoxIcon,
    items: [
      { key: "stok", label: "Barang & stok", icon: BoxIcon, href: "/admin/stok" },
      { key: "mutasi", label: "Keluar masuk", icon: TagIcon, href: "/admin/mutasi" },
    ],
  },
];

function MenuLink({ item, active, nested = false }) {
  const { key, label, icon: Icon, href } = item;
  const current = key === active;
  return (
    <a
      href={href}
      aria-current={current ? "page" : undefined}
      className={`flex items-center gap-3 rounded-input font-semibold whitespace-nowrap transition-colors duration-200 ease-brand ${nested ? "h-10 px-4 text-[15px] lg:pl-11" : "h-11 px-4"} ${
        current ? "bg-abyss text-white shadow-float" : "text-abyss hover:bg-white hover:text-teal"
      }`}
    >
      <Icon className={`size-5 ${nested ? "lg:hidden" : ""}`} />
      {label}
    </a>
  );
}

/** Kartu putih bertajuk untuk isi modul. */
export function Card({ title, children, className = "", action }) {
  return (
    <section className={`grid content-start gap-2 rounded-card bg-white p-5 shadow-[0_1px_2px_rgb(10_50_59/0.05)] ring-1 ring-mist ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-sans text-sm font-semibold text-slate">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Judul modul dengan keterangan singkat. */
export function ModuleTitle({ title, children }) {
  return (
    <div className="grid gap-1">
      <h1 className="text-3xl leading-tight text-abyss">{title}</h1>
      {children && <p className="max-w-[70ch] text-slate">{children}</p>}
    </div>
  );
}

/** Peringatan database untuk modul yang membutuhkan MySQL. */
export function DatabaseNotice({ database }) {
  if (database.ok) return null;
  const issues = database.issues ?? [];
  return (
    <div className="grid gap-1.5 rounded-card bg-sunrise-wash p-4 text-sm text-abyss ring-1 ring-sunrise">
      <p className="font-bold">{database.configured ? "Database tidak bisa dihubungi." : "Pengaturan database belum terbaca aplikasi."}</p>
      {database.configured ? (
        <p>
          {database.hint} <span className="text-slate">Kode {database.code}.</span>
        </p>
      ) : (
        <>
          {/* Nama variabel dan alasannya saja, nilainya tidak pernah ditampilkan. */}
          <ul className="grid gap-1">
            {issues.map((issue) => (
              <li key={issue.name}>
                <code className="font-bold text-ember">{issue.name}</code> {issue.reason}
              </li>
            ))}
          </ul>
          <p className="text-slate">
            Perubahan di hPanel (Variabel environment) baru terbaca setelah deploy ulang di menu Penempatan. Panduan lengkap di HOSTINGER-DEPLOY.md.
          </p>
        </>
      )}
    </div>
  );
}

// Kerangka dashboard operator: kepala halaman, menu samping, dan isi modul. aside = isi tambahan di
// bawah menu (mis. ringkasan laut di "Ringkasan cepat").
export default function AdminShell({ admin, active, aside, children }) {
  const initials = admin.email.slice(0, 2).toUpperCase();
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
            {MENU.map((entry) =>
              entry.group ? (
                <li key={entry.group} className="contents lg:grid lg:gap-1 lg:pt-3">
                  <p className="hidden items-center gap-3 px-4 text-xs font-bold tracking-[0.12em] text-slate uppercase lg:flex">
                    <entry.icon className="size-4" />
                    {entry.group}
                  </p>
                  <ul className="contents lg:grid lg:gap-0.5">
                    {entry.items.map((item) => (
                      <li key={item.key} className="shrink-0">
                        <MenuLink item={item} active={active} nested />
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={entry.key} className="shrink-0">
                  <MenuLink item={entry} active={active} />
                </li>
              ),
            )}
          </ul>
          {aside}
        </nav>

        <main className="grid min-w-0 content-start gap-6">{children}</main>
      </div>
    </div>
  );
}
