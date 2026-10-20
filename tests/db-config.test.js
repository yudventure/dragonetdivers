import { test } from "node:test";
import assert from "node:assert/strict";
import { databaseFailure, databaseIssues, mysqlSettings } from "../src/server/db-config.js";

const full = { MYSQL_HOST: "srv1.hstgr.io", MYSQL_DATABASE: "u1_dragonet", MYSQL_USER: "u1_admin", MYSQL_PASSWORD: " p@ss #1 " };

test("konfigurasi lengkap tidak punya masalah", () => {
  assert.deepEqual(databaseIssues(full), []);
});

test("variabel kosong dilaporkan tanpa nilainya", () => {
  const names = databaseIssues({ MYSQL_HOST: " " }).map((issue) => issue.name);
  assert.deepEqual(names, ["MYSQL_HOST", "MYSQL_DATABASE", "MYSQL_USER", "MYSQL_PASSWORD"]);
});

test("hostname berbentuk URL dan port tidak valid ditolak", () => {
  const names = databaseIssues({ ...full, MYSQL_HOST: "https://srv1.hstgr.io", MYSQL_PORT: "abc" }).map((issue) => issue.name);
  assert.deepEqual(names, ["MYSQL_HOST", "MYSQL_PORT"]);
});

test("teks contoh di hPanel (berisi spasi) ditolak sebelum mencoba koneksi", () => {
  const names = databaseIssues({ ...full, MYSQL_HOST: "masih uji coba", MYSQL_PORT: "masih uji coba" }).map((issue) => issue.name);
  assert.deepEqual(names, ["MYSQL_HOST", "MYSQL_PORT"]);
});

test("localhost dipetakan ke IPv4, password tidak dipangkas", () => {
  const settings = mysqlSettings({ ...full, MYSQL_HOST: "LocalHost" });
  assert.equal(settings.host, "127.0.0.1");
  assert.equal(settings.port, 3306);
  assert.equal(settings.password, " p@ss #1 ");
});

test("socket menggantikan TCP dan TLS hanya aktif bila diminta", () => {
  const settings = mysqlSettings({ ...full, MYSQL_HOST: "localhost", MYSQL_SOCKET: "/tmp/mysql.sock" });
  assert.equal(settings.host, "localhost");
  assert.equal(settings.socketPath, "/tmp/mysql.sock");
  assert.equal(settings.ssl, undefined);
  assert.deepEqual(mysqlSettings({ ...full, MYSQL_SSL: "true" }).ssl, { rejectUnauthorized: true });
});

test("error database diringkas tanpa pesan mentah", () => {
  const known = databaseFailure({ code: "ER_ACCESS_DENIED_ERROR", message: "Access denied for user 'u1'@'1.2.3.4'" });
  assert.equal(known.code, "ER_ACCESS_DENIED_ERROR");
  assert.ok(!known.hint.includes("1.2.3.4"));
  assert.equal(databaseFailure(new Error("x")).code, "DATABASE_UNAVAILABLE");
});
