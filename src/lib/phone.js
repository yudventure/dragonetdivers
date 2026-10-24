// Kode telepon negara untuk kolom WhatsApp di checkout (src/components/booking/PhoneField.jsx). Data dari
// metadata libphonenumber-js 1.11.20 (getCountries + getCountryCallingCode), disalin ke sini supaya tidak
// menambah paket ke peramban. Nama negara dibuat Intl.DisplayNames dalam bahasa halaman. Fungsi murni,
// diuji di tests/phone.test.js.

// "ID62" = kode ISO negara + kode teleponnya, urut ISO.
const RAW =
"AC247 AD376 AE971 AF93 AG1 AI1 AL355 AM374 AO244 AR54 AS1 AT43 AU61 AW297 AX358 AZ994 BA387 BB1 BD880 BE32 " +
  "BF226 BG359 BH973 BI257 BJ229 BL590 BM1 BN673 BO591 BQ599 BR55 BS1 BT975 BW267 BY375 BZ501 CA1 CC61 CD243 " +
  "CF236 CG242 CH41 CI225 CK682 CL56 CM237 CN86 CO57 CR506 CU53 CV238 CW599 CX61 CY357 CZ420 DE49 DJ253 DK45 " +
  "DM1 DO1 DZ213 EC593 EE372 EG20 EH212 ER291 ES34 ET251 FI358 FJ679 FK500 FM691 FO298 FR33 GA241 GB44 GD1 " +
  "GE995 GF594 GG44 GH233 GI350 GL299 GM220 GN224 GP590 GQ240 GR30 GT502 GU1 GW245 GY592 HK852 HN504 HR385 " +
  "HT509 HU36 ID62 IE353 IL972 IM44 IN91 IO246 IQ964 IR98 IS354 IT39 JE44 JM1 JO962 JP81 KE254 KG996 KH855 " +
  "KI686 KM269 KN1 KP850 KR82 KW965 KY1 KZ7 LA856 LB961 LC1 LI423 LK94 LR231 LS266 LT370 LU352 LV371 LY218 " +
  "MA212 MC377 MD373 ME382 MF590 MG261 MH692 MK389 ML223 MM95 MN976 MO853 MP1 MQ596 MR222 MS1 MT356 MU230 " +
  "MV960 MW265 MX52 MY60 MZ258 NA264 NC687 NE227 NF672 NG234 NI505 NL31 NO47 NP977 NR674 NU683 NZ64 OM968 " +
  "PA507 PE51 PF689 PG675 PH63 PK92 PL48 PM508 PR1 PS970 PT351 PW680 PY595 QA974 RE262 RO40 RS381 RU7 RW250 " +
  "SA966 SB677 SC248 SD249 SE46 SG65 SH290 SI386 SJ47 SK421 SL232 SM378 SN221 SO252 SR597 SS211 ST239 SV503 " +
  "SX1 SY963 SZ268 TA290 TC1 TD235 TG228 TH66 TJ992 TK690 TL670 TM993 TN216 TO676 TR90 TT1 TV688 TW886 TZ255 " +
  "UA380 UG256 US1 UY598 UZ998 VA39 VC1 VE58 VG1 VI1 VN84 VU678 WF681 WS685 XK383 YE967 YT262 ZA27 ZM260 ZW263";

/** [{ iso: "ID", dial: "62" }, ...] */
export const COUNTRIES = RAW.trim()
  .split(" ")
  .map((entry) => ({ iso: entry.slice(0, 2), dial: entry.slice(2) }));

const BY_ISO = new Map(COUNTRIES.map((c) => [c.iso, c]));

/** Negara utama untuk kode telepon yang dipakai beberapa negara (+1 Amerika Serikat, +7 Rusia, dst.). */
const MAIN = { 1: "US", 7: "RU", 39: "IT", 44: "GB", 47: "NO", 61: "AU", 212: "MA", 262: "RE", 290: "SH", 358: "FI", 590: "GP", 599: "CW" };

/** Negara bawaan kolom WhatsApp: base kami di Indonesia. */
export const DEFAULT_COUNTRY = "ID";

export const dialOf = (iso) => BY_ISO.get(iso)?.dial ?? null;

/** Bendera emoji dari kode ISO (huruf regional). Windows menampilkannya sebagai dua huruf. */
export const flagOf = (iso) => String.fromCodePoint(...[...iso.toUpperCase()].map((ch) => 0x1f1a5 + ch.charCodeAt(0)));

/**
 * Nomor lengkap ("+62 812 3456", "0062…") → { iso, national }. Kode telepon yang dipakai beberapa negara
 * memilih prefer bila cocok, selain itu negara utamanya. Tanpa awalan + atau 00 → null.
 */
export function splitPhone(value, prefer = null) {
  const text = String(value ?? "").trim();
  const match = /^(?:\+|00)\s*([\d\s().-]*)$/.exec(text);
  if (!match) return null;
  const digits = match[1].replace(/\D/g, "");
  for (const size of [3, 2, 1]) {
    const dial = digits.slice(0, size);
    const options = COUNTRIES.filter((c) => c.dial === dial);
    if (!options.length) continue;
    const iso = options.some((c) => c.iso === prefer) ? prefer : (MAIN[dial] ?? options[0].iso);
    return { iso, national: digits.slice(size) };
  }
  return null;
}

/**
 * Negara + nomor yang diketik → "+62 812 3456 7890" untuk dikirim ke server (cleanWhatsApp). Angka 0 di
 * depan nomor (awalan dalam negeri, mis. 0812) dibuang, kecuali Italia dan San Marino/Vatikan yang
 * memakainya di nomor internasional. Nomor tanpa angka → "".
 */
export function joinPhone(iso, national) {
  const dial = dialOf(iso) ?? dialOf(DEFAULT_COUNTRY);
  let rest = String(national ?? "")
    .replace(/[^\d\s().-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!/\d/.test(rest)) return "";
  if (!["IT", "SM", "VA"].includes(iso)) rest = rest.replace(/^[\s().-]*0+/, "");
  return `+${dial} ${rest}`.trim();
}

/** Negara awal: Indonesia untuk halaman Indonesia, selain itu wilayah bahasa peramban (en-AU → AU) bila dikenal. */
export function defaultCountry(lang, languages = []) {
  if (lang === "id") return DEFAULT_COUNTRY;
  for (const tag of languages) {
    const region = /^[a-z]{2,3}-([A-Z]{2})\b/i.exec(tag)?.[1]?.toUpperCase();
    if (region && BY_ISO.has(region)) return region;
  }
  return DEFAULT_COUNTRY;
}

const fold = (text) =>
  String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/**
 * Daftar negara untuk pemilih: nama dalam bahasa halaman (Intl.DisplayNames), urut abjad, disaring
 * dengan kata cari (nama, nama English, kode ISO, atau kode telepon "62" / "+62").
 */
export function countryOptions(lang, query = "") {
  const local = new Intl.DisplayNames([lang], { type: "region" });
  const english = new Intl.DisplayNames(["en"], { type: "region" });
  const collator = new Intl.Collator(lang);
  const q = fold(query.trim());
  const digits = q.replace(/^\+/, "");
  return COUNTRIES.map((c) => ({ ...c, name: local.of(c.iso) ?? c.iso, en: english.of(c.iso) ?? c.iso }))
    .filter((c) => {
      if (!q) return true;
      if (/^\d+$/.test(digits)) return c.dial.startsWith(digits);
      return fold(c.name).includes(q) || fold(c.en).includes(q) || c.iso.toLowerCase() === q;
    })
    .sort((a, b) => collator.compare(a.name, b.name));
}
