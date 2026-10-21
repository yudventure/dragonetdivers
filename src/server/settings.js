import "server-only";
import { query } from "./db";

// Pengaturan kecil dari /admin di tabel settings (satu baris JSON per nama), mis. "calendar" untuk
// kapasitas harian dan "finance" untuk tarif pajak. Pengaturan pembayaran punya modulnya sendiri.

export async function getSetting(name, fallback) {
  const [row] = await query("SELECT value FROM settings WHERE name = ?", [name]);
  if (!row) return structuredClone(fallback);
  try {
    return { ...structuredClone(fallback), ...JSON.parse(row.value) };
  } catch {
    return structuredClone(fallback);
  }
}

export async function saveSetting(name, value) {
  await query("INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)", [name, JSON.stringify(value)]);
}
