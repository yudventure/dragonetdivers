// Konfigurasi MySQL dari environment. Murni (tanpa koneksi) agar bisa dipakai
// oleh Next.js, skrip CLI, dan test.

const REQUIRED = ["MYSQL_HOST", "MYSQL_DATABASE", "MYSQL_USER", "MYSQL_PASSWORD"];

export function mysqlSettings(env = process.env) {
  const host = env.MYSQL_HOST?.trim();
  const socketPath = env.MYSQL_SOCKET?.trim();
  return {
    // localhost bisa terselesaikan ke ::1 yang punya grant berbeda di MySQL; paksa IPv4.
    host: !socketPath && host?.toLowerCase() === "localhost" ? "127.0.0.1" : host,
    port: Number(env.MYSQL_PORT?.trim() || 3306),
    database: env.MYSQL_DATABASE?.trim(),
    user: env.MYSQL_USER?.trim(),
    // Password dipakai apa adanya; spasi dan simbol bisa jadi bagian password.
    password: env.MYSQL_PASSWORD,
    ...(socketPath ? { socketPath } : {}),
    connectTimeout: 10000,
    // Charset bawaan mysql2 sudah utf8mb4_unicode_ci, sama dengan collation tabel.
    timezone: "Z",
    ...(env.MYSQL_SSL === "true" ? { ssl: { rejectUnauthorized: true } } : {}),
  };
}

// Daftar masalah konfigurasi tanpa menampilkan nilai rahasia.
export function databaseIssues(env = process.env) {
  const issues = REQUIRED.filter((name) => !env[name]?.trim()).map((name) => ({
    name,
    reason: "Belum diisi atau belum terbaca oleh aplikasi.",
  }));
  const host = env.MYSQL_HOST?.trim();
  if (host && (host.includes("://") || host.includes("/") || /^["']|["']$/.test(host))) {
    issues.push({ name: "MYSQL_HOST", reason: "Isi hostname saja, tanpa URL, path, atau tanda kutip." });
  }
  const { port } = mysqlSettings(env);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    issues.push({ name: "MYSQL_PORT", reason: "Isi port berupa angka 1–65535." });
  }
  return issues;
}

export function isDatabaseConfigured(env = process.env) {
  return databaseIssues(env).length === 0;
}

const HINTS = {
  ER_ACCESS_DENIED_ERROR: "MySQL menolak login. Periksa MYSQL_USER dan MYSQL_PASSWORD, dan pastikan user boleh terhubung dari server aplikasi.",
  ER_DBACCESS_DENIED_ERROR: "User belum punya akses ke database ini. Hubungkan user ke database di hPanel.",
  ER_HOST_NOT_PRIVILEGED: "Server aplikasi belum diizinkan. Tambahkan IP keluar aplikasi di Remote MySQL (bukan IP database).",
  ER_BAD_DB_ERROR: "Database tidak ditemukan. Pakai nama lengkap termasuk prefix Hostinger.",
  ER_TABLEACCESS_DENIED_ERROR: "Izin tabel ditolak. User butuh CREATE, ALTER, INDEX, SELECT, INSERT, UPDATE, DELETE.",
  ENOTFOUND: "Hostname tidak ditemukan. Isi MYSQL_HOST dengan hostname saja.",
  EAI_AGAIN: "Hostname belum bisa di-resolve. Coba lagi; jika berlanjut periksa hostname.",
  ECONNREFUSED: "Koneksi ditolak. Periksa MYSQL_HOST dan MYSQL_PORT.",
  ETIMEDOUT: "Koneksi melewati batas waktu. Periksa akses jaringan / Remote MySQL.",
  EHOSTUNREACH: "Server MySQL tidak terjangkau dari aplikasi.",
  PROTOCOL_CONNECTION_LOST: "Koneksi MySQL terputus. Coba lagi.",
};

// Ringkasan error yang aman ditampilkan: kode + petunjuk, tanpa SQL, host, atau user.
export function databaseFailure(error) {
  const code = Object.hasOwn(HINTS, error?.code) ? error.code : "DATABASE_UNAVAILABLE";
  return {
    code,
    hint: HINTS[code] || "Database belum bisa diakses. Periksa konfigurasi MySQL di hPanel.",
  };
}
