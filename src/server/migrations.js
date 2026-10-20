// Migrasi skema MySQL berbasis file SQL di database/migrations.
// Tanpa "server-only" agar bisa dipanggil dari skrip CLI (scripts/db-migrate.mjs).
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export const MIGRATIONS_DIR = join(process.cwd(), "database", "migrations");
const FILE_PATTERN = /^\d{3}_[a-z0-9_]+\.sql$/;
const LOCK_NAME = "dragonet_migrations";

export async function listMigrations(dir = MIGRATIONS_DIR) {
  const names = (await readdir(dir)).filter((name) => FILE_PATTERN.test(name)).sort();
  const seen = new Set();
  for (const name of names) {
    const number = name.slice(0, 3);
    if (seen.has(number)) throw new Error(`Nomor migrasi ganda: ${number}`);
    seen.add(number);
  }
  return names;
}

// Jalankan migrasi yang belum tercatat. `connection` harus dibuat dengan
// multipleStatements: true karena satu file boleh berisi beberapa perintah.
export async function runMigrations(connection, dir = MIGRATIONS_DIR) {
  await connection.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       name VARCHAR(191) NOT NULL PRIMARY KEY,
       applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  );
  // Kunci agar dua proses (mis. dua instance aplikasi) tidak menjalankan migrasi bersamaan.
  const [[lock]] = await connection.query("SELECT GET_LOCK(?, 15) AS acquired", [LOCK_NAME]);
  if (lock.acquired !== 1) throw Object.assign(new Error("Migrasi sedang dijalankan proses lain."), { code: "MIGRATION_LOCKED" });
  try {
    const [rows] = await connection.query("SELECT name FROM schema_migrations");
    const done = new Set(rows.map((row) => row.name));
    const applied = [];
    for (const name of await listMigrations(dir)) {
      if (done.has(name)) continue;
      const sql = await readFile(join(dir, name), "utf8");
      await connection.query(sql);
      await connection.query("INSERT INTO schema_migrations (name) VALUES (?)", [name]);
      applied.push(name);
    }
    return { applied, total: done.size + applied.length };
  } finally {
    await connection.query("SELECT RELEASE_LOCK(?)", [LOCK_NAME]);
  }
}
