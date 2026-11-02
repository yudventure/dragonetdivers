-- Klip video unggahan untuk petak video galeri (src/lib/clips.js): diputar sebagai video biasa tanpa tombol,
-- karena pemutar YouTube di layar sentuh selalu memunculkan tombol play/pause. File dipecah per 1 MiB
-- (media_clip_parts) supaya tiap unggahan dan tiap baris kecil; complete = 1 setelah semua bagian masuk.
CREATE TABLE IF NOT EXISTS media_clips (
  id CHAR(24) NOT NULL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  mime VARCHAR(40) NOT NULL,
  bytes INT UNSIGNED NOT NULL,
  parts SMALLINT UNSIGNED NOT NULL,
  width SMALLINT UNSIGNED NULL,
  height SMALLINT UNSIGNED NULL,
  duration DECIMAL(8,2) NULL,
  complete TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY media_clips_pending (complete, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_clip_parts (
  clip_id CHAR(24) NOT NULL,
  part SMALLINT UNSIGNED NOT NULL,
  data MEDIUMBLOB NOT NULL,
  PRIMARY KEY (clip_id, part)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
