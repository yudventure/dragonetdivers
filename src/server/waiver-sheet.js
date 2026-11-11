import "server-only";
import { randomBytes } from "node:crypto";
import { site } from "@/lib/site";
import { cleanSheetUrl, sheetColumns, sheetRow, SHEET_NAME } from "@/lib/waiver-sheet";
import { query } from "./db";
import { getSetting, saveSetting } from "./settings";
import { listWaiversByCodes } from "./waivers";

// Formulir selam ke Google Sheets tim (permintaan pemilik 2 November 2026: "buatkan hasil form bisa langsung
// rapih di spreadsheet"). Tim menempel skrip dari /admin/formulir/pengaturan (appsScript di src/lib/waiver-sheet.js) di
// spreadsheetnya, memasangnya sebagai Web app, lalu menyimpan alamatnya. Setiap formulir baru dikirim setelah
// tersimpan; yang gagal dikirim ulang oleh pengecekan berkala (startSheetSync, dimulai instrumentation.js) atau
// tombol Kirim di admin. Yang sudah terkirim dicatat di tabel waiver_sheet_sync (migrasi 010); Apps Script
// menimpa baris dengan ID yang sama, jadi kiriman ulang tidak membuat baris ganda.
// Pengaturan di settings baris "waiver_sheet": { url, token, connectedAt, lastSync, lastError, lastSheet }.

export const DEFAULT_SHEET = { url: "", token: "", connectedAt: "", lastSync: "", lastError: "", lastSheet: "" };
const BATCH = 40; // baris per kiriman (Apps Script menulis per baris, dibatasi 6 menit per panggilan)
const TIMEOUT_MS = 60_000;
const state = (globalThis.__ddWaiverSheet ??= { running: null, again: false, timer: null });

export const getSheetSettings = () => getSetting("waiver_sheet", DEFAULT_SHEET);

/** Pengaturan dengan kode rahasia (dibuat sekali, ikut tertulis di skrip yang ditempel tim). */
export async function ensureSheetToken() {
  const settings = await getSheetSettings();
  if (settings.token) return settings;
  const next = { ...settings, token: randomBytes(18).toString("base64url") };
  await saveSetting("waiver_sheet", next);
  return next;
}

/** Jumlah formulir yang belum terkirim ke spreadsheet. */
export async function pendingCount() {
  const [row] = await query("SELECT COUNT(*) AS n FROM waivers w LEFT JOIN waiver_sheet_sync s ON s.code = w.code WHERE s.code IS NULL");
  return Number(row?.n ?? 0);
}

/** Pesan galat dari Apps Script atau jaringan, dalam Bahasa Indonesia untuk admin. */
function problem(error) {
  const code = error?.reason ?? error?.name ?? "";
  if (code === "token") return "Kode rahasia di skrip tidak cocok. Salin ulang skrip dari halaman ini, tempel di Apps Script, lalu Deploy ulang (Manage deployments, edit, New version).";
  if (code === "html") return "Web app belum bisa dibuka website. Saat Deploy pilih Execute as Me dan Who has access Anyone, lalu salin alamat Web app yang berakhiran /exec.";
  if (code === "TimeoutError" || code === "AbortError") return "Google Sheets tidak menjawab dalam 60 detik. Website akan mencoba lagi nanti.";
  if (code === "status") return `Google Sheets menjawab dengan status ${error.status}. Website akan mencoba lagi nanti.`;
  return `Tidak terkirim (${error?.message ?? "galat tidak dikenal"}). Website akan mencoba lagi nanti.`;
}

/** Kirim baris ke Web app Apps Script; mengembalikan jawaban { ok, added, updated, url }. */
async function post(url, token, rows) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ token, sheet: SHEET_NAME, columns: sheetColumns(), rows }),
    redirect: "follow", // Apps Script menjawab lewat pengalihan ke script.googleusercontent.com
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await response.text();
  if (!response.ok) throw Object.assign(new Error(`status ${response.status}`), { reason: "status", status: response.status });
  let reply;
  try {
    reply = JSON.parse(text);
  } catch {
    throw Object.assign(new Error("jawaban bukan JSON"), { reason: "html" });
  }
  if (!reply?.ok) throw Object.assign(new Error(reply?.error ?? "ditolak"), { reason: reply?.error ?? "rejected" });
  return reply;
}

/** Uji alamat dan kode rahasia: kiriman tanpa baris (Apps Script tetap menyiapkan lembar dan baris judulnya). */
export async function testSheet(url, token) {
  try {
    const reply = await post(url, token, []);
    return { ok: true, sheet: typeof reply.url === "string" ? reply.url : "" };
  } catch (error) {
    return { ok: false, error: problem(error) };
  }
}

/** Simpan alamat Web app (sudah diuji). Spreadsheet lain = semua formulir dikirim lagi ke sana. */
export async function connectSheet(url, sheet) {
  const settings = await ensureSheetToken();
  if (settings.url !== url) await query("DELETE FROM waiver_sheet_sync");
  await saveSetting("waiver_sheet", { ...settings, url, connectedAt: new Date().toISOString(), lastError: "", lastSheet: sheet || settings.lastSheet });
}

export async function disconnectSheet() {
  const settings = await getSheetSettings();
  await saveSetting("waiver_sheet", { ...settings, url: "", lastError: "", lastSheet: "" });
}

/** Tandai semua formulir belum terkirim (tombol Kirim ulang semua). */
export const resetSheetSync = () => query("DELETE FROM waiver_sheet_sync");

async function syncOnce() {
  const settings = await getSheetSettings();
  const url = cleanSheetUrl(settings.url);
  if (!url || !settings.token) return { sent: 0, skipped: true };
  let sent = 0;
  for (;;) {
    const codes = (
      await query(
        `SELECT w.code FROM waivers w LEFT JOIN waiver_sheet_sync s ON s.code = w.code
         WHERE s.code IS NULL ORDER BY w.created_at, w.id LIMIT ${BATCH}`,
      )
    ).map((row) => row.code);
    if (!codes.length) break;
    const waivers = await listWaiversByCodes(codes);
    try {
      const reply = await post(url, settings.token, waivers.map((w) => sheetRow(w, { base: site.url })));
      if (typeof reply.url === "string" && reply.url) settings.lastSheet = reply.url;
    } catch (error) {
      const message = problem(error);
      console.error(`[formulir/sheet] ${error?.reason ?? ""} ${error?.message ?? ""}`.trim());
      await saveSetting("waiver_sheet", { ...(await getSheetSettings()), lastError: message, lastErrorAt: new Date().toISOString() });
      return { sent, error: message };
    }
    await query(`INSERT IGNORE INTO waiver_sheet_sync (code) VALUES ${codes.map(() => "(?)").join(", ")}`, codes);
    sent += codes.length;
  }
  await saveSetting("waiver_sheet", { ...(await getSheetSettings()), lastSync: new Date().toISOString(), lastError: "", lastSheet: settings.lastSheet });
  return { sent };
}

/**
 * Kirim semua formulir yang belum terkirim. Satu pengiriman pada satu waktu; panggilan selama pengiriman
 * berjalan menunggu yang sedang berjalan lalu mengirim sisanya (formulir yang masuk di tengah jalan).
 */
export async function syncWaiverSheet() {
  if (state.running) {
    state.again = true;
    return state.running;
  }
  state.running = (async () => {
    let total = { sent: 0 };
    try {
      do {
        state.again = false;
        const result = await syncOnce();
        total = { ...result, sent: total.sent + result.sent };
        if (result.error || result.skipped) break;
      } while (state.again);
    } finally {
      state.running = null;
    }
    return total;
  })();
  return state.running;
}

export const sheetSyncRunning = () => Boolean(state.running);

/** Pengecekan berkala: formulir yang gagal terkirim dicoba lagi tiap 15 menit. */
export function startSheetSync() {
  if (state.timer) return;
  state.timer = setInterval(() => {
    syncWaiverSheet().catch((error) => console.error(`[formulir/sheet] ${error?.message}`));
  }, 15 * 60_000);
  state.timer.unref?.();
}
