import { test } from "node:test";
import assert from "node:assert/strict";
import { addToCart, cartTotal, inCart, lineTotal, normalizeCart, refreshCart, removeFromCart, updateCartItem } from "../src/lib/cart.js";
import { MAX_ITEMS } from "../src/lib/checkout.js";

const dive = { id: 3, service: "fun-dives", name: { en: "One fun dive", id: "Satu kali fun dive" }, price: 900_000, unit: "person", minGuests: 1, maxGuests: 8 };
const boat = { id: 9, service: "snorkeling", name: { en: "Manta Point snorkeling", id: "Snorkeling Manta Point" }, price: 2_000_000, unit: "group", minGuests: 1, maxGuests: 6 };
const manta = { id: 4, service: "fun-dives", name: { en: "Manta dives", id: "Dive manta" }, price: 1_900_000, unit: "person", minGuests: 3, maxGuests: 8 };

test("tambah, ubah, hapus, dan total keranjang", () => {
  let cart = addToCart([], dive);
  cart = addToCart(cart, boat);
  cart = addToCart(cart, dive); // tidak digandakan
  assert.equal(cart.length, 2);
  assert.ok(inCart(cart, 3) && inCart(cart, "9") && !inCart(cart, 4));
  // Jumlah tamu awal = minimal paket, dan dijaga di antara minimal dan maksimal.
  cart = addToCart(cart, manta);
  assert.equal(cart.find((i) => i.packageId === 4).guests, 3);
  cart = updateCartItem(cart, 4, { guests: 1 });
  assert.equal(cart.find((i) => i.packageId === 4).guests, 3);
  cart = updateCartItem(cart, 3, { guests: 2, date: "2026-11-02" });
  cart = updateCartItem(cart, 9, { guests: 99, date: "besok" });
  assert.deepEqual(
    cart.map((i) => [i.packageId, i.guests, i.date]),
    [
      [3, 2, "2026-11-02"],
      [9, 6, ""],
      [4, 3, ""],
    ],
  );
  // Per orang dikali tamu, per perahu satu harga.
  assert.equal(lineTotal(cart[0]), 1_800_000);
  assert.equal(lineTotal(cart[1]), 2_000_000);
  assert.equal(cartTotal(cart), 1_800_000 + 2_000_000 + 5_700_000);
  assert.deepEqual(removeFromCart(cart, "9").map((i) => i.packageId), [3, 4]);
});

test("isi localStorage yang rusak dibersihkan dan keranjang dibatasi", () => {
  assert.deepEqual(normalizeCart(null), []);
  assert.deepEqual(normalizeCart("x"), []);
  const cart = normalizeCart([
    { ...dive, packageId: 3, guests: 50, date: "2026-11-02" },
    { ...dive, packageId: 3 }, // ganda
    { ...boat, packageId: 9, price: -1 },
    { packageId: "abc" },
    null,
  ]);
  assert.deepEqual(cart.map((i) => [i.packageId, i.guests, i.date]), [[3, 8, "2026-11-02"]]);
  let full = [];
  for (let id = 1; id <= MAX_ITEMS + 3; id++) full = addToCart(full, { ...dive, id });
  assert.equal(full.length, MAX_ITEMS);
});

test("data paket terbaru dari server menggantikan yang tersimpan", () => {
  let cart = addToCart(addToCart([], dive), boat);
  cart = updateCartItem(cart, 9, { guests: 6 });
  const { cart: next, removed } = refreshCart(cart, [{ ...boat, price: 2_500_000, maxGuests: 4 }]);
  assert.equal(removed, 1); // paket 3 sudah tidak dijual
  assert.deepEqual(next.map((i) => [i.packageId, i.price, i.guests]), [[9, 2_500_000, 4]]);
});
