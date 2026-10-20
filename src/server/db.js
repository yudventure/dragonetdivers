import "server-only";
import mysql from "mysql2/promise";
import { databaseFailure, databaseIssues, mysqlSettings } from "./db-config.js";
import { runMigrations } from "./migrations.js";

// Satu pool per proses Node.js. Disimpan di globalThis agar hot reload saat
// development tidak membuat pool baru setiap perubahan file.
const state = (globalThis.__dragonetDb ??= { pool: null, migrated: null });

function pool() {
  state.pool ??= mysql.createPool({ ...mysqlSettings(), connectionLimit: 4, waitForConnections: true });
  return state.pool;
}

// Migrasi dijalankan sekali per proses, pada pemakaian database pertama.
function ensureMigrated() {
  state.migrated ??= (async () => {
    const connection = await mysql.createConnection({ ...mysqlSettings(), multipleStatements: true });
    try {
      return await runMigrations(connection);
    } finally {
      await connection.end().catch(() => {});
    }
  })().catch((error) => {
    state.migrated = null; // coba lagi pada permintaan berikutnya
    throw error;
  });
  return state.migrated;
}

// Pakai ini untuk semua kueri aplikasi: `const rows = await query("SELECT ...", [param])`.
export async function query(sql, params = []) {
  if (databaseIssues().length) throw Object.assign(new Error("Database belum dikonfigurasi."), { code: "DATABASE_NOT_CONFIGURED" });
  await ensureMigrated();
  const [rows] = await pool().execute(sql, params);
  return rows;
}

// Status untuk /api/health: tidak pernah menampilkan host, user, atau password.
export async function databaseStatus() {
  const issues = databaseIssues();
  if (issues.length) return { configured: false, ok: false, issues };
  const started = Date.now();
  try {
    const migrations = await ensureMigrated();
    await pool().query("SELECT 1");
    return { configured: true, ok: true, latencyMs: Date.now() - started, migrations: migrations.total };
  } catch (error) {
    return { configured: true, ok: false, ...databaseFailure(error) };
  }
}
