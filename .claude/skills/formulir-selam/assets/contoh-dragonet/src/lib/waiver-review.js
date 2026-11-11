// Meja peninjauan formulir selam di /admin/formulir (permintaan pemilik 11 November 2026: pengaturan formulir
// dipisah dari meja peninjauan, "serta bisa untuk filter berdasarkan nama, negara, sertifikat atau sesuai nomor
// formulirnya"). Filter dibaca dari alamat halaman (?q=&negara=&sertifikat=&medis=&waktu=), jadi rekap Excel
// memakai filter yang sama. Fungsi murni, diuji di tests/waiver-review.test.js.

/** Huruf kecil tanpa tanda aksen dan spasi berlebih, supaya "Côte" ditemukan dengan "cote". */
export const fold = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const MEDIS = ["dokter", "aman"];
const WAKTU = ["akan", "lalu"];

/** Filter dari parameter alamat (URLSearchParams atau objek). Nilai yang tidak dikenal diabaikan. */
export function reviewFilter(params = {}) {
  const get = (key) => {
    const value = typeof params.get === "function" ? params.get(key) : params[key];
    return typeof value === "string" ? value.trim().slice(0, 100) : "";
  };
  const medis = get("medis");
  const waktu = get("waktu");
  return {
    q: get("q"),
    negara: get("negara"),
    sertifikat: get("sertifikat"),
    medis: MEDIS.includes(medis) ? medis : "",
    waktu: WAKTU.includes(waktu) ? waktu : "",
  };
}

/** Parameter alamat untuk filter yang terisi saja (untuk tautan rekap Excel dan tombol Hapus filter). */
export function filterQuery(filter) {
  return new URLSearchParams(Object.entries(filter).filter(([, value]) => value)).toString();
}

export const isFiltered = (filter) => Object.values(filter).some(Boolean);

// Nomor Indonesia dengan 0 di depan (0812…) dibandingkan dalam bentuk internasional (62812…).
const intl = (digits) => (digits.startsWith("0") ? `62${digits.slice(1)}` : digits);

/** Nilai pilihan sertifikat sebuah formulir: "belum" (ikut kursus) atau nama agensinya. */
const certOf = (w) => (w.data?.certified === false ? "belum" : fold(w.data?.certAgency));

/**
 * Formulir yang cocok dengan filter. q dicari di nama, nomor formulir, email, nomor WhatsApp (angka saja,
 * jadi "0812" dan "+62 812" sama-sama ketemu), dan tingkat sertifikat. negara = kewarganegaraan persis (tanpa
 * beda huruf besar dan aksen). sertifikat = "ada", "belum", atau nama agensi. medis = "dokter" (perlu
 * persetujuan dokter) atau "aman". waktu = "akan" (tanggal selam hari ini atau nanti) atau "lalu".
 */
export function filterWaivers(list, filter, today) {
  const q = fold(filter.q);
  const digits = q.replace(/\D/g, "");
  const words = q.split(" ").filter(Boolean);
  return list.filter((w) => {
    if (words.length) {
      const text = fold([w.name, w.code, w.email, w.data?.certLevel, w.data?.certAgency, w.order].join(" "));
      const phone = intl(String(w.phone ?? "").replace(/\D/g, ""));
      const phoneHit = digits.length >= 4 && (phone.includes(intl(digits)) || phone.includes(digits));
      if (!words.every((word) => text.includes(word)) && !phoneHit) return false;
    }
    if (filter.negara && fold(w.nationality) !== fold(filter.negara)) return false;
    if (filter.sertifikat) {
      const cert = certOf(w);
      if (filter.sertifikat === "ada" ? cert === "belum" : cert !== fold(filter.sertifikat)) return false;
    }
    if (filter.medis === "dokter" && !w.clearance) return false;
    if (filter.medis === "aman" && w.clearance) return false;
    if (filter.waktu === "akan" && !(w.date >= today)) return false;
    if (filter.waktu === "lalu" && !(w.date < today)) return false;
    return true;
  });
}

const capital = (text) => (text[0] && text[0] !== text[0].toLowerCase() ? 1 : 0);

/** Pilihan negara dan agensi sertifikat dari formulir yang ada, urut abjad, ejaan yang paling sering dipakai. */
export function reviewOptions(list) {
  const pick = (values) => {
    const groups = new Map();
    for (const value of values) {
      const key = fold(value);
      if (!key) continue;
      const counts = groups.get(key) ?? new Map();
      counts.set(value.trim(), (counts.get(value.trim()) ?? 0) + 1);
      groups.set(key, counts);
    }
    return [...groups.values()]
      .map((counts) => [...counts].sort((a, b) => b[1] - a[1] || capital(b[0]) - capital(a[0]) || a[0].localeCompare(b[0]))[0][0])
      .sort((a, b) => a.localeCompare(b, "id"));
  };
  return {
    countries: pick(list.map((w) => w.nationality ?? "")),
    agencies: pick(list.filter((w) => w.data?.certified !== false).map((w) => w.data?.certAgency ?? "")),
  };
}
