-- Permintaan booking dari form website (BRANDING.md §9.6). Form mengirim tamu ke
-- WhatsApp; tabel ini menyimpan salinannya agar tidak ada permintaan yang hilang.
-- Idempoten: aman bila juga diimpor manual lewat phpMyAdmin.
CREATE TABLE IF NOT EXISTS booking_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  whatsapp VARCHAR(32) NULL,
  email VARCHAR(190) NULL,
  activity VARCHAR(40) NOT NULL DEFAULT 'fun_dive',
  dive_date DATE NULL,
  guests TINYINT UNSIGNED NOT NULL DEFAULT 1,
  certification VARCHAR(60) NULL,
  message TEXT NULL,
  locale CHAR(2) NOT NULL DEFAULT 'en',
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY booking_requests_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
