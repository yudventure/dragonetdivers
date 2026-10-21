-- Pesanan dari checkout website. Nama paket dan harga disalin saat memesan, jadi perubahan paket
-- tidak mengubah pesanan lama. code = order_id yang dikirim ke Midtrans/PayPal; token membuka halaman
-- status pesanan tamu. method: midtrans | paypal | transfer. status: pending | paid | expired |
-- failed | cancelled | refunded.
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL,
  token CHAR(32) NOT NULL,
  package_id INT UNSIGNED NULL,
  service VARCHAR(40) NOT NULL,
  package_name VARCHAR(120) NOT NULL,
  unit VARCHAR(10) NOT NULL DEFAULT 'person',
  unit_price_idr INT UNSIGNED NOT NULL,
  guests TINYINT UNSIGNED NOT NULL,
  amount_idr INT UNSIGNED NOT NULL,
  amount_usd DECIMAL(10,2) NULL,
  usd_rate DECIMAL(12,4) NULL,
  method VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  provider_ref VARCHAR(80) NULL,
  payment_type VARCHAR(40) NULL,
  redirect_url VARCHAR(500) NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  whatsapp VARCHAR(32) NOT NULL,
  dive_date DATE NOT NULL,
  certification VARCHAR(60) NULL,
  notes TEXT NULL,
  locale CHAR(2) NOT NULL DEFAULT 'en',
  due_at DATETIME NULL,
  paid_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY orders_code (code),
  KEY orders_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
