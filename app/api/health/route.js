import { databaseStatus } from "@/server/db";
import { siteConfigWarnings } from "@/lib/site";
import { mailIssues } from "@/server/mailer";
import pkg from "../../../package.json" with { type: "json" };

export const dynamic = "force-dynamic";

// Cek cepat setelah deploy: buka https://dragonetdiversrajaampat.com/api/health
// Tidak menampilkan host, user, atau password database.
export async function GET() {
  const database = await databaseStatus();
  const mail = mailIssues();
  const warnings = [...siteConfigWarnings(), ...(mail.length ? [`${mail.join(", ")} belum diisi, jadi email ke tamu dan lupa password admin belum aktif.`] : [])];
  return Response.json(
    { app: pkg.name, version: pkg.version, node: process.version, time: new Date().toISOString(), warnings, database },
    { status: database.configured && !database.ok ? 503 : 200, headers: { "Cache-Control": "no-store" } },
  );
}
