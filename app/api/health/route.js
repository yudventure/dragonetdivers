import { databaseStatus } from "@/server/db";
import { siteConfigWarnings } from "@/lib/site";
import pkg from "../../../package.json" with { type: "json" };

export const dynamic = "force-dynamic";

// Cek cepat setelah deploy: buka https://dragonetdiversrajaampat.com/api/health
// Tidak menampilkan host, user, atau password database.
export async function GET() {
  const database = await databaseStatus();
  return Response.json(
    { app: pkg.name, version: pkg.version, node: process.version, time: new Date().toISOString(), warnings: siteConfigWarnings(), database },
    { status: database.configured && !database.ok ? 503 : 200, headers: { "Cache-Control": "no-store" } },
  );
}
