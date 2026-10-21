import AdminGate from "@/admin/AdminGate";
import AdminShell, { DatabaseNotice, ModuleTitle } from "@/admin/AdminShell";
import PaymentSettings from "@/admin/PaymentSettings";
import { site } from "@/lib/site";
import { currentAdmin } from "@/server/admin-auth";
import { databaseStatus } from "@/server/db";
import { getUsdIdrRate } from "@/server/exchange-rate";
import { lastMidtransError, midtransConfigured, midtransIssues, midtransKeyEnding, midtransProduction } from "@/server/midtrans";
import { getPayments, methodStatus } from "@/server/payment-settings";
import { lastPaypalError, paypalConfigured, paypalKeyEnding, paypalLive } from "@/server/paypal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pembayaran" };

// /admin/pembayaran: cara bayar yang ditawarkan di checkout, rekening transfer, batas waktu bayar, dan
// status key Midtrans/PayPal dari hPanel (key-nya sendiri tidak pernah ditampilkan).
export default async function PaymentsPage() {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const database = await databaseStatus();
  const [settings, rate] = await Promise.all([database.ok ? getPayments().catch(() => null) : null, getUsdIdrRate()]);
  const providers = {
    midtrans: {
      configured: midtransConfigured(),
      production: midtransProduction(),
      ending: midtransKeyEnding(),
      issues: midtransIssues(),
      lastError: lastMidtransError(),
      notifyUrl: `${site.url}/api/payments/midtrans`,
    },
    paypal: { configured: paypalConfigured(), live: paypalLive(), ending: paypalKeyEnding(), lastError: lastPaypalError() },
  };
  return (
    <AdminShell admin={admin} active="pembayaran">
      <ModuleTitle title="Pembayaran">
        Pilih cara bayar yang ditawarkan di checkout. Key Midtrans dan PayPal diisi di hPanel (Environment variables), bukan di sini, supaya tidak
        pernah tersimpan di database atau terlihat di dashboard.
      </ModuleTitle>
      <DatabaseNotice database={database} />
      {settings && <PaymentSettings initial={settings} status={methodStatus(settings, rate)} providers={providers} rate={rate} />}
    </AdminShell>
  );
}
