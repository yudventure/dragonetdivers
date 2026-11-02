-- Formulir selam yang sudah terkirim ke Google Sheets tim (src/server/waiver-sheet.js). Formulir tanpa baris
-- di sini dikirim pada kesempatan berikutnya (setelah formulir baru masuk, pengecekan berkala, atau tombol
-- Kirim di /admin/formulir). Dikosongkan saat tim menyambungkan spreadsheet lain, supaya semua formulir
-- terkirim ke sana.
CREATE TABLE IF NOT EXISTS waiver_sheet_sync (
  code VARCHAR(20) NOT NULL PRIMARY KEY,
  synced_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
