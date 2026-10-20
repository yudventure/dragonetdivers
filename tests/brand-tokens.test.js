import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Tema Tailwind (app/globals.css) harus memakai nilai warna yang sama dengan brand/tokens.json.
test("warna tema Tailwind sama dengan token brand", async () => {
  const tokens = JSON.parse(await readFile(new URL("../brand/tokens.json", import.meta.url), "utf8"));
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const theme = Object.fromEntries([...css.matchAll(/--color-([a-z-]+):\s*(#[0-9A-Fa-f]{6})/g)].map(([, name, value]) => [name, value.toUpperCase()]));
  const expected = { ...tokens.color.brand, ...tokens.color.neutral };
  for (const [name, { value }] of Object.entries(expected)) {
    assert.equal(theme[name], value.toUpperCase(), `--color-${name} di globals.css berbeda dari brand/tokens.json`);
  }
  assert.equal(theme.success, tokens.color.semantic.success.value.toUpperCase());
  assert.equal(theme.danger, tokens.color.semantic.danger.value.toUpperCase());
});
