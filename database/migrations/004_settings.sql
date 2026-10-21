-- Pengaturan yang diubah tim dari /admin, satu baris per nama dengan nilai JSON
-- (mis. "payments": cara bayar yang aktif, rekening transfer, batas waktu bayar).
CREATE TABLE IF NOT EXISTS settings (
  name VARCHAR(60) NOT NULL PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
