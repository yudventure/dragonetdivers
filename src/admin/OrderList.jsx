"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { localeNamesId } from "@/lib/i18n";

const STATUS = {
  pending: ["Menunggu bayar", "bg-sunrise-wash text-ember ring-1 ring-sunrise"],
  paid: ["Lunas", "bg-success text-white"],
  expired: ["Kedaluwarsa", "bg-mist text-slate"],
  failed: ["Gagal", "bg-danger/10 text-danger"],
  cancelled: ["Dibatalkan", "bg-mist text-slate"],
  refunded: ["Dikembalikan", "bg-teal-soft text-teal"],
};
const METHOD = { midtrans: "Midtrans", paypal: "PayPal", transfer: "Transfer bank", cash: "Tunai di tempat" };
// Ditandai lunas oleh tim: label tombol dan pertanyaan konfirmasinya.
const CONFIRM = {
  transfer: ["Tandai lunas", (o) => `Tandai ${o.code} lunas? Pastikan transfer ${rupiah(o.amount)} sudah masuk ke rekening.`],
  cash: ["Tunai diterima", (o) => `Tandai ${o.code} lunas? Pastikan uang tunai ${rupiah(o.amount)} sudah diterima dari ${o.name}.`],
};
const CERT = { none: "Belum bersertifikat", open_water: "Open Water", advanced: "Advanced", rescue: "Rescue", pro: "Divemaster+" };
const SERVICE = { "fun-dives": "Fun dive", "dive-courses": "Kursus selam", snorkeling: "Snorkeling", "island-trips": "Trip pulau", "dusk-dives": "Dusk dive" };

const rupiah = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const wit = (iso) =>
  iso ? `${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jayapura" }).format(new Date(iso))} WIT` : "–";
const day = (date) => new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

const MAIL = { order: "Pesanan diterima", reminder: "Pengingat bayar", paid: "Pembayaran diterima" };

/** Email yang sudah (atau akan) dikirim ke tamu untuk pesanan ini. */
function MailLine({ log = {} }) {
  const items = Object.keys(MAIL)
    .filter((kind) => log[kind] && log[kind].status !== "skipped")
    .map((kind) => {
      const { status, at, after, error } = log[kind];
      const text =
        status === "sent"
          ? `terkirim ${wit(at)}`
          : status === "scheduled"
            ? `dijadwalkan ${wit(after)}`
            : status === "failed"
              ? "gagal"
              : "sedang dikirim";
      return (
        <span key={kind} title={error || undefined} className={status === "failed" ? "font-semibold text-danger" : undefined}>
          {MAIL[kind]} {text}
        </span>
      );
    });
  if (!items.length) return null;
  return (
    <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate">
      <span className="font-bold text-abyss">Email tamu</span>
      {items}
    </p>
  );
}

/** Tombol tindakan pesanan: tandai transfer atau tunai lunas, batalkan, cek status ke penyedia, atau kirim email. */
function Actions({ order }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const run = async (action, question, kind) => {
    if (question && !window.confirm(question)) return;
    setBusy(action);
    setError("");
    const response = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: order.code, action, kind }),
    });
    const result = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) setError(result.error || "Belum berhasil. Coba lagi.");
    else router.refresh();
  };
  const button = "inline-flex h-9 items-center rounded-full px-4 text-sm font-bold transition-colors duration-200 ease-brand disabled:opacity-50";
  const open = order.status === "pending";
  const manual = CONFIRM[order.method];
  // Tunai tidak punya batas waktu bayar, jadi tanpa email pengingat; yang bisa dikirim ulang email pesanannya.
  const reminder = order.method === "cash" ? "order" : "reminder";
  return (
    <div className="grid justify-items-start gap-2 lg:justify-items-end">
      <div className="flex flex-wrap gap-2">
        {open && manual && (
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => run("paid", manual[1](order))}
            className={`${button} bg-teal text-white hover:bg-teal-dark`}
          >
            {busy === "paid" ? "Menyimpan…" : manual[0]}
          </button>
        )}
        {(open || order.status === "expired") && !manual && (
          <button type="button" disabled={Boolean(busy)} onClick={() => run("refresh")} className={`${button} text-teal ring-1 ring-teal hover:bg-teal-soft`}>
            {busy === "refresh" ? "Mengecek…" : "Cek status"}
          </button>
        )}
        {(open || order.status === "paid") && (
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() =>
              open
                ? run("mail", reminder === "order" ? `Kirim ulang email pesanan ke ${order.email}?` : `Kirim email pengingat bayar ke ${order.email}?`, reminder)
                : run("mail", `Kirim ulang email pembayaran diterima ke ${order.email}?`, "paid")
            }
            className={`${button} text-teal ring-1 ring-mist hover:bg-teal-soft`}
          >
            {busy === "mail" ? "Mengirim…" : open ? (reminder === "order" ? "Kirim ulang email pesanan" : "Email pengingat") : "Kirim ulang email lunas"}
          </button>
        )}
        {open && (
          <button type="button" disabled={Boolean(busy)} onClick={() => run("cancelled", `Batalkan pesanan ${order.code}?`)} className={`${button} text-danger hover:bg-danger/10`}>
            Batalkan
          </button>
        )}
      </div>
      {error && <p className="text-sm font-semibold text-danger">{error}</p>}
    </div>
  );
}

// Daftar pesanan /admin/pesanan: satu kartu per pesanan dengan tamu, paket, tanggal, pembayaran, dan
// tindakan. Catatan tamu dan sertifikasi di bagian yang bisa dibuka.
export default function OrderList({ orders, mails = {} }) {
  if (orders.length === 0) return <p className="rounded-card bg-white p-6 text-slate ring-1 ring-mist">Belum ada pesanan di sini.</p>;
  return (
    <ul className="grid gap-3">
      {orders.map((order) => {
        const [label, tone] = STATUS[order.status] ?? [order.status, "bg-mist text-slate"];
        return (
          <li key={order.code} className="grid gap-4 rounded-card bg-white p-5 ring-1 ring-mist lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,220px)] lg:items-start">
            <div className="grid gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-bold text-abyss">{order.code}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>{label}</span>
                <span className="text-xs text-slate">dibuat {wit(order.createdAt)}</span>
              </div>
              <ul className="grid gap-1">
                {(order.items ?? []).map((item) => (
                  <li key={item.position}>
                    <p className="font-display text-lg leading-snug font-semibold text-abyss">
                      {item.packageName} <span className="font-sans text-sm font-semibold text-slate">· {SERVICE[item.service] ?? item.service}</span>
                    </p>
                    <p className="text-sm text-abyss">
                      {day(item.date)} · {item.guests} tamu{order.items.length > 1 ? ` · ${rupiah(item.amount)}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-slate">
                {order.name} ·{" "}
                <a href={`https://wa.me/${order.whatsapp}`} target="_blank" rel="noopener" className="font-semibold text-teal hover:underline">
                  +{order.whatsapp}
                </a>{" "}
                ·{" "}
                <a href={`mailto:${order.email}`} className="font-semibold text-teal hover:underline">
                  {order.email}
                </a>
              </p>
              {(order.notes || order.certification) && (
                <details className="text-sm text-slate">
                  <summary className="cursor-pointer font-semibold text-abyss">Catatan tamu</summary>
                  {order.certification && <p className="mt-1">Sertifikasi: {CERT[order.certification] ?? order.certification}</p>}
                  {order.notes && <p className="mt-1 whitespace-pre-line">{order.notes}</p>}
                </details>
              )}
              <MailLine log={mails[order.code]} />
            </div>
            <div className="grid gap-0.5 text-sm">
              <span className="font-display text-xl font-semibold text-abyss tabular-nums">{rupiah(order.amount)}</span>
              <span className="text-slate">
                {METHOD[order.method] ?? order.method}
                {order.method === "paypal" && order.amountUsd ? ` · US$${order.amountUsd}` : ""}
                {order.method === "midtrans" && order.paymentType ? ` · ${order.paymentType.replaceAll("_", " ")}` : ""}
              </span>
              {order.status === "pending" && order.dueAt && <span className="text-slate">Batas bayar {wit(order.dueAt)}</span>}
              {order.paidAt && <span className="text-slate">Lunas {wit(order.paidAt)}</span>}
              <span className="text-xs text-slate">{`Pesan dari situs ${localeNamesId[order.lang] ?? "English"}`}</span>
            </div>
            <Actions order={order} />
          </li>
        );
      })}
    </ul>
  );
}
