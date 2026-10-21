// Keranjang paket di peramban tamu (localStorage, src/components/cart.jsx): satu baris per paket dengan
// jumlah tamu dan tanggalnya. Hanya untuk tampilan; harga dan batas tamu selalu diperiksa ulang server
// saat checkout (validateCart di src/lib/checkout.js). Fungsi murni, diuji di tests/cart.test.js.
import { MAX_ITEMS, orderTotal } from "./checkout.js";

export const CART_KEY = "dd-cart-v1";

const int = (value, fallback) => (Number.isInteger(Number(value)) ? Number(value) : fallback);
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Data paket yang disimpan di keranjang, dari paket publik { id, service, name: { en, id }, price, unit, minGuests, maxGuests }. */
export const cartPackage = (pkg) => ({
  packageId: Number(pkg.id ?? pkg.packageId),
  service: String(pkg.service),
  name: { en: String(pkg.name?.en ?? ""), id: String(pkg.name?.id ?? pkg.name?.en ?? "") },
  price: Number(pkg.price),
  unit: pkg.unit === "group" ? "group" : "person",
  minGuests: Math.max(1, int(pkg.minGuests, 1)),
  maxGuests: Math.max(1, int(pkg.maxGuests, 8)),
});

/** Isi localStorage (bisa rusak atau dari versi lama) → daftar baris yang sah. */
export function normalizeCart(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const item = cartPackage(raw);
    if (!Number.isSafeInteger(item.packageId) || item.packageId < 1 || seen.has(item.packageId)) continue;
    if (!Number.isSafeInteger(item.price) || item.price < 1 || !item.name.en || item.minGuests > item.maxGuests) continue;
    seen.add(item.packageId);
    out.push({ ...item, guests: clamp(int(raw.guests, item.minGuests), item.minGuests, item.maxGuests), date: DATE.test(raw.date ?? "") ? raw.date : "" });
    if (out.length === MAX_ITEMS) break;
  }
  return out;
}

export const inCart = (cart, packageId) => cart.some((item) => item.packageId === Number(packageId));

/** Tambah paket (jumlah tamu awal = minimal paket). Paket yang sudah ada tidak digandakan. */
export function addToCart(cart, pkg) {
  const item = cartPackage(pkg);
  if (inCart(cart, item.packageId) || cart.length >= MAX_ITEMS) return cart;
  return [...cart, { ...item, guests: item.minGuests, date: "" }];
}

export const removeFromCart = (cart, packageId) => cart.filter((item) => item.packageId !== Number(packageId));

/** Ubah jumlah tamu atau tanggal satu baris; jumlah tamu dijaga di antara minimal dan maksimal paket. */
export function updateCartItem(cart, packageId, patch) {
  return cart.map((item) => {
    if (item.packageId !== Number(packageId)) return item;
    const guests = patch.guests === undefined ? item.guests : clamp(int(patch.guests, item.guests), item.minGuests, item.maxGuests);
    const date = patch.date === undefined ? item.date : DATE.test(patch.date) ? patch.date : "";
    return { ...item, guests, date };
  });
}

export const lineTotal = (item) => orderTotal(item, item.guests);
export const cartTotal = (cart) => cart.reduce((sum, item) => sum + lineTotal(item), 0);

/**
 * Perbarui keranjang dengan data paket terbaru dari server (harga, nama, batas tamu). Paket yang sudah
 * tidak dijual dibuang; { cart, removed } dengan removed = jumlah baris yang dibuang.
 */
export function refreshCart(cart, fresh) {
  const byId = new Map(fresh.map((pkg) => [Number(pkg.id), pkg]));
  const next = [];
  for (const item of cart) {
    const pkg = byId.get(item.packageId);
    if (!pkg) continue;
    const update = cartPackage(pkg);
    next.push({ ...item, ...update, guests: clamp(item.guests, update.minGuests, update.maxGuests) });
  }
  return { cart: next, removed: cart.length - next.length };
}
