// Deploy otomatis ke Hostinger (Node.js Web App) lewat API resmi Hostinger.
// Dipanggil GitHub Actions setelah kode masuk `main` (lihat .github/workflows/deploy.yml).
//
// Env:
//   HOSTINGER_API_TOKEN  wajib; token API dari hPanel (simpan sebagai secret GitHub)
//   HOSTINGER_DOMAIN     opsional; domain website di Hostinger. Kosong = dicari otomatis
//                        dari website Node.js yang terhubung ke repo ini.
//   DEPLOY_BRANCH        opsional; default "main"
//   GITHUB_REPOSITORY    owner/repo (otomatis di GitHub Actions)
//
// Referensi endpoint: https://github.com/hostinger/api (openapi.json).

import { appendFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const API = "https://developers.hostinger.com";
const TERMINAL = new Set(["completed", "failed"]);
const DEFAULT_BUILD = {
  node_version: 22,
  app_type: "next",
  root_directory: "./",
  output_directory: ".next",
  build_script: "build",
  package_manager: "npm",
};

export class DeployError extends Error {}

const stripAnsi = (text = "") => text.replace(/\u001b\[[0-9;]*[A-Za-z]/g, "");
const list = (body) => (Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : []);

export function createClient({ token, fetchImpl = fetch, base = API }) {
  return async function call(method, path, body) {
    const response = await fetchImpl(`${base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text.slice(0, 300) };
    }
    // GET 404 = belum ada (mis. pengaturan build sebelum build pertama); bukan error.
    if (response.status === 404 && method === "GET") return { status: 404, data };
    if (!response.ok) {
      const detail = data?.errors ? ` ${JSON.stringify(data.errors)}` : "";
      throw new DeployError(`${method} ${path} → HTTP ${response.status}: ${data?.message ?? "tanpa pesan"}${detail}`);
    }
    return { status: response.status, data };
  };
}

const site = (username, domain) => `/api/hosting/v1/accounts/${encodeURIComponent(username)}/websites/${encodeURIComponent(domain)}`;

// Cari website Node.js tujuan: domain eksplisit, atau yang auto-deploy Git-nya menunjuk repo ini.
async function findWebsite(call, { domain, owner, repository, log }) {
  if (domain) {
    const { data } = await call("GET", `/api/hosting/v1/websites?domain=${encodeURIComponent(domain)}`);
    const match = list(data).find((w) => w.username && w.domain?.toLowerCase() === domain.toLowerCase());
    if (!match) throw new DeployError(`Website "${domain}" tidak ditemukan di akun Hostinger pemilik token ini.`);
    return match;
  }
  const { data } = await call("GET", "/api/hosting/v1/websites?website_types=nodejs&per_page=100");
  const websites = list(data).filter((w) => w.domain && w.username);
  for (const w of websites) {
    const { status, data: git } = await call("GET", `${site(w.username, w.domain)}/git/auto-deployments/settings`);
    if (status === 200 && git?.repository?.toLowerCase() === repository.toLowerCase() && git?.owner?.toLowerCase() === owner.toLowerCase()) {
      log(`Website ditemukan lewat repo ${owner}/${repository}: ${w.domain}`);
      return w;
    }
  }
  if (websites.length === 1) {
    log(`Satu-satunya website Node.js: ${websites[0].domain}`);
    return websites[0];
  }
  throw new DeployError(
    `Tidak ada website Node.js yang terhubung ke ${owner}/${repository}. Isi variabel repo HOSTINGER_DOMAIN. Website Node.js yang ada: ${websites.map((w) => w.domain).join(", ") || "(tidak ada)"}`,
  );
}

// Pastikan Hostinger juga men-deploy sendiri setiap push ke branch produksi.
async function ensureAutoDeploy(call, w, { owner, repository, branch, log }) {
  const path = `${site(w.username, w.domain)}/git/auto-deployments/settings`;
  const { data: current } = await call("GET", path);
  let installation = current?.installation_uuid;
  if (!installation) {
    const { data } = await call("GET", "/api/hosting/v1/git/installations?provider=github");
    const installs = list(data).filter((i) => (i.status ?? "active") === "active");
    const mine = installs.find((i) => i.account_login?.toLowerCase() === owner.toLowerCase()) ?? installs[0];
    if (!mine) throw new DeployError("Belum ada koneksi GitHub di Hostinger. Hubungkan GitHub sekali di hPanel (Websites → Node.js Web App → Import Git Repository).");
    installation = mine.uuid;
  }
  const wanted = { installation_uuid: installation, owner, repository, branch, is_enabled: true };
  const same =
    current?.installation_uuid === installation &&
    current?.owner?.toLowerCase() === owner.toLowerCase() &&
    current?.repository?.toLowerCase() === repository.toLowerCase() &&
    current?.branch === branch &&
    current?.is_enabled === true;
  if (same) {
    log(`Auto-deploy Hostinger sudah aktif untuk ${owner}/${repository}@${branch}.`);
  } else {
    await call("PUT", path, wanted);
    log(`Auto-deploy Hostinger diatur ke ${owner}/${repository}@${branch} (sebelumnya: ${current?.branch ?? "belum ada"}, aktif: ${current?.is_enabled ?? "-"}).`);
  }
  return installation;
}

async function buildSettings(call, w) {
  const { status, data } = await call("GET", `${site(w.username, w.domain)}/nodejs/builds/settings`);
  const stored = status === 200 && data ? data : {};
  const pick = (key) => stored[key] ?? DEFAULT_BUILD[key];
  return {
    node_version: pick("node_version"),
    app_type: pick("app_type"),
    root_directory: pick("root_directory"),
    output_directory: pick("output_directory"),
    build_script: pick("build_script"),
    package_manager: pick("package_manager"),
    ...(stored.entry_file ? { entry_file: stored.entry_file } : {}),
  };
}

async function latestBuilds(call, w) {
  const { data } = await call("GET", `${site(w.username, w.domain)}/nodejs/builds?per_page=10`);
  return list(data).sort((a, b) => Date.parse(b.created_at ?? 0) - Date.parse(a.created_at ?? 0));
}

// Build yang baru dipicu webhook Hostinger untuk push yang sama dipakai, agar tidak dobel.
const isFresh = (build, since) => build.state !== "failed" && Date.parse(build.created_at ?? 0) >= since;
const isActive = (build) => build.state === "pending" || build.state === "running";

async function waitForBuild(call, w, uuid, { sleep, log, pollMs, timeoutMs }) {
  const started = Date.now();
  let last = "";
  for (;;) {
    const { data } = await call("GET", `${site(w.username, w.domain)}/nodejs/builds/${encodeURIComponent(uuid)}`);
    if (data?.state !== last) log(`Build ${uuid}: ${data?.state}`);
    last = data?.state;
    if (TERMINAL.has(last)) return last;
    if (Date.now() - started > timeoutMs) throw new DeployError(`Build ${uuid} belum selesai setelah ${Math.round(timeoutMs / 60000)} menit.`);
    await sleep(pollMs);
  }
}

async function failureReport(call, w, uuid) {
  const base = `${site(w.username, w.domain)}/nodejs/builds/${encodeURIComponent(uuid)}`;
  const parts = [];
  try {
    const { data } = await call("GET", `${base}/logs`);
    const lines = stripAnsi(data?.logs).trim().split("\n");
    parts.push(`Log build (80 baris terakhir):\n${lines.slice(-80).join("\n")}`);
  } catch (error) {
    parts.push(`Log build tidak bisa diambil: ${error.message}`);
  }
  try {
    const { status, data } = await call("GET", `${base}/analysis`);
    if (status === 200 && data) parts.push(`Analisis Hostinger:\n${JSON.stringify(data, null, 2).slice(0, 3000)}`);
  } catch {
    // analisis bersifat tambahan
  }
  return parts.join("\n\n");
}

async function checkHealth(domain, { fetchImpl, sleep, log, attempts, delayMs }) {
  const url = `https://${domain}/api/health`;
  let lastError = "";
  for (let i = 1; i <= attempts; i++) {
    try {
      const response = await fetchImpl(url, { headers: { Accept: "application/json" } });
      const body = await response.json().catch(() => null);
      if (body?.app === "dragonet-divers") {
        log(`Health OK (${url}): versi ${body.version}, database ${body.database?.ok ? "terhubung" : "belum terhubung"}${body.warnings?.length ? `, peringatan: ${body.warnings.join(" | ")}` : ""}`);
        return body;
      }
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    if (i < attempts) await sleep(delayMs);
  }
  throw new DeployError(`Build selesai tetapi ${url} belum menjawab dengan benar (${lastError}).`);
}

export async function deploy({
  env = process.env,
  fetchImpl = fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  log = console.log,
  pollMs = 10_000,
  timeoutMs = 20 * 60_000,
  healthAttempts = 12,
  healthDelayMs = 10_000,
  graceMs = 20_000,
  recentMs = 5 * 60_000,
} = {}) {
  const token = env.HOSTINGER_API_TOKEN?.trim();
  if (!token) {
    return { skipped: true, reason: "HOSTINGER_API_TOKEN belum diisi; deploy otomatis dilewati." };
  }
  const [owner, repository] = (env.GITHUB_REPOSITORY || "yudventure/dragonetdivers").split("/");
  const branch = env.DEPLOY_BRANCH?.trim() || "main";
  const call = createClient({ token, fetchImpl, base: env.HOSTINGER_API_BASE || API });

  const w = await findWebsite(call, { domain: env.HOSTINGER_DOMAIN?.trim(), owner, repository, log });
  const installation = await ensureAutoDeploy(call, w, { owner, repository, branch, log });

  // Push ke main biasanya langsung memicu build lewat webhook Hostinger; beri waktu sebentar.
  const since = Date.now() - recentMs;
  let build = (await latestBuilds(call, w)).find((b) => isFresh(b, since));
  if (!build) {
    await sleep(graceMs);
    const builds = await latestBuilds(call, w);
    build = builds.find((b) => isFresh(b, since));
    // Build lama yang masih jalan ditunggu dulu supaya tidak bertabrakan.
    const stale = !build && builds.find(isActive);
    if (stale) {
      log(`Menunggu build lama ${stale.uuid} selesai dulu.`);
      await waitForBuild(call, w, stale.uuid, { sleep, log, pollMs, timeoutMs });
    }
  }
  if (build) {
    log(`Memakai build yang dipicu Hostinger: ${build.uuid} (${build.state})`);
  } else {
    const settings = await buildSettings(call, w);
    const { data } = await call("POST", `${site(w.username, w.domain)}/nodejs/builds`, {
      ...settings,
      source_type: "git",
      source_options: { owner, repository, branch, installation_uuid: installation },
    });
    build = data;
    log(`Build dimulai: ${build.uuid} (Node ${settings.node_version}, ${settings.app_type}, npm run ${settings.build_script})`);
  }

  const state = await waitForBuild(call, w, build.uuid, { sleep, log, pollMs, timeoutMs });
  if (state === "failed") {
    throw new DeployError(`Build Hostinger gagal.\n\n${await failureReport(call, w, build.uuid)}`);
  }
  const health = await checkHealth(w.domain, { fetchImpl, sleep, log, attempts: healthAttempts, delayMs: healthDelayMs });
  return { domain: w.domain, build: build.uuid, health };
}

// Jalankan sebagai CLI: node scripts/hostinger-deploy.mjs
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const summary = process.env.GITHUB_STEP_SUMMARY;
  const write = async (text) => {
    if (summary) await appendFile(summary, `${text}\n`);
  };
  try {
    const result = await deploy();
    if (result.skipped) {
      console.log(`::warning title=Deploy Hostinger dilewati::${result.reason} Lihat HOSTINGER-DEPLOY.md §1.`);
      await write(`### Deploy dilewati\n${result.reason}`);
    } else {
      await write(`### Deploy berhasil\n- Website: https://${result.domain}\n- Build: \`${result.build}\`\n- Versi: ${result.health.version}`);
    }
  } catch (error) {
    console.log(`::error title=Deploy Hostinger gagal::${error.message.split("\n")[0]}`);
    console.error(error.message);
    await write(`### Deploy gagal\n\`\`\`\n${error.message.slice(0, 6000)}\n\`\`\``);
    process.exitCode = 1;
  }
}
