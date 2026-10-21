-- Paket per layanan (fun dive, kursus, dst.) yang dijual lewat checkout website. Diisi tim di
-- /admin/paket; harga dalam Rupiah. Teks dua bahasa (en/id); daftar isi paket satu baris per butir.
-- Idempoten: aman bila juga diimpor manual lewat phpMyAdmin.
CREATE TABLE IF NOT EXISTS packages (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  service VARCHAR(40) NOT NULL,
  name_en VARCHAR(120) NOT NULL,
  name_id VARCHAR(120) NOT NULL,
  summary_en VARCHAR(300) NOT NULL DEFAULT '',
  summary_id VARCHAR(300) NOT NULL DEFAULT '',
  includes_en TEXT NULL,
  includes_id TEXT NULL,
  price_idr INT UNSIGNED NOT NULL,
  unit VARCHAR(10) NOT NULL DEFAULT 'person',
  min_guests TINYINT UNSIGNED NOT NULL DEFAULT 1,
  max_guests TINYINT UNSIGNED NOT NULL DEFAULT 8,
  active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY packages_service (service, active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
