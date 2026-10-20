import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MIGRATIONS_DIR, listMigrations, runMigrations } from "../src/server/migrations.js";

async function dirWith(files) {
  const dir = await mkdtemp(join(tmpdir(), "dd-migrations-"));
  for (const [name, sql] of Object.entries(files)) await writeFile(join(dir, name), sql);
  return dir;
}

// Koneksi palsu yang mencatat kueri; cukup untuk menguji urutan dan pencatatan.
function fakeConnection(alreadyApplied = []) {
  const executed = [];
  return {
    executed,
    async query(sql, params) {
      executed.push(params ? [sql, params] : sql);
      if (sql.startsWith("SELECT GET_LOCK")) return [[{ acquired: 1 }]];
      if (sql === "SELECT name FROM schema_migrations") return [alreadyApplied.map((name) => ({ name }))];
      return [[]];
    },
  };
}

test("migrasi di repo bernama benar dan idempoten", async () => {
  const names = await listMigrations(MIGRATIONS_DIR);
  assert.ok(names.length >= 1);
  for (const name of names) {
    const sql = await readFile(join(MIGRATIONS_DIR, name), "utf8");
    assert.match(sql, /CREATE TABLE IF NOT EXISTS/, `${name} harus aman diimpor ulang`);
    assert.doesNotMatch(sql, /\b(CREATE DATABASE|CREATE USER|DROP TABLE)\b/i, `${name} tidak boleh membuat/menghapus database, user, atau tabel`);
  }
});

test("hanya file NNN_nama.sql yang dibaca, urut, dan nomor ganda ditolak", async () => {
  const dir = await dirWith({ "002_b.sql": "", "001_a.sql": "", "notes.md": "", "3_bad.sql": "" });
  assert.deepEqual(await listMigrations(dir), ["001_a.sql", "002_b.sql"]);
  const dup = await dirWith({ "001_a.sql": "", "001_b.sql": "" });
  await assert.rejects(listMigrations(dup), /ganda/);
});

test("migrasi yang sudah tercatat dilewati, sisanya dijalankan berurutan", async () => {
  const dir = await dirWith({ "001_a.sql": "SQL A", "002_b.sql": "SQL B", "003_c.sql": "SQL C" });
  const connection = fakeConnection(["001_a.sql"]);
  const result = await runMigrations(connection, dir);
  assert.deepEqual(result, { applied: ["002_b.sql", "003_c.sql"], total: 3 });
  const plain = connection.executed.filter((entry) => typeof entry === "string");
  assert.ok(plain.indexOf("SQL B") < plain.indexOf("SQL C"));
  assert.ok(!plain.includes("SQL A"));
  assert.match(String(connection.executed.at(-1)[0]), /RELEASE_LOCK/);
});
