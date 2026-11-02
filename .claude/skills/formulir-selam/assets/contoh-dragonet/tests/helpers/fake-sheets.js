// Tiruan kecil Google Apps Script (SpreadsheetApp, LockService, ContentService) untuk menjalankan skrip dari
// appsScript() (src/lib/waiver-sheet.js) di Node: uji tests/waiver-sheet.test.js dan uji e2e lokal. Hanya
// metode yang dipakai skrip itu. Nilai sel disimpan apa adanya beserta format angka, warna, dan tautan, supaya
// uji bisa memeriksa bahwa format dipasang sebelum nilai (teks tetap teks).

export function fakeSpreadsheet() {
  const sheets = new Map();
  const book = {
    getSheetByName: (name) => sheets.get(name) ?? null,
    insertSheet: (name) => {
      const sheet = makeSheet(name);
      sheets.set(name, sheet);
      return sheet;
    },
    getUrl: () => "https://docs.google.com/spreadsheets/d/FAKE/edit",
  };
  const SpreadsheetApp = {
    getActive: () => book,
    flush: () => {},
    BandingTheme: { CYAN: "CYAN" },
    newRichTextValue: () => {
      const rich = { text: "", link: "" };
      const builder = {
        setText: (text) => ((rich.text = text), builder),
        setLinkUrl: (link) => ((rich.link = link), builder),
        build: () => ({ ...rich }),
      };
      return builder;
    },
  };
  const LockService = { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) };
  const ContentService = {
    MimeType: { JSON: "application/json" },
    createTextOutput: (text) => ({ text, setMimeType() { return this; } }),
  };
  return { SpreadsheetApp, LockService, ContentService, sheets };
}

function makeSheet(name) {
  const cells = new Map(); // "r,c" -> { value, format, background, color, weight, rich }
  const at = (r, c) => {
    const key = `${r},${c}`;
    if (!cells.has(key)) cells.set(key, { value: "", format: "", background: null, color: null, weight: null, rich: null });
    return cells.get(key);
  };
  const sheet = {
    name,
    cells,
    maxRows: 1000,
    maxColumns: 26,
    frozen: { rows: 0, columns: 0 },
    widths: {},
    banding: null,
    filter: null,
    at,
    getMaxRows: () => sheet.maxRows,
    getMaxColumns: () => sheet.maxColumns,
    insertColumnsAfter: (_, n) => void (sheet.maxColumns += n),
    insertRowsAfter: (_, n) => void (sheet.maxRows += n),
    setColumnWidth: (c, w) => void (sheet.widths[c] = w),
    setRowHeight: () => {},
    setFrozenRows: (n) => void (sheet.frozen.rows = n),
    setFrozenColumns: (n) => void (sheet.frozen.columns = n),
    getLastRow: () => Math.max(0, ...[...cells].filter(([, v]) => v.value !== "" || v.rich).map(([k]) => Number(k.split(",")[0]))),
    getFilter: () => sheet.filter,
    getRange: (r, c, rows = 1, cols = 1) => {
      if (r < 1 || c < 1 || r + rows - 1 > sheet.maxRows || c + cols - 1 > sheet.maxColumns) throw new Error(`range di luar lembar: ${r},${c} ${rows}x${cols}`);
      const each = (fn) => {
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) fn(at(r + y, c + x), y, x);
      };
      const range = {
        getLastRow: () => r + rows - 1,
        setValues: (values) => {
          if (values.length !== rows || values.some((row) => row.length !== cols)) throw new Error("ukuran setValues tidak cocok");
          each((cell, y, x) => {
            const value = values[y][x];
            // Seperti Google Sheets: tanpa format teks, nilai yang diawali = atau + menjadi rumus (#ERROR!).
            cell.value = cell.format !== "@" && typeof value === "string" && /^[=+]/.test(value) ? "#ERROR!" : value;
            cell.rich = null;
          });
          return range;
        },
        setNumberFormats: (formats) => (each((cell, y, x) => (cell.format = formats[y][x])), range),
        setFontWeight: (w) => (each((cell) => (cell.weight = w)), range),
        setFontColor: (v) => (each((cell) => (cell.color = v)), range),
        setBackground: (v) => (each((cell) => (cell.background = v)), range),
        setVerticalAlignment: () => range,
        setWrap: () => range,
        setHorizontalAlignment: (v) => (each((cell) => (cell.align = v)), range),
        setRichTextValue: (rich) => (each((cell) => ((cell.rich = rich), (cell.value = rich.text))), range),
        getDisplayValues: () => Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) => String(at(r + y, c + x).value ?? ""))),
        applyRowBanding: (theme, header) => {
          const banding = { theme, header, colors: {} };
          const api = {
            setHeaderRowColor: (v) => ((banding.colors.header = v), api),
            setFirstRowColor: (v) => ((banding.colors.first = v), api),
            setSecondRowColor: (v) => ((banding.colors.second = v), api),
          };
          sheet.banding = banding;
          return api;
        },
        createFilter: () => {
          if (sheet.filter) throw new Error("filter sudah ada");
          sheet.filter = { range, getRange: () => range, remove: () => void (sheet.filter = null) };
          return sheet.filter;
        },
      };
      return range;
    },
  };
  return sheet;
}

/** Jalankan kode Apps Script dengan tiruan di atas: { doPost, doGet, fake }. */
export function runAppsScript(code, fake = fakeSpreadsheet()) {
  const make = new Function("SpreadsheetApp", "LockService", "ContentService", `${code}\nreturn { doPost, doGet };`);
  return { ...make(fake.SpreadsheetApp, fake.LockService, fake.ContentService), fake };
}

/** Baris lembar sebagai array nilai (baris 1 = judul). */
export function sheetTable(sheet, columns) {
  const last = sheet.getLastRow();
  return Array.from({ length: last }, (_, y) => Array.from({ length: columns }, (_, x) => sheet.at(y + 1, x + 1).value));
}
