// Penulis .xlsx kecil tanpa pustaka (diambil dari Zanclus, src/server/xlsx.js): satu atau beberapa sheet
// berisi sel biasa, di-zip tanpa kompresi. Cukup untuk tombol "Unduh Excel" di modul admin.
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
// DOS date and time for the zip entries, in UTC.
function dosTime(date) {
  const time =
    (date.getUTCHours() << 11) |
    (date.getUTCMinutes() << 5) |
    (date.getUTCSeconds() >> 1);
  const day =
    ((date.getUTCFullYear() - 1980) << 9) |
    ((date.getUTCMonth() + 1) << 5) |
    date.getUTCDate();
  return { time, day };
}
export function zipStore(files, date = new Date()) {
  const { time, day } = dosTime(date);
  const parts = [],
    central = [];
  let offset = 0;
  for (const [name, content] of files) {
    const data = Buffer.from(content);
    const nameBytes = Buffer.from(name);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(day, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    parts.push(local, nameBytes, data);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(0x0800, 8);
    entry.writeUInt16LE(0, 10);
    entry.writeUInt16LE(time, 12);
    entry.writeUInt16LE(day, 14);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(data.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(nameBytes.length, 28);
    entry.writeUInt16LE(0, 30);
    entry.writeUInt16LE(0, 32);
    entry.writeUInt16LE(0, 34);
    entry.writeUInt16LE(0, 36);
    entry.writeUInt32LE(0, 38);
    entry.writeUInt32LE(offset, 42);
    central.push(entry, nameBytes);
    offset += local.length + nameBytes.length + data.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...parts, directory, end]);
}

const escape = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const column = (index) => {
  let name = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26))
    name = String.fromCharCode(64 + ((n - 1) % 26) + 1) + name;
  return name;
};
// Excel menghitung tanggal sebagai jumlah hari sejak 1899-12-30.
const EPOCH = Date.UTC(1899, 11, 30);
function serial(value) {
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return null;
  const time = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] ?? 0), Number(m[5] ?? 0));
  return Number.isNaN(time) ? null : (time - EPOCH) / 86_400_000;
}
// Gaya sel (urutan cellXfs di styles.xml di bawah).
const STYLE = { header: 1, date: 2, datetime: 3, brand: 4, link: 5, alert: 6, center: 7 };
const styleAttr = (id) => (id ? ` s="${id}"` : "");
const quote = (value) => String(value).replace(/"/g, '""');
// Numbers stay numbers; everything else is an inline string (never a formula). Objects:
// { date: "YYYY-MM-DD" } and { datetime: "YYYY-MM-DD HH:MM" } become real date cells, { link, text } a
// HYPERLINK cell, { value, alert: true } a highlighted cell, { value, center: true } a centred cell.
function cell(value, ref, header) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "object") {
    if ("date" in value || "datetime" in value) {
      const n = serial(value.date ?? value.datetime);
      if (n === null) return cell(String(value.date ?? value.datetime), ref, header);
      return `<c r="${ref}"${styleAttr("date" in value ? STYLE.date : STYLE.datetime)}><v>${n}</v></c>`;
    }
    if ("link" in value) {
      const text = value.text || value.link;
      return `<c r="${ref}" t="str"${styleAttr(STYLE.link)}><f>${escape(`HYPERLINK("${quote(value.link)}","${quote(text)}")`)}</f><v>${escape(text)}</v></c>`;
    }
    if ("value" in value) return cell(value.value, ref, value.alert ? STYLE.alert : value.center ? STYLE.center : header);
    return "";
  }
  const style = styleAttr(header);
  if (typeof value === "number" && Number.isFinite(value))
    return `<c r="${ref}"${style}><v>${value}</v></c>`;
  return `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${escape(value)}</t></is></c>`;
}
// sheet.freeze = { rows, columns } menempelkan baris dan kolom pertama; sheet.filter = filter di baris judul;
// sheet.brand = baris judul teal dengan huruf putih (selain itu tebal saja).
function sheetXml({ rows, widths, freeze, filter, brand }) {
  const cols = widths?.length
    ? `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>`
    : "";
  const fr = freeze?.rows ?? 0;
  const fc = freeze?.columns ?? 0;
  const pane =
    fr || fc
      ? `<pane${fc ? ` xSplit="${fc}"` : ""}${fr ? ` ySplit="${fr}"` : ""} topLeftCell="${column(fc)}${fr + 1}" activePane="${fr && fc ? "bottomRight" : fr ? "bottomLeft" : "topRight"}" state="frozen"/>`
      : "";
  const views = `<sheetViews><sheetView workbookViewId="0">${pane}</sheetView></sheetViews>`;
  const head = brand ? STYLE.brand : STYLE.header;
  const body = rows
    .map(
      (row, r) =>
        `<row r="${r + 1}"${r === 0 && brand ? ' ht="30" customHeight="1"' : ""}>${row.map((value, c) => cell(value, column(c) + (r + 1), r === 0 ? head : 0)).join("")}</row>`,
    )
    .join("");
  const width = Math.max(1, ...rows.map((row) => row.length));
  const auto = filter ? `<autoFilter ref="${filterRef(rows.length, width)}"/>` : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${views}${cols}<sheetData>${body}</sheetData>${auto}</worksheet>`;
}
const filterRef = (count, width) => `A1:${column(width - 1)}${Math.max(1, count)}`;
// Nama tersembunyi yang Excel pakai untuk filter (_xlnm._FilterDatabase) per lembar yang berfilter.
function filterNames(sheets, names) {
  const defs = sheets
    .map((sheet, i) => {
      if (!sheet.filter) return "";
      const width = Math.max(1, ...sheet.rows.map((row) => row.length));
      const [from, to] = filterRef(sheet.rows.length, width).split(":");
      const abs = (ref) => ref.replace(/^([A-Z]+)(\d+)$/, "$$$1$$$2");
      return `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${names[i].replace(/'/g, "''")}'!${abs(from)}:${abs(to)}</definedName>`;
    })
    .join("");
  return defs ? `<definedNames>${defs}</definedNames>` : "";
}
// sheets: [{ name, rows: [[...cells]], widths?: [...], freeze?, filter?, brand? }]. The first row of
// each sheet is the header (bold, or teal with white text when brand is set).
export function workbook(sheets, date = new Date()) {
  const names = sheets.map((sheet, i) =>
    escape(
      (sheet.name || `Sheet${i + 1}`).replace(/[\\/*?:[\]]/g, " ").slice(0, 31),
    ),
  );
  const files = [
    [
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`,
    ],
    [
      "_rels/.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    ],
    [
      "xl/workbook.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((name, i) => `<sheet name="${name}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>${filterNames(sheets, names)}</workbook>`,
    ],
    [
      "xl/_rels/workbook.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    ],
    [
      "xl/styles.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="dd mmm yyyy"/><numFmt numFmtId="165" formatCode="dd mmm yyyy hh:mm"/></numFmts><fonts count="5"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><u/><sz val="11"/><color rgb="FF146E7F"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFB4560F"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF146E7F"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFDF4EC"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="8"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="4" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    ],
    ...sheets.map((sheet, i) => [
      `xl/worksheets/sheet${i + 1}.xml`,
      sheetXml(sheet),
    ]),
  ];
  return zipStore(files, date);
}
