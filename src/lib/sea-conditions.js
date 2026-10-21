// Kondisi laut live Selat Dampier dari Open-Meteo (gratis, tanpa API key, lisensi CC BY 4.0:
// wajib mencantumkan sumber). Data model, bukan pengukuran di lokasi.
//   Cuaca:  https://open-meteo.com/en/docs
//   Laut:   https://open-meteo.com/en/docs/marine-weather-api (gelombang, arus SMOC, suhu air)
// File ini murni (tanpa Next.js) agar bisa dites; pemanggilan dengan cache ada di src/server/sea-conditions.js.

export const PLACE = "Dampier Strait";
// Tengah Selat Dampier, antara Kri dan Batanta. cell_selection=sea memilih sel grid laut terdekat.
export const POINT = { latitude: -0.66, longitude: 130.7 };
export const TIMEZONE = "Asia/Jayapura"; // WIT, UTC+9
export const REFRESH_SECONDS = 900;

const WEATHER_VARS = ["temperature_2m", "weather_code", "is_day", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m"];
const MARINE_VARS = [
  "wave_height",
  "wave_direction",
  "wave_period",
  "swell_wave_height",
  "ocean_current_velocity",
  "ocean_current_direction",
  "sea_surface_temperature",
];

const query = (params) => new URLSearchParams(params).toString();

export function weatherUrl(point = POINT) {
  return `https://api.open-meteo.com/v1/forecast?${query({
    latitude: point.latitude,
    longitude: point.longitude,
    current: WEATHER_VARS.join(","),
    daily: "sunset",
    forecast_days: 1,
    timezone: TIMEZONE,
    cell_selection: "sea",
  })}`;
}

export function marineUrl(point = POINT) {
  return `https://marine-api.open-meteo.com/v1/marine?${query({
    latitude: point.latitude,
    longitude: point.longitude,
    current: MARINE_VARS.join(","),
    timezone: TIMEZONE,
    cell_selection: "sea",
  })}`;
}

const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

export function compass(degrees) {
  if (!Number.isFinite(degrees)) return null;
  return COMPASS[Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16];
}

// Kode cuaca WMO → label English + jenis ikon.
export function describeWeather(code) {
  if (!Number.isFinite(code)) return { label: null, kind: "cloud" };
  if (code === 0) return { label: "Clear", kind: "clear" };
  if (code <= 2) return { label: code === 1 ? "Mostly clear" : "Partly cloudy", kind: "partly" };
  if (code === 3) return { label: "Overcast", kind: "cloud" };
  if (code === 45 || code === 48) return { label: "Fog", kind: "fog" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", kind: "rain" };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { label: code >= 80 ? "Showers" : "Rain", kind: "rain" };
  if (code >= 95) return { label: "Thunderstorm", kind: "storm" };
  return { label: "Cloudy", kind: "cloud" };
}

// Skala laut Douglas berdasarkan tinggi gelombang signifikan (m).
export function seaState(waveM) {
  if (!Number.isFinite(waveM)) return null;
  if (waveM < 0.1) return "Calm";
  if (waveM < 0.5) return "Smooth";
  if (waveM < 1.25) return "Slight";
  if (waveM < 2.5) return "Moderate";
  if (waveM < 4) return "Rough";
  return "Very rough";
}

// Label English di atas dalam Bahasa Indonesia, memakai istilah BMKG untuk cuaca dan tinggi gelombang.
export const LABELS_ID = {
  Clear: "Cerah",
  "Mostly clear": "Cerah berawan",
  "Partly cloudy": "Cerah berawan",
  Overcast: "Berawan tebal",
  Fog: "Kabut",
  Drizzle: "Gerimis",
  Rain: "Hujan",
  Showers: "Hujan lokal",
  Thunderstorm: "Hujan petir",
  Cloudy: "Berawan",
  Calm: "Sangat tenang",
  Smooth: "Tenang",
  Slight: "Rendah",
  Moderate: "Sedang",
  Rough: "Tinggi",
  "Very rough": "Sangat tinggi",
};

export const translateLabel = (label, lang) => (lang === "id" && label ? (LABELS_ID[label] ?? label) : label);

// Arah mata angin delapan penjuru dalam Bahasa Indonesia (singkatan 16 penjuru jarang dipakai di sini).
const ARAH = ["utara", "timur laut", "timur", "tenggara", "selatan", "barat daya", "barat", "barat laut"];

export function arah(degrees) {
  if (!Number.isFinite(degrees)) return null;
  return ARAH[Math.round((((degrees % 360) + 360) % 360) / 45) % 8];
}

const num = (value) => (typeof value === "number" && Number.isFinite(value) ? value : null);
const round = (value, digits = 0) => (value === null ? null : Number(value.toFixed(digits)));
const clock = (iso) => (typeof iso === "string" && iso.includes("T") ? iso.split("T")[1].slice(0, 5) : null);

// Gabungkan jawaban API cuaca + laut menjadi satu objek kecil untuk UI.
// Arah angin & gelombang = arah DATANG; arah arus = arah MENGALIR (konvensi Open-Meteo).
export function normalize(weather, marine) {
  const w = weather?.current ?? {};
  const m = marine?.current ?? {};
  const code = num(w.weather_code);
  const wind = num(w.wind_direction_10m);
  const waveDir = num(m.wave_direction);
  const currentDir = num(m.ocean_current_direction);
  const currentKmh = num(m.ocean_current_velocity);
  const waveM = num(m.wave_height);
  return {
    place: PLACE,
    time: m.time ?? w.time ?? null,
    weather: {
      ...describeWeather(code),
      code,
      isDay: w.is_day !== 0,
      tempC: round(num(w.temperature_2m)),
      windKmh: round(num(w.wind_speed_10m)),
      gustKmh: round(num(w.wind_gusts_10m)),
      windFrom: compass(wind),
      windFromDeg: wind,
    },
    sea: {
      waveM: round(waveM, 1),
      seaState: seaState(waveM),
      wavePeriodS: round(num(m.wave_period)),
      waveFrom: compass(waveDir),
      waveFromDeg: waveDir,
      swellM: round(num(m.swell_wave_height), 1),
      currentKn: currentKmh === null ? null : round(currentKmh / 1.852, 1),
      currentTo: compass(currentDir),
      currentToDeg: currentDir,
      waterC: round(num(m.sea_surface_temperature)),
    },
    sunset: clock(weather?.daily?.sunset?.[0]),
  };
}

export const hasData = (c) => Boolean(c) && (c.weather.tempC !== null || c.sea.waveM !== null || c.sea.currentKn !== null);

async function getJson(fetchImpl, url, fetchOptions) {
  const response = await fetchImpl(url, { ...fetchOptions, headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`HTTP ${response.status}${body?.reason ? `: ${body.reason}` : ""}`);
  return body;
}

// Ambil cuaca + laut bersamaan. Salah satu gagal → bagian itu kosong (null), bukan error.
export async function loadSeaConditions({ fetchImpl = fetch, fetchOptions = {}, warn = console.warn } = {}) {
  const [weather, marine] = await Promise.allSettled([
    getJson(fetchImpl, weatherUrl(), fetchOptions),
    getJson(fetchImpl, marineUrl(), fetchOptions),
  ]);
  for (const [name, result] of [["cuaca", weather], ["laut", marine]]) {
    if (result.status === "rejected") warn(`[sea-conditions] Open-Meteo ${name} gagal: ${result.reason?.message ?? result.reason}`);
  }
  const conditions = normalize(weather.value, marine.value);
  // Jawaban sukses tetapi kosong (mis. titik terbaca sebagai daratan) juga dicatat agar terlihat di log build.
  if (weather.status === "fulfilled" && conditions.weather.tempC === null) warn("[sea-conditions] Open-Meteo cuaca kosong");
  if (marine.status === "fulfilled" && conditions.sea.waveM === null && conditions.sea.currentKn === null) warn("[sea-conditions] Open-Meteo laut kosong");
  return hasData(conditions) ? conditions : null;
}
