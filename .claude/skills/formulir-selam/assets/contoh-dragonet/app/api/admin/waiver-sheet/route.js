import { cleanSheetUrl } from "@/lib/waiver-sheet";
import { currentAdmin, guardAdmin, readJson } from "@/server/admin-auth";
import { later } from "@/server/order-mail";
import {
  connectSheet,
  disconnectSheet,
  ensureSheetToken,
  getSheetSettings,
  pendingCount,
  resetSheetSync,
  sheetSyncRunning,
  syncWaiverSheet,
  testSheet,
} from "@/server/waiver-sheet";

export const dynamic = "force-dynamic";

// Google Sheets untuk formulir selam (/admin/formulir, src/admin/WaiverSheetPanel.jsx; server di
// src/server/waiver-sheet.js). GET = keadaan pengiriman. POST { action }:
// - connect { url }: alamat Web app Apps Script diuji dulu (lembar dan baris judul disiapkan), lalu disimpan
//   dan semua formulir yang belum ada di spreadsheet itu dikirim di belakang layar.
// - sync: kirim formulir yang belum terkirim. resend: kirim ulang semua (baris yang sama ditimpa).
// - disconnect: berhenti mengirim.
const noStore = { "Cache-Control": "no-store" };
const unavailable = () => Response.json({ error: "Database belum bisa diakses. Coba lagi sebentar." }, { status: 503, headers: noStore });

async function status() {
  const settings = await getSheetSettings();
  return {
    connected: Boolean(settings.url),
    url: settings.url,
    pending: await pendingCount(),
    running: sheetSyncRunning(),
    lastSync: settings.lastSync,
    lastError: settings.lastError,
    sheet: settings.lastSheet,
  };
}

const background = () => later(() => syncWaiverSheet());

export async function GET() {
  if (!(await currentAdmin())) return Response.json({ error: "Masuk dulu di /admin." }, { status: 401, headers: noStore });
  try {
    return Response.json(await status(), { headers: noStore });
  } catch (e) {
    console.error(`[admin/formulir] sheet: ${e.code ?? e.message}`);
    return unavailable();
  }
}

export async function POST(request) {
  const { error } = await guardAdmin(request);
  if (error) return error;
  const input = await readJson(request);
  const action = input?.action;
  try {
    if (action === "connect") {
      const url = cleanSheetUrl(input.url);
      if (!url) {
        return Response.json(
          { error: "Alamat belum benar. Tempel alamat Web app dari Apps Script, bentuknya https://script.google.com/macros/s/…/exec." },
          { status: 400, headers: noStore },
        );
      }
      const { token } = await ensureSheetToken();
      const test = await testSheet(url, token);
      if (!test.ok) return Response.json({ error: test.error }, { status: 400, headers: noStore });
      await connectSheet(url, test.sheet);
      background();
    } else if (action === "sync") {
      if (!(await getSheetSettings()).url) return Response.json({ error: "Spreadsheet belum disambungkan." }, { status: 400, headers: noStore });
      background();
    } else if (action === "resend") {
      if (!(await getSheetSettings()).url) return Response.json({ error: "Spreadsheet belum disambungkan." }, { status: 400, headers: noStore });
      await resetSheetSync();
      background();
    } else if (action === "disconnect") {
      await disconnectSheet();
    } else {
      return Response.json({ error: "Perintah tidak dikenal." }, { status: 400, headers: noStore });
    }
    // Pengiriman di belakang layar baru mulai setelah jawaban ini, jadi running ditandai di sini.
    return Response.json({ ...(await status()), running: action !== "disconnect" }, { headers: noStore });
  } catch (e) {
    console.error(`[admin/formulir] sheet: ${e.code ?? e.message}`);
    return unavailable();
  }
}
