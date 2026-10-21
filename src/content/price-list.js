// Daftar harga 2026 dari pemilik (PDF "Turtle Dive Homestay, Price List 2026", versi 7, build 2026-08-29),
// dijadikan paket checkout per layanan. Halaman publik tidak membaca file ini: tim menambahkannya ke tabel
// packages sekali lewat tombol di /admin/paket (paket yang namanya sudah ada dilewati), lalu harga dan
// isinya diubah di sana. Harga dalam Rupiah. Teks tanpa titik dua, titik koma, dan tanda pisah panjang
// (aturan tulisan pemilik), diperiksa tests/price-list.test.js.
//
// Yang sengaja tidak dijadikan paket: Kri Island View Point (gratis), Tank Rent (khusus tamu homestay),
// Private Guide (per hari, tanpa batas tamu), biaya tamu tambahan Arborek dan Sawandarek (terpotong di PDF),
// rute dan tarif perahu, serta cara bayar dan biaya kartu 3%.

const EQUIPMENT = ["Equipment included except dive computer and torch", "Peralatan termasuk, kecuali dive computer dan senter"];
const FUEL = [
  "Far sites may add a fuel charge of IDR 300,000 to 500,000 with fewer than 3 divers",
  "Titik yang jauh bisa dikenai biaya bensin Rp 300.000 sampai 500.000 bila penyelam kurang dari 3",
];
const LUNCH = ["Lunch box for Turtle Dive Homestay guests", "Lunch box untuk tamu Turtle Dive Homestay"];
const GUIDE = ["Snorkeling guide not included (IDR 200,000 per trip)", "Belum termasuk pemandu snorkeling (Rp 200.000 per trip)"];

const en = (n) => new Intl.NumberFormat("en-US").format(n);
const id = (n) => new Intl.NumberFormat("id-ID").format(n);
const boat = (max) => [`Whole boat for up to ${max} people.`, `Satu perahu untuk sampai ${max} orang.`];
const extra = (max, price) => [
  `Extra guest beyond ${max} people IDR ${en(price)} each, contact us to arrange`,
  `Tamu tambahan di atas ${max} orang Rp ${id(price)} per orang, hubungi kami untuk mengaturnya`,
];

/** Satu paket dari pasangan teks [English, Indonesia]. */
function pkg(service, sortOrder, name, price, { unit = "person", min = 1, max = 8, summary = ["", ""], includes = [] }) {
  return {
    service,
    nameEn: name[0],
    nameId: name[1],
    summaryEn: summary[0],
    summaryId: summary[1],
    includesEn: includes.map((line) => line[0]).join("\n"),
    includesId: includes.map((line) => line[1]).join("\n"),
    price,
    unit,
    minGuests: min,
    maxGuests: max,
    sortOrder,
    active: true,
  };
}

const local = (summary) => ({ summary, includes: [EQUIPMENT, FUEL] });
const snorkel = (place, price, max, extraPrice, where = ["", ""]) =>
  pkg("snorkeling", 0, place, price, {
    unit: "group",
    max,
    summary: boat(max).map((text, i) => (where[i] ? `${where[i]} ${text}` : text)),
    includes: [GUIDE, ...(extraPrice ? [extra(max, extraPrice)] : [])],
  });

export const PRICE_LIST = {
  title: "Daftar harga 2026",
  source: "Turtle Dive Homestay, Price List 2026 (versi 7)",
  packages: [
    // Fun dive lokal (per penyelam)
    pkg("fun-dives", 10, ["One fun dive", "Satu kali fun dive"], 900_000, local(["One local fun dive in the Dampier Strait.", "Satu kali fun dive di titik selam lokal Selat Dampier."])),
    pkg("fun-dives", 20, ["Two morning fun dives", "Dua fun dive pagi"], 1_600_000, local(["Two local fun dives in the morning.", "Dua kali fun dive lokal di pagi hari."])),
    pkg("fun-dives", 30, ["Three dives in one day", "Tiga kali menyelam dalam sehari"], 2_250_000, local(["Three local fun dives on the same day.", "Tiga kali fun dive lokal di hari yang sama."])),
    pkg("fun-dives", 40, ["Two fun dives at the manta cleaning station and Arborek", "Dua fun dive di cleaning station manta dan Arborek"], 1_900_000, {
      min: 3,
      summary: ["At Manta Ridge or Manta Sandy and Arborek. Minimum 3 divers.", "Di Manta Ridge atau Manta Sandy dan Arborek. Minimal 3 penyelam."],
      includes: [EQUIPMENT],
    }),
    pkg("fun-dives", 50, ["One afternoon dive at the manta cleaning station", "Satu dive sore di cleaning station manta"], 1_000_000, {
      min: 3,
      summary: ["At Manta Ridge or Manta Sandy. Minimum 3 divers.", "Di Manta Ridge atau Manta Sandy. Minimal 3 penyelam."],
      includes: [EQUIPMENT],
    }),
    pkg("fun-dives", 60, ["House reef dive", "Dive di house reef"], 400_000, {
      summary: [
        "Your own fun dive on the house reef without a guide. Experienced divers only, subject to equipment availability.",
        "Menyelam sendiri di house reef tanpa pemandu. Khusus penyelam berpengalaman, tergantung ketersediaan peralatan.",
      ],
      includes: [EQUIPMENT],
    }),
    // Ekskursi selam (per penyelam, perahu terpisah)
    pkg("fun-dives", 70, ["Two fun dives on the Piaynemo excursion", "Dua fun dive ekskursi Piaynemo"], 1_700_000, {
      summary: ["Boat not included, book the Piaynemo excursion boat for your group.", "Belum termasuk perahu, pesan juga perahu ekskursi Piaynemo untuk grupmu."],
      includes: [EQUIPMENT],
    }),
    pkg("fun-dives", 80, ["Two fun dives at Yangefo", "Dua fun dive di Yangefo"], 2_200_000, {
      min: 3,
      summary: [
        "Citrus and Mayhem dive sites. Minimum 3 divers. Boat not included, book the Yangefo excursion boat for your group.",
        "Titik selam Citrus dan Mayhem. Minimal 3 penyelam. Belum termasuk perahu, pesan juga perahu ekskursi Yangefo untuk grupmu.",
      ],
      includes: [EQUIPMENT],
    }),
    pkg("fun-dives", 90, ["Two fun dives at the P47 wreck, Wai Island and Manta Way", "Dua fun dive di bangkai P47, Pulau Wai, dan Manta Way"], 2_000_000, {
      min: 3,
      summary: ["Minimum 3 divers. Boat fee charged separately.", "Minimal 3 penyelam. Biaya perahu dihitung terpisah."],
      includes: [EQUIPMENT],
    }),
    // Perahu ekskursi selam (per perahu)
    pkg("fun-dives", 100, ["Piaynemo excursion boat", "Perahu ekskursi Piaynemo"], 7_000_000, {
      unit: "group",
      max: 6,
      summary: ["Boat for the Piaynemo dive excursion, for 5 divers and 1 snorkeler.", "Perahu untuk ekskursi selam Piaynemo, untuk 5 penyelam dan 1 snorkeler."],
      includes: [["Piaynemo entrance fee", "Tiket masuk Piaynemo"], LUNCH],
    }),
    pkg("fun-dives", 110, ["Piaynemo excursion boat, full capacity", "Perahu ekskursi Piaynemo, kapasitas penuh"], 8_167_000, {
      unit: "group",
      max: 8,
      summary: ["Boat for the Piaynemo dive excursion, for up to 6 divers and 2 snorkelers.", "Perahu untuk ekskursi selam Piaynemo, untuk sampai 6 penyelam dan 2 snorkeler."],
      includes: [["Piaynemo entrance fee", "Tiket masuk Piaynemo"], LUNCH],
    }),
    pkg("fun-dives", 120, ["Yangefo excursion boat", "Perahu ekskursi Yangefo"], 7_000_000, {
      unit: "group",
      max: 6,
      summary: ["Boat for the Yangefo dive excursion, for 5 divers and 1 snorkeler.", "Perahu untuk ekskursi selam Yangefo, untuk 5 penyelam dan 1 snorkeler."],
      includes: [["Tour through the Kabuy Bay passage", "Tur melewati celah Teluk Kabuy"], ["Stop at the bat cave in Kabuy", "Mampir di gua kelelawar Kabuy"], LUNCH],
    }),
    pkg("fun-dives", 130, ["Batanta waterfall excursion boat", "Perahu ekskursi air terjun Batanta"], 7_000_000, {
      unit: "group",
      max: 6,
      summary: ["Boat for the Batanta waterfall excursion, for 5 divers and 1 snorkeler.", "Perahu untuk ekskursi air terjun Batanta, untuk 5 penyelam dan 1 snorkeler."],
      includes: [["Waterfall entrance fee", "Tiket masuk air terjun"], LUNCH],
    }),
    // Night dive
    pkg("dusk-dives", 10, ["Night dive at Yenbuba or Ransiwor Island", "Night dive di Yenbuba atau Pulau Ransiwor"], 1_100_000, {
      min: 2,
      summary: ["One night dive. Minimum 2 divers.", "Satu kali night dive. Minimal 2 penyelam."],
      includes: [EQUIPMENT],
    }),
    pkg("dusk-dives", 20, ["Night dive at Sawandarek", "Night dive di Sawandarek"], 1_200_000, {
      min: 2,
      summary: ["One night dive. Minimum 2 divers.", "Satu kali night dive. Minimal 2 penyelam."],
      includes: [EQUIPMENT],
    }),
    // Kursus (per orang)
    pkg("dive-courses", 10, ["Try dive", "Try dive"], 1_300_000, {
      summary: ["For people without a diving certification. Professional teaching fee paid separately.", "Untuk yang belum punya sertifikat selam. Biaya pengajar profesional dibayar terpisah."],
    }),
    pkg("dive-courses", 20, ["Skill update and refresh", "Penyegaran keterampilan selam"], 1_200_000, {
      summary: ["Brush up your diving skills. Professional teaching fee paid separately.", "Menyegarkan kembali keterampilan selammu. Biaya pengajar profesional dibayar terpisah."],
    }),
    // Snorkeling (per perahu)
    ...[
      [
        ["Manta Point snorkeling", "Snorkeling Manta Point"],
        2_000_000,
        6,
        334_000,
        ["Manta Ridge, Mambrayup and the manta cleaning station near Arborek Island.", "Manta Ridge, Mambrayup, dan cleaning station manta dekat Pulau Arborek."],
      ],
      [["Arborek Island jetty", "Dermaga Pulau Arborek"], 1_600_000, 6, 0],
      [["Mioskun Island / Bat Island", "Pulau Mioskun / Bat Island"], 1_200_000, 6, 200_000],
      [["Friwen Munday Island (Gam)", "Pulau Friwen Munday (Gam)"], 1_200_000, 6, 200_000],
      [["Sawandarek jetty", "Dermaga Sawandarek"], 1_000_000, 6, 0],
      [["Max Point / Kerupyar Island (Gam)", "Max Point / Pulau Kerupyar (Gam)"], 800_000, 6, 135_000],
      [["Sand bank (Pulau Roti, Koi Island, Pasir Timbul)", "Gosong pasir (Pulau Roti, Koi Island, Pasir Timbul)"], 500_000, 4, 125_000],
      [["Chicken Reef / Intwambrin", "Chicken Reef / Intwambrin"], 500_000, 4, 125_000],
      [["Cape Kri (Tapor Tamiyam)", "Tanjung Kri (Tapor Tamiyam)"], 400_000, 4, 100_000],
      [["Yenkronao jetty (Kri Island)", "Dermaga Yenkronao (Pulau Kri)"], 400_000, 4, 100_000],
      [["Yenbuba jetty or Cape Mansuar (Tapor Dura)", "Dermaga Yenbuba atau Tanjung Mansuar (Tapor Dura)"], 300_000, 4, 75_000],
    ].map(([name, price, max, extraPrice, where], i) => ({ ...snorkel(name, price, max, extraPrice, where), sortOrder: (i + 1) * 10 })),
    // Trip pulau (per perahu)
    pkg("island-trips", 10, ["Piaynemo", "Piaynemo"], 7_000_000, {
      unit: "group",
      max: 6,
      summary: ["Snorkeling and excursion trip to Piaynemo. Whole boat for up to 6 people.", "Trip snorkeling dan ekskursi ke Piaynemo. Satu perahu untuk sampai 6 orang."],
      includes: [LUNCH, GUIDE, extra(6, 1_167_000)],
    }),
    pkg("island-trips", 20, ["Batanta snorkeling and waterfall excursion", "Snorkeling dan ekskursi air terjun Batanta"], 7_000_000, {
      unit: "group",
      max: 6,
      summary: ["Snorkeling around Batanta and a visit to the waterfall. Whole boat for up to 6 people.", "Snorkeling di sekitar Batanta dan berkunjung ke air terjun. Satu perahu untuk sampai 6 orang."],
      includes: [LUNCH, GUIDE, extra(6, 1_167_000)],
    }),
    pkg("island-trips", 30, ["Kabuy passage excursion and Citrus passage snorkeling", "Ekskursi celah Kabuy dan snorkeling celah Citrus"], 7_000_000, {
      unit: "group",
      max: 6,
      summary: [
        "Snorkeling in the Citrus passage area, returning through the passage. Whole boat for up to 6 people.",
        "Snorkeling di area celah Citrus, lalu kembali melewati celah itu. Satu perahu untuk sampai 6 orang.",
      ],
      includes: [LUNCH, GUIDE, extra(6, 1_167_000)],
    }),
    pkg("island-trips", 40, ["Bird watching trip (Gam)", "Trip mengamati burung (Gam)"], 1_800_000, {
      unit: "group",
      max: 6,
      summary: ["Bird watching in the Gam Island area. Price per boat.", "Mengamati burung di sekitar Pulau Gam. Harga per perahu."],
      includes: [["Entrance fee not included (IDR 250,000 per person)", "Belum termasuk tiket masuk (Rp 250.000 per orang)"]],
    }),
    pkg("island-trips", 50, ["Fishing trip near Mansuar and Kri", "Trip memancing dekat Mansuar dan Kri"], 1_500_000, {
      unit: "group",
      max: 6,
      summary: ["Fishing within the Mansuar and Kri Island zone, 3 to 4 hours. Price per boat.", "Memancing di sekitar Pulau Mansuar dan Kri, 3 sampai 4 jam. Harga per perahu."],
    }),
    pkg("island-trips", 60, ["Fishing trip beyond Mansuar and Kri", "Trip memancing jauh dari Mansuar dan Kri"], 2_100_000, {
      unit: "group",
      max: 6,
      summary: ["Fishing farther from the Mansuar and Kri Island zone, 3 to 4 hours. Price per boat.", "Memancing lebih jauh dari sekitar Pulau Mansuar dan Kri, 3 sampai 4 jam. Harga per perahu."],
    }),
  ],
};
