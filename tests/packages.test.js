import { test } from "node:test";
import assert from "node:assert/strict";
import { startingPrices } from "../src/lib/packages.js";

test("harga mulai tiap layanan dari paket aktif termurah", () => {
  const prices = startingPrices([
    { service: "fun-dives", price: 900_000, unit: "person", active: true },
    { service: "fun-dives", price: 400_000, unit: "person", active: true },
    { service: "fun-dives", price: 7_000_000, unit: "group", active: true },
    { service: "fun-dives", price: 100_000, unit: "person", active: false }, // disembunyikan tim
    { service: "island-trips", price: 1_500_000, unit: "group", active: true },
    { service: "dusk-dives", price: 0, unit: "person", active: true }, // harga tidak sah
  ]);
  assert.deepEqual(prices, {
    "fun-dives": { price: 400_000, unit: "person" },
    "island-trips": { price: 1_500_000, unit: "group" },
  });
  assert.deepEqual(startingPrices([]), {});
});
