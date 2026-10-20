import { test } from "node:test";
import assert from "node:assert/strict";
import { deploy } from "../scripts/hostinger-deploy.mjs";

const USER = "u865185815";
const DOMAIN = "gold-walrus-261903.hostingersite.com";
const SITE = `/api/hosting/v1/accounts/${USER}/websites/${DOMAIN}`;
const INSTALL = "018f5e2a-1234-7890-abcd-1234567890ab";

// API Hostinger tiruan: rute "METHOD path" → fungsi(body) yang mengembalikan [status, json].
function fakeHostinger(routes) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const { pathname, search, origin } = new URL(url);
    const method = init.method ?? "GET";
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ method, path: pathname + search, body, auth: init.headers?.Authorization });
    if (origin === `https://${DOMAIN}`) {
      return Response.json({ app: "dragonet-divers", version: "0.1.0", warnings: [], database: { configured: false, ok: false } });
    }
    const handler = routes[`${method} ${pathname + search}`] ?? routes[`${method} ${pathname}`];
    if (!handler) return Response.json({ message: "Not found" }, { status: 404 });
    const [status, json] = handler(body);
    return Response.json(json, { status });
  };
  return { calls, fetchImpl };
}

const quiet = { log: () => {}, sleep: async () => {}, pollMs: 0, graceMs: 0 };
const env = { HOSTINGER_API_TOKEN: "tok", GITHUB_REPOSITORY: "yudventure/dragonetdivers" };
const websites = () => [200, { data: [{ domain: DOMAIN, username: USER, website_type: "nodejs", is_enabled: true }] }];
const branchSettings = (branch) => () => [200, { installation_uuid: INSTALL, owner: "yudventure", repository: "dragonetdivers", branch, directory: null, is_enabled: true }];

test("tanpa token, deploy dilewati tanpa memanggil API", async () => {
  const { calls, fetchImpl } = fakeHostinger({});
  const result = await deploy({ env: {}, fetchImpl, ...quiet });
  assert.equal(result.skipped, true);
  assert.equal(calls.length, 0);
});

test("auto-deploy dipindah ke main, build git dimulai, ditunggu sampai selesai, lalu health dicek", async () => {
  let polls = 0;
  const { calls, fetchImpl } = fakeHostinger({
    "GET /api/hosting/v1/websites": websites,
    [`GET ${SITE}/git/auto-deployments/settings`]: branchSettings("claude/laughing-faraday-h5iida"),
    [`PUT ${SITE}/git/auto-deployments/settings`]: (body) => [200, body],
    [`GET ${SITE}/nodejs/builds`]: () => [200, { data: [{ uuid: "old", state: "completed", created_at: "2026-01-01T00:00:00Z" }] }],
    [`GET ${SITE}/nodejs/builds/settings`]: () => [200, { node_version: 22, app_type: "next", root_directory: "./", output_directory: ".next", build_script: "build", entry_file: null, package_manager: "npm" }],
    [`POST ${SITE}/nodejs/builds`]: () => [200, { uuid: "b1", state: "pending" }],
    [`GET ${SITE}/nodejs/builds/b1`]: () => [200, { uuid: "b1", state: ++polls < 3 ? "running" : "completed" }],
  });

  const result = await deploy({ env, fetchImpl, ...quiet });
  assert.deepEqual({ domain: result.domain, build: result.build }, { domain: DOMAIN, build: "b1" });
  assert.ok(calls.filter((c) => c.path.startsWith("/api/hosting")).every((c) => c.auth === "Bearer tok"));

  const put = calls.find((c) => c.method === "PUT");
  assert.deepEqual(put.body, { installation_uuid: INSTALL, owner: "yudventure", repository: "dragonetdivers", branch: "main", is_enabled: true });

  const start = calls.find((c) => c.method === "POST");
  assert.equal(start.body.source_type, "git");
  assert.deepEqual(start.body.source_options, { owner: "yudventure", repository: "dragonetdivers", branch: "main", installation_uuid: INSTALL });
  assert.equal(start.body.node_version, 22);
  assert.equal("entry_file" in start.body, false);
  assert.equal(polls, 3);
  assert.ok(calls.some((c) => c.path === "/api/health"));
});

test("build baru dari webhook Hostinger dipakai, tidak memulai build kedua", async () => {
  const { calls, fetchImpl } = fakeHostinger({
    "GET /api/hosting/v1/websites": websites,
    [`GET ${SITE}/git/auto-deployments/settings`]: branchSettings("main"),
    [`GET ${SITE}/nodejs/builds`]: () => [200, { data: [{ uuid: "hook", state: "running", created_at: new Date().toISOString() }] }],
    [`GET ${SITE}/nodejs/builds/hook`]: () => [200, { uuid: "hook", state: "completed" }],
  });

  const result = await deploy({ env, fetchImpl, ...quiet });
  assert.equal(result.build, "hook");
  assert.equal(calls.some((c) => c.method === "PUT" || c.method === "POST"), false);
});

test("build gagal: error berisi log build tanpa kode warna", async () => {
  const { fetchImpl } = fakeHostinger({
    "GET /api/hosting/v1/websites": websites,
    [`GET ${SITE}/git/auto-deployments/settings`]: branchSettings("main"),
    [`GET ${SITE}/nodejs/builds`]: () => [200, { data: [] }],
    [`POST ${SITE}/nodejs/builds`]: () => [200, { uuid: "b2", state: "pending" }],
    [`GET ${SITE}/nodejs/builds/b2`]: () => [200, { uuid: "b2", state: "failed" }],
    [`GET ${SITE}/nodejs/builds/b2/logs`]: () => [200, { logs: "\u001b[31mType error: ERR_INVALID_URL\u001b[0m", lines: 1 }],
  });

  await assert.rejects(deploy({ env, fetchImpl, ...quiet }), (error) => {
    assert.match(error.message, /Build Hostinger gagal/);
    assert.match(error.message, /Type error: ERR_INVALID_URL/);
    assert.doesNotMatch(error.message, /\u001b/);
    return true;
  });
});

test("domain yang salah memberi pesan jelas", async () => {
  const { fetchImpl } = fakeHostinger({ "GET /api/hosting/v1/websites": () => [200, { data: [] }] });
  await assert.rejects(deploy({ env: { ...env, HOSTINGER_DOMAIN: "salah.com" }, fetchImpl, ...quiet }), /salah\.com" tidak ditemukan/);
});

test("token ditolak: status HTTP dan pesan API ditampilkan", async () => {
  const { fetchImpl } = fakeHostinger({ "GET /api/hosting/v1/websites": () => [401, { message: "Unauthenticated" }] });
  await assert.rejects(deploy({ env, fetchImpl, ...quiet }), /HTTP 401: Unauthenticated/);
});
