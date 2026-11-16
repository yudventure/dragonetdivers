-- Konfirmasi kedatangan dan sampah formulir selam di meja peninjauan /admin/formulir (permintaan pemilik
-- 16 November 2026). arrival: '' belum dikonfirmasi, 'datang', 'tidak' (tidak datang), 'uji' (uji coba).
-- Formulir hanya bisa dipindahkan ke sampah bila tidak datang atau uji coba (canTrash di src/lib/waiver-review.js);
-- trashed_at terisi = di sampah (tidak tampil di daftar, rekap, dan hitungan), bisa dipulihkan atau dihapus
-- permanen. Tabel terpisah supaya tabel waivers (migrasi 008) tidak diubah.
CREATE TABLE IF NOT EXISTS waiver_status (
  code VARCHAR(20) NOT NULL PRIMARY KEY,
  arrival VARCHAR(10) NOT NULL DEFAULT '',
  arrival_at DATETIME NULL,
  arrival_by VARCHAR(190) NULL,
  trashed_at DATETIME NULL,
  trashed_by VARCHAR(190) NULL,
  KEY waiver_status_trashed (trashed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
