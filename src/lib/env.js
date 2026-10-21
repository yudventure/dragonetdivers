// Nilai environment dari hPanel. hPanel tidak menerima value kosong, jadi file impor .env memakai "-"
// untuk key yang value-nya belum diisi pemilik. "-" (atau kosong) dibaca sebagai "belum diisi".
export const UNSET = "-";

/** Nilai yang sudah dirapikan (tanpa spasi di tepi), atau "" bila kosong atau masih "-". */
export function envText(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return text === UNSET ? "" : text;
}
