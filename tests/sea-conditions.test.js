import { test } from "node:test";
import assert from "node:assert/strict";
import { compass, describeWeather, loadSeaConditions, marineUrl, normalize, seaState, weatherUrl } from "../src/lib/sea-conditions.js";

// Bentuk jawaban Open-Meteo dengan timezone=Asia/Jayapura (waktu lokal WIT, tanpa offset).
const weather = {
  current: { time: "2026-10-20T16:15", temperature_2m: 29.4, weather_code: 2, is_day: 1, wind_speed_10m: 11.6, wind_direction_10m: 135, wind_gusts_10m: 22.3 },
  daily: { time: ["2026-10-20"], sunset: ["2026-10-20T18:07"] },
};
const marine = {
  current: {
    time: "2026-10-20T16:15",
    wave_height: 0.42,
    wave_direction: 160,
    wave_period: 5.8,
    swell_wave_height: 0.28,
    ocean_current_velocity: 2.78,
    ocean_current_direction: 300,
    sea_surface_temperature: 29.6,
  },
};

test("URL Open-Meteo memakai titik Selat Dampier, WIT, dan sel laut", () => {
  for (const url of [weatherUrl(), marineUrl()]) {
    const params = new URL(url).searchParams;
    assert.equal(params.get("latitude"), "-0.66");
    assert.equal(params.get("longitude"), "130.7");
    assert.equal(params.get("timezone"), "Asia/Jayapura");
    assert.equal(params.get("cell_selection"), "sea");
  }
  assert.match(new URL(marineUrl()).searchParams.get("current"), /ocean_current_velocity,ocean_current_direction/);
  assert.equal(new URL(weatherUrl()).searchParams.get("daily"), "sunset");
});

test("arah kompas 16 mata angin", () => {
  assert.equal(compass(0), "N");
  assert.equal(compass(135), "SE");
  assert.equal(compass(300), "WNW");
  assert.equal(compass(359), "N");
  assert.equal(compass(-90), "W");
  assert.equal(compass(null), null);
});

test("kode cuaca WMO dan skala laut Douglas", () => {
  assert.deepEqual(describeWeather(0), { label: "Clear", kind: "clear" });
  assert.equal(describeWeather(81).label, "Showers");
  assert.equal(describeWeather(95).kind, "storm");
  assert.equal(seaState(0.05), "Calm");
  assert.equal(seaState(0.42), "Smooth");
  assert.equal(seaState(1), "Slight");
  assert.equal(seaState(3), "Rough");
});

test("normalize: satuan dan arah untuk panel", () => {
  const c = normalize(weather, marine);
  assert.equal(c.time, "2026-10-20T16:15");
  assert.equal(c.sunset, "18:07");
  assert.deepEqual(
    { temp: c.weather.tempC, label: c.weather.label, wind: c.weather.windKmh, from: c.weather.windFrom, gust: c.weather.gustKmh },
    { temp: 29, label: "Partly cloudy", wind: 12, from: "SE", gust: 22 },
  );
  assert.deepEqual(
    { wave: c.sea.waveM, state: c.sea.seaState, from: c.sea.waveFrom, current: c.sea.currentKn, to: c.sea.currentTo, water: c.sea.waterC },
    { wave: 0.4, state: "Smooth", from: "SSE", current: 1.5, to: "WNW", water: 30 },
  );
});

test("satu API gagal: bagian lain tetap tampil, kegagalan dicatat", async () => {
  const warnings = [];
  const fetchImpl = async (url) =>
    url.includes("marine-api") ? Response.json({ error: true, reason: "Cannot initialize" }, { status: 400 }) : Response.json(weather);
  const c = await loadSeaConditions({ fetchImpl, warn: (m) => warnings.push(m) });
  assert.equal(c.weather.tempC, 29);
  assert.equal(c.sea.waveM, null);
  assert.match(warnings.join(), /laut gagal: HTTP 400: Cannot initialize/);
});

test("keduanya gagal atau kosong: null (panel menampilkan 'unavailable')", async () => {
  const offline = async () => {
    throw new Error("getaddrinfo ENOTFOUND");
  };
  assert.equal(await loadSeaConditions({ fetchImpl: offline, warn: () => {} }), null);
  const warnings = [];
  assert.equal(await loadSeaConditions({ fetchImpl: async () => Response.json({ current: {} }), warn: (m) => warnings.push(m) }), null);
  assert.deepEqual(warnings, ["[sea-conditions] Open-Meteo cuaca kosong", "[sea-conditions] Open-Meteo laut kosong"]);
});

test("data lengkap: tanpa peringatan", async () => {
  const warnings = [];
  const fetchImpl = async (url) => Response.json(url.includes("marine-api") ? marine : weather);
  assert.ok(await loadSeaConditions({ fetchImpl, warn: (m) => warnings.push(m) }));
  assert.deepEqual(warnings, []);
});
