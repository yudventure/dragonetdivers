import AdminGate from "@/admin/AdminGate";
import AdminShell, { DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import GuestTable from "@/admin/GuestTable";
import { ExportLink, Stats } from "@/admin/parts";
import { rupiah } from "@/lib/records";
import { currentAdmin } from "@/server/admin-auth";
import { guestList } from "@/server/admin-data";
import { databaseStatus } from "@/server/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tamu" };

// /admin/tamu: daftar tamu dari pesanan website dan reservasi tim (seperti Zanclus, tanpa tabel tamu
// terpisah), dikelompokkan per nomor WhatsApp atau email.
export default async function GuestsPage() {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const database = await databaseStatus();
  const guests = database.ok ? await guestList().catch((error) => console.error(`[admin/tamu] ${error.code ?? error.message}`)) : null;
  return (
    <AdminShell admin={admin} active="tamu">
      <ModuleTitle title="Tamu">
        Semua tamu dari pesanan website dan reservasi yang dicatat di kalender, digabung per nomor WhatsApp atau email. Pakai untuk menghubungi tamu
        lama dan menyiapkan tamu yang akan datang.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {guests && (
        <>
          <Stats
            items={[
              { label: "Jumlah tamu", value: guests.length },
              { label: "Tamu yang kembali", value: guests.filter((g) => g.bookings > 1).length, hint: "Lebih dari satu reservasi" },
              { label: "Akan datang", value: guests.filter((g) => g.next).length },
              { label: "Nilai lunas", value: rupiah(guests.reduce((s, g) => s + g.paid, 0)) },
            ]}
          />
          <div className="flex justify-end">
            <ExportLink query={{ type: "tamu" }} />
          </div>
          <GuestTable guests={guests} />
        </>
      )}
    </AdminShell>
  );
}
