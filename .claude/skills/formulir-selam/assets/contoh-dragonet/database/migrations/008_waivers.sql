-- Formulir selam (liability release + kuesioner medis + tanda tangan) yang diisi tiap penyelam di /waiver
-- (src/lib/waiver.js). order_code diisi bila formulir dibuka dari halaman atau email pesanan. Isian lengkap
-- (alamat, sertifikasi, jawaban medis) di kolom data (JSON); tanda tangan PNG base64; teks perjanjian yang
-- disetujui disalin apa adanya supaya perubahan teks di /admin/formulir tidak mengubah formulir lama.
CREATE TABLE IF NOT EXISTS waivers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL,
  order_code VARCHAR(40) NULL,
  locale CHAR(2) NOT NULL DEFAULT 'en',
  full_name VARCHAR(120) NOT NULL,
  birth_date DATE NOT NULL,
  nationality VARCHAR(80) NOT NULL,
  email VARCHAR(160) NULL,
  phone VARCHAR(40) NULL,
  dive_date DATE NOT NULL,
  clearance TINYINT(1) NOT NULL DEFAULT 0,
  minor TINYINT(1) NOT NULL DEFAULT 0,
  data MEDIUMTEXT NOT NULL,
  agreement MEDIUMTEXT NULL,
  signature MEDIUMTEXT NOT NULL,
  ip VARCHAR(64) NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY waivers_code (code),
  KEY waivers_order (order_code),
  KEY waivers_date (dive_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teks perjanjian di settings (baris "waiver") bisa lebih panjang dari TEXT (64 KB).
ALTER TABLE settings MODIFY value MEDIUMTEXT NOT NULL;
