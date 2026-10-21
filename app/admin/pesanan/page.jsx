import AdminGate from "@/admin/AdminGate";
import AdminShell, { DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import OrderList from "@/admin/OrderList";
import { STATUSES } from "@/lib/checkout";
import { currentAdmin } from "@/server/admin-auth";
import { databaseStatus } from "@/server/db";
import { expireOverdue, listOrders, orderCounts } from "@/server/orders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pesanan" };

const FILTERS = [
  ["", "Semua"],
  ["pending", "Menunggu"],
  ["paid", "Lunas"],
  ["expired", "Kedaluwarsa"],
  ["failed", "Gagal"],
  ["cancelled", "Dibatalkan"],
];

// /admin/pesanan: pesanan dari checkout website. Transfer bank ditandai lunas di sini setelah dana
// masuk; Midtrans dan PayPal berubah sendiri lewat notifikasi atau tombol "Cek status".
export default async function OrdersPage({ searchParams }) {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const { status: raw } = await searchParams;
  const status = STATUSES.includes(raw) ? raw : "";
  const database = await databaseStatus();
  let orders = [];
  let counts = {};
  if (database.ok) {
    try {
      await expireOverdue();
      [orders, counts] = await Promise.all([listOrders({ status }), orderCounts()]);
    } catch (error) {
      console.error(`[admin/pesanan] ${error.code ?? error.message}`);
    }
  }
  const total = Object.values(counts).reduce((sum, c) => sum + c.count, 0);
  return (
    <AdminShell admin={admin} active="pesanan">
      <ModuleTitle title="Pesanan">
        Pesanan paket dari website, terbaru di atas. Hubungi tamu lewat WhatsApp atau email untuk memastikan rencana penyelamannya.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {database.ok && (
        <>
          <nav aria-label="Saring status" className="flex flex-wrap gap-2">
            {FILTERS.map(([value, label]) => {
              const count = value ? (counts[value]?.count ?? 0) : total;
              const active = value === status;
              return (
                <a
                  key={label}
                  href={value ? `/admin/pesanan?status=${value}` : "/admin/pesanan"}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-200 ease-brand ${
                    active ? "bg-abyss text-white" : "bg-white text-abyss ring-1 ring-mist hover:text-teal"
                  }`}
                >
                  {label}
                  <span className={`tabular-nums ${active ? "text-white/70" : "text-slate"}`}>{count}</span>
                </a>
              );
            })}
          </nav>
          <OrderList orders={orders} />
        </>
      )}
    </AdminShell>
  );
}
