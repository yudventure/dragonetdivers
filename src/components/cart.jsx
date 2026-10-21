"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { addToCart, CART_KEY, normalizeCart, removeFromCart, updateCartItem } from "@/lib/cart";

const CartContext = createContext({ items: [], ready: false, add: () => {}, update: () => {}, remove: () => {}, replace: () => {}, clear: () => {} });

const read = () => {
  try {
    return normalizeCart(JSON.parse(localStorage.getItem(CART_KEY) ?? "[]"));
  } catch {
    return [];
  }
};

// Keranjang paket tamu untuk seluruh situs publik (logika di src/lib/cart.js), disimpan di perangkatnya
// (localStorage) dan ikut berubah di tab lain. ready = isi localStorage sudah terbaca (setelah hidrasi).
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(read());
    setReady(true);
    const onStorage = (event) => event.key === CART_KEY && setItems(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const change = useCallback((next) => {
    setItems((current) => {
      const value = normalizeCart(typeof next === "function" ? next(current) : next);
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(value));
      } catch {}
      return value;
    });
  }, []);

  const value = useMemo(
    () => ({
      items,
      ready,
      add: (pkg) => change((cart) => addToCart(cart, pkg)),
      update: (packageId, patch) => change((cart) => updateCartItem(cart, packageId, patch)),
      remove: (packageId) => change((cart) => removeFromCart(cart, packageId)),
      replace: (cart) => change(cart),
      clear: () => change([]),
    }),
    [items, ready, change],
  );
  return <CartContext value={value}>{children}</CartContext>;
}

export const useCart = () => useContext(CartContext);
