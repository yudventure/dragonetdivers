// Checkout paket: isian tamu, harga, cara bayar, dan perubahan status pembayaran. Murni (tanpa
// Next.js atau database) supaya bisa diuji (tests/checkout.test.js). Alur dan aturan statusnya
// mengikuti checkout Zanclus: tamu membayar penuh; Midtrans dan PayPal dikonfirmasi oleh
// penyedianya, transfer bank dan tunai di dive center ditandai lunas oleh tim di /admin/pesanan.

export const METHODS = ["midtrans", "paypal", "transfer", "cash"];
/** Cara bayar yang ditandai lunas oleh tim (bukan oleh penyedia pembayaran). */
export const MANUAL_METHODS = ["transfer", "cash"];
export const UNITS = ["person", "group"];
export const STATUSES = ["pending", "paid", "expired", "failed", "cancelled", "refunded"];
export const OPEN = "pending";
export const GUEST_LIMIT = 30;
export const DUE_HOURS = [2, 6, 12, 24, 48, 72];
export const ACCOUNT_LIMIT = 3;
export const BOOKING_DAYS_AHEAD = 365;
export const CERTIFICATIONS = ["none", "open_water", "advanced", "rescue", "pro"];
/** Layanan selam: checkout menanyakan sertifikasi. */
export const DIVE_SERVICES = ["fun-dives", "dive-courses", "dusk-dives"];

// Tunai di dive center menyala sejak awal (permintaan pemilik, Oktober 2026); cara lain dinyalakan tim.
export const DEFAULT_PAYMENTS = { midtrans: false, paypal: false, transfer: false, cash: true, accounts: [], dueHours: 24 };

/** Paket paling banyak dalam satu pesanan (keranjang). */
export const MAX_ITEMS = 10;

/**
 * Isian tamu yang salah. `field` dipetakan ke pesan dua bahasa di src/content/ui.js (checkout.errors);
 * `index` = urutan paket di keranjang bila salahnya ada di tanggal atau jumlah tamu satu paket.
 */
export class CheckoutError extends Error {
  constructor(field, status = 400, index = null) {
    super(field);
    this.field = field;
    this.status = status;
    this.index = index;
  }
}

const str = (value) => (typeof value === "string" ? value.trim() : "");

/** Nomor WhatsApp jadi angka dengan kode negara: "+62 812-3456-7890" / "0812…" → "62812…", atau null. */
export function cleanWhatsApp(value) {
  let digits = str(value).replace(/[\s().-]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

export function cleanEmail(value) {
  const email = str(value).toLowerCase();
  return email.length <= 190 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) ? email : null;
}

/** Tanggal hari ini di Raja Ampat (WIT, UTC+9) sebagai "YYYY-MM-DD". */
export const witToday = (now = new Date()) => new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);

export function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Rentang tanggal yang bisa dipilih: besok sampai setahun ke depan (WIT). */
export const dateRange = (now = new Date()) => ({ min: addDays(witToday(now), 1), max: addDays(witToday(now), BOOKING_DAYS_AHEAD) });

/** Total Rupiah: per orang dikali jumlah tamu, per grup satu harga. */
export const orderTotal = (pkg, guests) => (pkg.unit === "group" ? pkg.price : pkg.price * guests);

const validDate = (date, { min, max }) => /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) && date >= min && date <= max;

/**
 * Periksa isian checkout keranjang. input.items = [{ packageId, guests, date }] (1 sampai MAX_ITEMS),
 * packages = { [id]: paket aktif dari database }. Mengembalikan isian yang sudah dibersihkan dengan
 * items = [{ pkg, guests, date, amount }] dan total, atau melempar CheckoutError dengan nama isian yang salah.
 */
export function validateCart(input, { packages, methods, now = new Date() }) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new CheckoutError("form");
  if (str(input.website)) throw new CheckoutError("form"); // kolom jebakan untuk bot
  const list = input.items;
  if (!Array.isArray(list) || list.length === 0) throw new CheckoutError("empty");
  if (list.length > MAX_ITEMS) throw new CheckoutError("form");
  const range = dateRange(now);
  const items = list.map((item, index) => {
    const pkg = packages[Number(item?.packageId)];
    if (!pkg) throw new CheckoutError("package", 404, index);
    const guests = Number(item.guests);
    if (!Number.isInteger(guests) || guests < pkg.minGuests || guests > pkg.maxGuests) throw new CheckoutError("guests", 400, index);
    const date = str(item.date);
    if (!validDate(date, range)) throw new CheckoutError("date", 400, index);
    return { pkg, guests, date, amount: orderTotal(pkg, guests) };
  });
  const name = str(input.name).replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 120) throw new CheckoutError("name");
  const email = cleanEmail(input.email);
  if (!email) throw new CheckoutError("email");
  const whatsapp = cleanWhatsApp(input.whatsapp);
  if (!whatsapp) throw new CheckoutError("whatsapp");
  const dive = items.some((item) => DIVE_SERVICES.includes(item.pkg.service));
  const certification = dive && CERTIFICATIONS.includes(input.certification) ? input.certification : null;
  const notes = str(input.notes);
  if (notes.length > 1000) throw new CheckoutError("notes");
  const method = str(input.method);
  if (!methods.includes(method)) throw new CheckoutError("method", methods.length ? 400 : 409);
  return { items, name, email, whatsapp, certification, notes, method, amount: items.reduce((sum, item) => sum + item.amount, 0) };
}

/**
 * Kolom ringkasan pesanan di tabel orders dari isinya (urut seperti di keranjang): nama paket pertama
 * (+ jumlah paket lain), layanan dan harga paket pertama, tanggal paling awal, dan tamu terbanyak.
 * items = [{ service, packageName, unit, unitPrice, guests, date }].
 */
export function summarizeItems(items, lang = "en") {
  const [first] = items;
  const more = items.length - 1;
  const suffix = more ? (lang === "id" ? ` + ${more} lainnya` : ` + ${more} more`) : "";
  return {
    packageId: first.packageId ?? null,
    service: first.service,
    packageName: `${first.packageName.slice(0, 120 - suffix.length)}${suffix}`,
    unit: first.unit,
    unitPrice: first.unitPrice,
    guests: Math.max(...items.map((item) => item.guests)),
    date: items.map((item) => item.date).sort()[0],
  };
}

/** Dolar yang ditagih PayPal untuk jumlah Rupiah (PayPal tidak menerima Rupiah), dibulatkan ke atas per sen. */
export const paypalUsd = (idr, idrPerUsd) => (Math.ceil((idr / idrPerUsd) * 100) / 100).toFixed(2);

/** Arti status transaksi Midtrans bagi pesanan (sama dengan Zanclus). */
export function paymentOutcome({ transaction_status: status, fraud_status: fraud } = {}) {
  if (status === "settlement") return "paid";
  if (status === "capture") return !fraud || fraud === "accept" ? "paid" : fraud === "challenge" ? "pending" : "failed";
  if (status === "pending" || status === "authorize") return "pending";
  if (status === "expire") return "expired";
  if (["deny", "cancel", "failure"].includes(status)) return "failed";
  if (status === "refund" || status === "partial_refund") return "refunded";
  return null;
}

/**
 * Status berikutnya, atau null bila tidak berubah. Pesanan yang masih menunggu boleh jadi lunas,
 * kedaluwarsa, gagal, atau dibatalkan; yang lunas hanya bisa dikembalikan (refund). Pesanan yang
 * sudah ditutup karena lewat batas waktu tetap boleh jadi lunas bila uangnya ternyata masuk.
 */
export function nextStatus(current, outcome) {
  if (!STATUSES.includes(outcome) || outcome === current) return null;
  if (current === "pending") return outcome === "refunded" ? null : outcome;
  if (current === "paid") return outcome === "refunded" ? "refunded" : null;
  if (["expired", "failed", "cancelled"].includes(current)) return outcome === "paid" ? "paid" : null;
  return null;
}

/** Pesanan menunggu yang batas bayarnya lewat. */
export const isOverdue = (order, now = new Date()) => order.status === OPEN && Boolean(order.dueAt) && new Date(order.dueAt) < now;

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Kode pesanan "DD-261021-K7Q2M": tanggal WIT + lima karakter acak (tanpa 0/O, 1/I). */
export function newOrderCode(now = new Date(), randomBytes = (n) => crypto.getRandomValues(new Uint8Array(n))) {
  const day = witToday(now).slice(2).replaceAll("-", "");
  const tail = [...randomBytes(5)].map((b) => CODE_CHARS[b % CODE_CHARS.length]).join("");
  return `DD-${day}-${tail}`;
}

export const isOrderCode = (value) => typeof value === "string" && /^DD-\d{6}-[A-Z0-9]{5}$/.test(value);

/** Teks banyak baris (satu butir per baris) → larik tanpa baris kosong. */
export const lines = (text) =>
  String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean);

const adminText = (value, label, max, { required = false } = {}) => {
  const clean = str(value);
  if (required && !clean) throw new Error(`${label} wajib diisi.`);
  if (clean.length > max) throw new Error(`${label} maksimal ${max} karakter.`);
  if (/[<>]/.test(clean)) throw new Error(`${label} tidak boleh berisi < atau >.`);
  return clean;
};

/** Paket dari form admin → nilai yang disimpan, atau Error berpesan Bahasa Indonesia. */
export function validatePackage(input, services) {
  if (!input || typeof input !== "object") throw new Error("Data paket tidak valid.");
  const service = str(input.service);
  if (!services.includes(service)) throw new Error("Pilih layanan paket.");
  const price = Number(String(input.price ?? "").replace(/[.\s]/g, ""));
  if (!Number.isSafeInteger(price) || price < 10_000 || price > 1_000_000_000) throw new Error("Harga harus angka Rupiah, minimal Rp 10.000.");
  const unit = UNITS.includes(input.unit) ? input.unit : "person";
  const minGuests = Number(input.minGuests ?? 1);
  const maxGuests = Number(input.maxGuests ?? 8);
  if (!Number.isInteger(minGuests) || !Number.isInteger(maxGuests) || minGuests < 1 || maxGuests > GUEST_LIMIT || minGuests > maxGuests) {
    throw new Error(`Jumlah tamu: minimal 1, maksimal ${GUEST_LIMIT}, dan minimal tidak boleh lebih dari maksimal.`);
  }
  const includes = (value, label) => {
    const list = lines(value);
    if (list.length > 12) throw new Error(`${label} maksimal 12 baris.`);
    return list.map((line) => adminText(line, label, 120)).join("\n");
  };
  const sort = Number(input.sortOrder ?? 0);
  return {
    service,
    nameEn: adminText(input.nameEn, "Nama paket (English)", 120, { required: true }),
    nameId: adminText(input.nameId, "Nama paket (Indonesia)", 120, { required: true }),
    summaryEn: adminText(input.summaryEn, "Ringkasan (English)", 300),
    summaryId: adminText(input.summaryId, "Ringkasan (Indonesia)", 300),
    includesEn: includes(input.includesEn, "Isi paket (English)"),
    includesId: includes(input.includesId, "Isi paket (Indonesia)"),
    price,
    unit,
    minGuests,
    maxGuests,
    active: input.active !== false,
    sortOrder: Number.isInteger(sort) ? Math.max(-999, Math.min(999, sort)) : 0,
  };
}

/** Pengaturan pembayaran dari /admin/pembayaran → nilai yang disimpan, atau Error berpesan Indonesia. */
export function validatePayments(input) {
  if (input == null) return structuredClone(DEFAULT_PAYMENTS);
  if (typeof input !== "object" || Array.isArray(input)) throw new Error("Pengaturan pembayaran tidak valid.");
  const accounts = (Array.isArray(input.accounts) ? input.accounts : [])
    .map((a) => ({
      bank: adminText(a?.bank, "Nama bank", 40),
      number: adminText(a?.number, "Nomor rekening", 30),
      holder: adminText(a?.holder, "Atas nama", 80),
    }))
    .filter((a) => a.bank || a.number || a.holder);
  if (accounts.length > ACCOUNT_LIMIT) throw new Error(`Maksimal ${ACCOUNT_LIMIT} rekening.`);
  for (const a of accounts) {
    if (!a.bank || !a.number || !a.holder) throw new Error("Lengkapi nama bank, nomor rekening, dan atas nama.");
    if (!/^[\d\s.-]{5,30}$/.test(a.number)) throw new Error("Nomor rekening hanya angka, spasi, titik, atau strip.");
  }
  const dueHours = DUE_HOURS.includes(Number(input.dueHours)) ? Number(input.dueHours) : DEFAULT_PAYMENTS.dueHours;
  // Simpanan lama tanpa kunci cash ikut menyalakan tunai, seperti bawaannya.
  return { midtrans: input.midtrans === true, paypal: input.paypal === true, transfer: input.transfer === true, cash: input.cash !== false, accounts, dueHours };
}
