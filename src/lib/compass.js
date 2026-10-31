// Nama arah delapan penjuru dari derajat. Berkas tersendiri tanpa teks bahasa, supaya panel kondisi laut
// (SeaConditionsPanel.jsx, client component) bisa memakainya tanpa memuat src/content/locales/.

/** Nama arah dari derajat dengan daftar delapan penjuru (utara dulu, searah jarum jam). */
export function arahDari(degrees, names) {
  if (!Number.isFinite(degrees)) return null;
  return names[Math.round((((degrees % 360) + 360) % 360) / 45) % 8];
}
