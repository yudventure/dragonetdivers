// Batas percobaan login per alamat IP: setelah `limit` kali gagal dalam `windowMs`, login ditolak
// sampai jendela itu lewat. Disimpan di memori proses (Hostinger menjalankan satu proses Node), jadi
// hilang saat aplikasi dimulai ulang. Murni dan bisa diuji (tests/admin-session.test.js).
export function createThrottle({ limit = 5, windowMs = 15 * 60_000, maxKeys = 5000 } = {}) {
  const failures = new Map();
  const recent = (key, now) => (failures.get(key) ?? []).filter((t) => now - t < windowMs);
  return {
    blocked(key, now = Date.now()) {
      return recent(key, now).length >= limit;
    },
    fail(key, now = Date.now()) {
      if (!failures.has(key) && failures.size >= maxKeys) failures.delete(failures.keys().next().value);
      failures.set(key, [...recent(key, now), now]);
    },
    clear(key) {
      failures.delete(key);
    },
  };
}
