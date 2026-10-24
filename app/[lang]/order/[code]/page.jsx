import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh, CopyButton } from "@/components/checkout/OrderActions";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { ArrowIcon, ChatIcon, CheckIcon, MapPinIcon, Wave } from "@/components/icons";
import { uiText } from "@/content/ui";
import { sameText } from "@/lib/admin-session";
import { isOrderCode, MANUAL_METHODS } from "@/lib/checkout";
import { formatMoney } from "@/lib/currency";
import { format, intlLocale, localeHref } from "@/lib/i18n";
import { serviceBySlug } from "@/lib/services";
import { contact, mapsLink, whatsappLink } from "@/lib/site";
import { refreshOrder } from "@/server/checkout";
import { orderByCode } from "@/server/orders";
import { getPayments } from "@/server/payment-settings";
import { isServiceShown } from "@/server/site-settings";

// Halaman status pesanan tamu: /order/DD-261021-K7Q2M?t=<token> (link dari checkout, kembali dari
// Midtrans/PayPal). Token rahasia di alamat mencegah orang lain membuka pesanan dengan menebak kode.
// Status dicek ke Midtrans/PayPal setiap halaman dibuka; transfer bank menampilkan rekening tujuan.
export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const { lang } = await params;
  return { title: uiText(lang).order.title, robots: { index: false, follow: false } };
}

const TONE = {
  paid: "bg-success text-white",
  pending: "bg-sunrise-wash text-ember ring-1 ring-sunrise",
  transfer: "bg-sunrise-wash text-ember ring-1 ring-sunrise",
  cash: "bg-sunrise-wash text-ember ring-1 ring-sunrise",
};

export default async function OrderPage({ params, searchParams }) {
  const { lang, code } = await params;
  const { t: token } = await searchParams;
  if (!isOrderCode(code) || typeof token !== "string" || !/^[a-f0-9]{32}$/.test(token)) notFound();
  const found = await orderByCode(code).catch((error) => console.error(`[pesanan] ${code}: ${error.code ?? error.message}`));
  if (!found || !sameText(found.token, token)) notFound();
  const order = await refreshOrder(found);
  const all = uiText(lang);
  const t = all.order;
  const money = (amount, currency = "IDR") => formatMoney(amount, currency, lang);
  const wit = (iso) =>
    `${new Intl.DateTimeFormat(intlLocale[lang], { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jayapura" }).format(new Date(iso))} WIT`;
  const day = (date) =>
    new Intl.DateTimeFormat(intlLocale[lang], { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  const transfer = order.method === "transfer" && order.status === "pending";
  // Tunai: tamu membayar di dive center; tim menandai lunas di /admin/pesanan.
  const cash = order.method === "cash" && order.status === "pending";
  const state = transfer ? "transfer" : cash ? "cash" : order.status;
  // Midtrans dan PayPal berubah sendiri; transfer dan tunai menunggu tim.
  const online = order.status === "pending" && !MANUAL_METHODS.includes(order.method);
  const info = t.states[state] ?? t.states.pending;
  const accounts = transfer ? (await getPayments()).accounts : [];
  const service = serviceBySlug(order.service, lang);
  // Pesan lagi: ke paket layanannya, atau ke daftar layanan bila layanan itu sedang disimpan tim.
  const again = (await isServiceShown(order.service)) ? `/services/${order.service}#packages` : "/#services";
  const proof = whatsappLink(format(t.proofMessage, { code: order.code }));
  const path = `/order/${order.code}?t=${order.token}`;

  const details = [
    [t.code, order.code],
    [t.name, order.name],
    [t.method, t.methodNames[order.method] ?? order.method],
    [t.total, money(order.amount)],
    ...(order.method === "paypal" && order.amountUsd ? [[t.charged, formatMoney(Number(order.amountUsd), "USD", lang, { cents: true })]] : []),
    ...(order.status === "pending" && order.dueAt ? [[t.due, wit(order.dueAt)]] : []),
  ];

  return (
    <>
      <SiteHeader lang={lang} path={path} />
      <main className="bg-foam">
        {online && <AutoRefresh />}
        <div className="gutter mx-auto grid max-w-[880px] gap-6 py-10 md:py-16">
          <section className="grid gap-4 rounded-frame bg-white p-6 shadow-float ring-1 ring-mist sm:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`grid size-10 place-items-center rounded-full ${TONE[state] ?? "bg-mist text-abyss"}`} aria-hidden="true">
                {order.status === "paid" ? <CheckIcon className="size-5" /> : <span className="font-display text-lg font-semibold">!</span>}
              </span>
              <p className="eyebrow">{t.title}</p>
            </div>
            <h1 className="text-[2rem] leading-[1.1] text-abyss sm:text-[2.5rem]">{info.title}</h1>
            <Wave />
            <p className="max-w-[60ch] text-slate">{format(info.text, { amount: money(order.amount), due: order.dueAt ? wit(order.dueAt) : "", code: order.code })}</p>

            <dl className="mt-2 grid gap-x-8 gap-y-3 rounded-card bg-foam p-5 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label} className="grid gap-0.5">
                  <dt className="text-xs font-bold tracking-[0.12em] text-slate uppercase">{label}</dt>
                  <dd className="font-semibold text-abyss tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="grid gap-2">
              <p className="text-xs font-bold tracking-[0.12em] text-slate uppercase">{order.items.length > 1 ? t.packages : t.package}</p>
              <ul className="grid divide-y divide-mist rounded-card ring-1 ring-mist">
                {order.items.map((item) => (
                  <li key={item.position} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 p-4">
                    <span className="grid gap-0.5">
                      <span className="font-semibold text-abyss">{item.packageName}</span>
                      <span className="text-sm text-slate">
                        {[serviceBySlug(item.service, lang)?.title, day(item.date), `${t.guests} ${item.guests}`].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="font-semibold text-abyss tabular-nums">{money(item.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {accounts.length > 0 && (
              <ul className="grid gap-3">
                {accounts.map((account) => (
                  <li key={account.number} className="flex flex-wrap items-center justify-between gap-3 rounded-card p-4 ring-1 ring-mist">
                    <div className="grid gap-0.5">
                      <span className="text-xs font-bold tracking-[0.12em] text-slate uppercase">{account.bank}</span>
                      <span className="font-display text-xl font-semibold text-abyss tabular-nums">{account.number}</span>
                      <span className="text-sm text-slate">
                        {t.accountHolder}: {account.holder}
                      </span>
                    </div>
                    <CopyButton value={account.number} label={t.copy} done={t.copied} />
                  </li>
                ))}
              </ul>
            )}

            {cash && (
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-card p-4 ring-1 ring-mist">
                <div className="flex gap-3">
                  <MapPinIcon className="mt-0.5 size-5 shrink-0 text-teal" />
                  <div className="grid gap-0.5">
                    <span className="text-xs font-bold tracking-[0.12em] text-slate uppercase">{t.findUs}</span>
                    {contact.address.map((line) => (
                      <span key={line} className="text-abyss">
                        {line}
                      </span>
                    ))}
                  </div>
                </div>
                <a href={mapsLink()} target="_blank" rel="noopener" className="h-8 rounded-full px-3 text-xs leading-8 font-bold text-teal ring-1 ring-teal hover:bg-teal-soft">
                  Google Maps ↗
                </a>
              </div>
            )}

            <div className="mt-2 flex flex-wrap gap-3">
              {online && order.redirectUrl && (
                <a
                  href={order.redirectUrl}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-teal px-6 font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark"
                >
                  {t.continue}
                  <ArrowIcon className="size-[18px]" />
                </a>
              )}
              {transfer && (
                <a
                  href={proof ?? `mailto:${contact.email}?subject=${encodeURIComponent(order.code)}`}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-teal px-6 font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark"
                >
                  <ChatIcon className="size-[18px]" />
                  {t.sendProof}
                </a>
              )}
              {order.status === "pending" && (
                <a
                  href={localeHref(lang, path)}
                  className="inline-flex h-12 items-center rounded-full border-[1.5px] border-teal px-6 font-bold text-teal transition-colors duration-200 ease-brand hover:bg-teal-soft"
                >
                  {t.refresh}
                </a>
              )}
              {["expired", "failed", "cancelled"].includes(order.status) && (
                <Link
                  href={localeHref(lang, again)}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-teal px-6 font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark"
                >
                  {t.again}
                  {service && <span className="font-semibold text-white/80">· {service.title}</span>}
                </Link>
              )}
            </div>
          </section>
          <p className="text-center text-sm text-slate">
            {format(t.questions, { email: contact.email })}
          </p>
        </div>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
