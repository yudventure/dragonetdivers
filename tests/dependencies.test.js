import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Versi yang dikunci persis (mis. "10.0.10") tidak bisa diperbarui npm audit fix, jadi celah keamanan
// menumpuk (kejadian nodemailer, Oktober 2026). Semua dependensi memakai rentang ^ atau ~;
// .github/workflows/security.yml memperbaikinya setiap hari di dalam rentang itu.
test("dependensi memakai rentang versi supaya perbaikan keamanan bisa masuk otomatis", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const all = { ...pkg.dependencies, ...pkg.devDependencies };
  const pinned = Object.entries(all).filter(([, version]) => !/^[\^~]/.test(version));
  assert.deepEqual(pinned, [], `Pakai ^ untuk: ${pinned.map(([name]) => name).join(", ")}`);
});

test("lockfile sama dengan package.json", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
  assert.deepEqual(lock.packages[""].dependencies, pkg.dependencies);
});
