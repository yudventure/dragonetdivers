// Jalankan migrasi MySQL dari terminal: npm run db:migrate
// Membaca kredensial dari environment atau .env.local.
import mysql from "mysql2/promise";
import { databaseFailure, databaseIssues, mysqlSettings } from "../src/server/db-config.js";
import { runMigrations } from "../src/server/migrations.js";

const issues = databaseIssues();
if (issues.length) {
  console.error("Konfigurasi database belum lengkap:");
  for (const issue of issues) console.error(`- ${issue.name}: ${issue.reason}`);
  process.exit(1);
}

let connection;
try {
  connection = await mysql.createConnection({ ...mysqlSettings(), multipleStatements: true });
  const { applied, total } = await runMigrations(connection);
  console.log(applied.length ? `Migrasi baru: ${applied.join(", ")}` : "Tidak ada migrasi baru.");
  console.log(`Total migrasi tercatat: ${total}`);
} catch (error) {
  const { code, hint } = databaseFailure(error);
  console.error(`Gagal (${code}): ${hint}`);
  process.exitCode = 1;
} finally {
  await connection?.end().catch(() => {});
}
