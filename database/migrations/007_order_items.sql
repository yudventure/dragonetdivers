-- Isi pesanan per paket (keranjang di halaman layanan): satu baris per paket dengan tanggal dan jumlah
-- tamunya sendiri. Kolom paket di tabel orders tetap diisi sebagai ringkasan (paket pertama, nama
-- gabungan, tanggal paling awal, total). Pesanan lama (satu paket) disalin sekali ke sini supaya semua
-- pesanan punya rincian. Idempoten: baris yang sudah ada dilewati (kunci order_code + position).
CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(40) NOT NULL,
  position TINYINT UNSIGNED NOT NULL DEFAULT 0,
  package_id INT UNSIGNED NULL,
  service VARCHAR(40) NOT NULL,
  package_name VARCHAR(120) NOT NULL,
  unit VARCHAR(10) NOT NULL DEFAULT 'person',
  unit_price_idr INT UNSIGNED NOT NULL,
  guests TINYINT UNSIGNED NOT NULL,
  dive_date DATE NOT NULL,
  amount_idr INT UNSIGNED NOT NULL,
  UNIQUE KEY order_items_position (order_code, position),
  KEY order_items_date (dive_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO order_items (order_code, position, package_id, service, package_name, unit, unit_price_idr, guests, dive_date, amount_idr)
SELECT code, 0, package_id, service, package_name, unit, unit_price_idr, guests, dive_date, amount_idr FROM orders;
