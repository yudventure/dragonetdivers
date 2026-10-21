-- Data modul admin (kalender, tamu, PR & mitra, HRD, keuangan, gudang) dalam satu tabel umum, seperti
-- Zanclus: satu baris per catatan, isinya JSON yang diperiksa skema di src/lib/records.js.
-- ref_date = tanggal utama catatan (transaksi, absensi, reservasi, gerak stok) untuk saring per bulan.
CREATE TABLE IF NOT EXISTS admin_records (
  id VARCHAR(40) NOT NULL PRIMARY KEY,
  kind VARCHAR(30) NOT NULL,
  ref_date DATE NULL,
  data MEDIUMTEXT NOT NULL,
  created_by VARCHAR(190) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY admin_records_kind_date (kind, ref_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Foto yang diunggah tim dari /admin/situs (galeri beranda). Disimpan di database supaya tidak hilang
-- saat Hostinger membangun ulang situs; diperkecil ke WebP sebelum disimpan.
CREATE TABLE IF NOT EXISTS media (
  id CHAR(24) NOT NULL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  mime VARCHAR(40) NOT NULL,
  width SMALLINT UNSIGNED NULL,
  height SMALLINT UNSIGNED NULL,
  bytes INT UNSIGNED NOT NULL,
  blur VARCHAR(600) NULL,
  data MEDIUMBLOB NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
