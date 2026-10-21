-- Email ke tamu per pesanan (src/server/order-mail.js), satu baris per jenis supaya tidak terkirim dua
-- kali. kind: order | reminder | paid. status: scheduled (pengingat menunggu send_after) | sending |
-- sent | failed | skipped (pesanan sudah tidak menunggu bayar). Waktu dalam UTC.
CREATE TABLE IF NOT EXISTS order_emails (
  order_code VARCHAR(40) NOT NULL,
  kind VARCHAR(20) NOT NULL,
  status VARCHAR(12) NOT NULL,
  send_after DATETIME NULL,
  error VARCHAR(300) NULL,
  sent_at DATETIME NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (order_code, kind),
  KEY order_emails_due (kind, status, send_after)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
