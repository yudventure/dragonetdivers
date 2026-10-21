"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUS = {
  pending: ["Menunggu bayar", "bg-sunrise-wash text-ember ring-1 ring-sunrise"],
  paid: ["Lunas", "bg-success text-white"],
  expired: ["Kedaluwarsa", "bg-mist text-slate"],
  failed: ["Gagal", "bg-danger/10 text-danger"],
  cancelled: ["Dibatalkan", "bg-mist text-slate"],
  refunded: ["Dikembalikan", "bg-teal-soft text-teal"],
};
const METHOD = { midtrans: "Midtrans", paypal: "PayPal", transfer: "Transfer bank" };
const CERT = { none: "Belum bersertifikat", open_water: "Open Water", advanced: "Advanced", rescue: "Rescue", pro: "Divemaster+" };
const SERVICE = { "fun-dives": "Fun dive", "dive-courses": "Kursus selam", snorkeling: "Snorkeling", "island-trips": "Trip pulau", "dusk-dives": "Dusk dive" };

const rupiah = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const wit = (iso) =>
  iso ? `${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jayapura" }).format(new Date(iso))} WIT` : "–";
const day = (date) => new Intl.DateTimeFormat("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

/** Tombol tindakan pesanan: tandai transfer lunas, batalkan, atau cek status ke penyedia. */
function Actions({ order }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const run = async (action, question) => {
    if (question && !window.confirm(question)) return;
    setBusy(action);
    setError("");
    const response = await fetch("/api/admin/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: order.code, action }) });
    const result = await response.json().catch(() => ({}));
    setBusy("");
    if (!response.ok) setError(result.error || "Belum berhasil. Coba lagi.");
    else router.refresh();
  };
  const button = "inline-flex h-9 items-center rounded-full px-4 text-sm font-bold transition-colors duration-200 ease-brand disabled:opacity-50";
  const open = order.status === "pending";
  return (
    <div className="grid justify-items-start gap-2 lg:justify-items-end">
      <div className="flex flex-wrap gap-2">
        {open && order.method === "transfer" && (
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => run("paid", `Tandai ${order.code} lunas? Pastikan transfer ${rupiah(order.amount)} sudah masuk ke rekening.`)}
            className={`${button} bg-teal text-white hover:bg-teal-dark`}
          >
            {busy === "paid" ? "Menyimpan…" : "Tandai lunas"}
          </button>
        )}
        {(open || order.status === "expired") && order.method !== "transfer" && (
          <button type="button" disabled={Boolean(busy)} onClick={() => run("refresh")} className={`${button} text-teal ring-1 ring-teal hover:bg-teal-soft`}>
            {busy === "refresh" ? "Mengecek…" : "Cek status"}
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
export default function OrderList({ orders }) {
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
              <p className="font-display text-lg font-semibold text-abyss">
                {order.packageName} <span className="font-sans text-sm font-semibold text-slate">· {SERVICE[order.service] ?? order.service}</span>
              </p>
              <p className="text-sm text-abyss">
                {day(order.date)} · {order.guests} tamu
              </p>
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
              <span className="text-xs text-slate">{order.lang === "id" ? "Pesan dari situs Indonesia" : "Pesan dari situs English"}</span>
            </div>
            <Actions order={order} />
          </li>
        );
      })}
    </ul>
  );
}
