import AdminGate from "@/admin/AdminGate";
import AdminShell, { DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import { ExportLink, Stats } from "@/admin/parts";
import RecordManager from "@/admin/RecordManager";
import { currentAdmin } from "@/server/admin-auth";
import { databaseStatus } from "@/server/db";
import { listRecords } from "@/server/records";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agen & mitra" };

// /admin/mitra: travel agent, OTA, homestay, liveaboard, transportasi, media, dan pemasok yang bekerja
// sama. Reservasi di kalender bisa ditautkan ke mitra yang membawa tamunya.
export default async function PartnersPage() {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const database = await databaseStatus();
  let data = null;
  if (database.ok) {
    try {
      const [partners, reservations] = await Promise.all([listRecords("partner"), listRecords("reservation")]);
      const guests = {};
      for (const r of reservations.filter((r) => r.partnerId && r.status !== "cancelled" && r.status !== "closed")) guests[r.partnerId] = (guests[r.partnerId] ?? 0) + (r.participants || 1);
      data = { partners: partners.sort((a, b) => a.name.localeCompare(b.name, "id")), guests };
    } catch (error) {
      console.error(`[admin/mitra] ${error.code ?? error.message}`);
    }
  }
  const top = data ? Object.entries(data.guests).sort((a, b) => b[1] - a[1])[0] : null;
  return (
    <AdminShell admin={admin} active="mitra">
      <ModuleTitle title="Agen & mitra">
        Catat travel agent, OTA, homestay, liveaboard, transportasi, media, dan pemasok yang bekerja sama dengan Dragonet, lengkap dengan kontak dan
        kesepakatannya. Pilih mitranya saat mencatat reservasi di kalender supaya tamu dari setiap mitra terhitung.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {data && (
        <>
          <Stats
            items={[
              { label: "Mitra aktif", value: data.partners.filter((p) => p.status === "active").length },
              { label: "Prospek", value: data.partners.filter((p) => p.status === "prospect").length },
              { label: "Tamu dari mitra", value: Object.values(data.guests).reduce((s, n) => s + n, 0) },
              { label: "Mitra teratas", value: top ? (data.partners.find((p) => p.id === top[0])?.name ?? "–") : "–", hint: top ? `${top[1]} tamu` : undefined },
            ]}
          />
          <div className="flex justify-end">
            <ExportLink query={{ type: "mitra" }} />
          </div>
          <RecordManager kind="partner" records={data.partners} empty="Belum ada agen atau mitra." />
        </>
      )}
    </AdminShell>
  );
}
