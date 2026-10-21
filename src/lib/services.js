// Daftar layanan lengkap (BRANDING.md §1: fun dive, kursus, snorkeling, trip, ditambah dusk dive
// dari cerita logo). Dipakai grid layanan di beranda, menu, dan halaman /services/[slug].
// Isi hanya gambaran umum + hal yang perlu diketahui: belum ada harga, jadwal, nama agensi sertifikasi,
// atau klaim lain yang belum diberikan pemilik. Tambahkan di sini bila datanya sudah ada.
// Setiap layanan punya teks English (en) dan Bahasa Indonesia (id) dengan kunci yang sama; nama biota
// dalam bahasa kontennya (mandarinfish / ikan mandarin, BRANDING.md §8).

export const services = [
  {
    slug: "fun-dives",
    en: {
      title: "Fun dives",
      summary: "Guided dives on the reefs of the Dampier Strait.",
      chips: ["Small groups", "Dampier Strait"],
      ask: "fun dives",
      intro: [
        "The Dampier Strait runs through the heart of Raja Ampat, an area with some of the highest marine biodiversity recorded anywhere. Currents bring nutrients through the strait, and the reefs are busy with fish, corals and the occasional manta.",
        "We dive in small groups with local guides who know these reefs by name, so there is more time to look closely and less time following a crowd.",
      ],
      forWho: "Certified divers of every level.",
      goodToKnow: [
        "You need a scuba certification. Not certified yet? Start with a dive course.",
        "Bring your certification card and, if you keep one, your logbook.",
        "Currents in the strait change with the tide. Check the live conditions and ask us which sites suit your experience.",
      ],
    },
    id: {
      title: "Fun dive",
      summary: "Menyelam bersama pemandu di karang-karang Selat Dampier.",
      chips: ["Grup kecil", "Selat Dampier"],
      ask: "fun dive",
      intro: [
        "Selat Dampier membelah jantung Raja Ampat, kawasan dengan keanekaragaman hayati laut yang termasuk paling tinggi yang pernah tercatat. Arus membawa nutrisi melewati selat ini, dan karangnya ramai oleh ikan, koral, dan sesekali pari manta.",
        "Kami menyelam dalam grup kecil bersama pemandu lokal yang hafal karang-karang ini, jadi ada lebih banyak waktu untuk mengamati dan tidak sekadar mengikuti rombongan.",
      ],
      forWho: "Penyelam bersertifikat dari semua level.",
      goodToKnow: [
        "Kamu perlu sertifikasi selam. Belum punya? Mulai dengan kursus selam.",
        "Bawa kartu sertifikasi dan, kalau punya, logbook-mu.",
        "Arus di selat berubah mengikuti pasang surut. Cek kondisi laut terkini dan tanyakan titik mana yang cocok dengan pengalamanmu.",
      ],
    },
  },
  {
    slug: "dive-courses",
    en: {
      title: "Dive courses",
      summary: "From your first breath underwater to the next level.",
      chips: ["Beginners welcome", "Your pace"],
      ask: "dive courses",
      intro: [
        "Learning to dive with warm water and colourful reefs below you is hard to beat. Whether it is your very first breath underwater or your next course, we take it one calm step at a time.",
        "Lessons run in small groups, so your instructor has time for your questions and the skills you want to practise again.",
      ],
      forWho: "Complete beginners, and certified divers who want to keep learning.",
      goodToKnow: [
        "No diving experience is needed to start. You should be comfortable in the water.",
        "Every course starts with a short medical questionnaire, as is standard in scuba training.",
        "Ask us which courses are available during your stay.",
      ],
    },
    id: {
      title: "Kursus selam",
      summary: "Dari napas pertamamu di bawah air sampai level berikutnya.",
      chips: ["Ramah pemula", "Sesuai ritmemu"],
      ask: "kursus selam",
      intro: [
        "Belajar menyelam di air hangat dengan karang warna-warni di bawahmu sulit ditandingi. Entah ini napas pertamamu di bawah air atau kursus berikutnya, kami melangkah pelan dan tenang.",
        "Kelas berjalan dalam grup kecil, jadi instruktur punya waktu untuk pertanyaanmu dan keterampilan yang ingin kamu latih lagi.",
      ],
      forWho: "Pemula sama sekali, dan penyelam bersertifikat yang ingin terus belajar.",
      goodToKnow: [
        "Tidak perlu pengalaman menyelam untuk mulai. Kamu sebaiknya sudah nyaman di air.",
        "Setiap kursus diawali kuesioner medis singkat, seperti standar pelatihan selam.",
        "Tanyakan kursus apa saja yang tersedia selama kamu di sini.",
      ],
    },
  },
  {
    slug: "snorkeling",
    en: {
      title: "Snorkeling",
      summary: "Reef snorkeling for the whole family.",
      chips: ["Whole family", "Shallow reefs"],
      ask: "snorkeling",
      intro: [
        "Many reefs in Raja Ampat start just below the surface, so a mask and snorkel are enough to see corals, schools of reef fish and, with a little luck, a turtle.",
        "It is a relaxed way to enjoy the reef for non-divers, kids, and anyone travelling with divers.",
      ],
      forWho: "Families, non-divers and travel partners of divers.",
      goodToKnow: [
        "You should be able to swim. A flotation vest makes it easier for kids and less confident swimmers.",
        "Use reef-safe sunscreen or wear a rash guard: it protects both your skin and the coral.",
        "Never stand on or touch the coral; float above it.",
      ],
    },
    id: {
      title: "Snorkeling",
      summary: "Snorkeling di karang untuk seluruh keluarga.",
      chips: ["Seluruh keluarga", "Karang dangkal"],
      ask: "snorkeling",
      intro: [
        "Banyak karang di Raja Ampat dimulai tepat di bawah permukaan, jadi masker dan snorkel sudah cukup untuk melihat koral, kawanan ikan karang, dan kalau beruntung, penyu.",
        "Cara santai menikmati karang untuk yang tidak menyelam, anak-anak, dan siapa pun yang bepergian bersama penyelam.",
      ],
      forWho: "Keluarga, yang tidak menyelam, dan teman perjalanan para penyelam.",
      goodToKnow: [
        "Kamu sebaiknya bisa berenang. Rompi pelampung memudahkan anak-anak dan perenang yang kurang percaya diri.",
        "Pakai tabir surya ramah karang atau rash guard: keduanya melindungi kulitmu dan koral.",
        "Jangan pernah berdiri di atas atau menyentuh koral; mengapunglah di atasnya.",
      ],
    },
  },
  {
    slug: "island-trips",
    en: {
      title: "Island trips",
      summary: "Island days around the Dampier Strait.",
      chips: ["Karst islands", "Lagoons"],
      ask: "island trips",
      intro: [
        "There is a lot to see above the water too: white-sand beaches, quiet lagoons and the green karst islands Raja Ampat is famous for.",
        "An island day is a good rest day between dives, or a full day out for travellers who do not dive.",
      ],
      forWho: "Divers on a rest day, families and non-divers.",
      goodToKnow: [
        "Days on the water are sunny and hot: bring a hat, drinking water and reef-safe sunscreen.",
        "Ask us which islands and stops are possible during your stay.",
        "Leave shells, sand and coral where you find them.",
      ],
    },
    id: {
      title: "Trip pulau",
      summary: "Jalan-jalan ke pulau di sekitar Selat Dampier.",
      chips: ["Pulau karst", "Laguna"],
      ask: "trip pulau",
      intro: [
        "Di atas air pun banyak yang bisa dilihat: pantai pasir putih, laguna yang tenang, dan pulau-pulau karst hijau yang membuat Raja Ampat terkenal.",
        "Sehari keliling pulau cocok untuk istirahat di sela penyelaman, atau sehari penuh di laut untuk wisatawan yang tidak menyelam.",
      ],
      forWho: "Penyelam yang sedang libur menyelam, keluarga, dan yang tidak menyelam.",
      goodToKnow: [
        "Hari di laut itu cerah dan panas: bawa topi, air minum, dan tabir surya ramah karang.",
        "Tanyakan pulau dan tempat singgah mana yang bisa dikunjungi selama kamu di sini.",
        "Biarkan kerang, pasir, dan koral tetap di tempatnya.",
      ],
    },
  },
  {
    slug: "dusk-dives",
    en: {
      title: "Dusk dives",
      summary: "Watch mandarinfish pairs rise from the rubble at sunset.",
      chips: ["Sunset", "Mandarinfish"],
      ask: "dusk dives",
      intro: [
        "Our name comes from the dragonets, a family of small reef fish, and the mandarinfish is the most famous of them. At sunset, mandarinfish pairs rise from the coral rubble to dance together for a few minutes.",
        "A dusk dive is the way to see it: a short, calm dive as the light fades and the night reef wakes up.",
      ],
      forWho: "Certified divers, including macro photographers.",
      goodToKnow: [
        "It is a scuba dive, so a certification is needed.",
        "It starts around sunset. See today's sunset time in the live conditions.",
        "Bring a dive light and use it gently: mandarinfish are shy and hide from bright light.",
      ],
    },
    id: {
      title: "Dusk dive",
      summary: "Saksikan pasangan ikan mandarin naik dari pecahan karang saat matahari terbenam.",
      chips: ["Matahari terbenam", "Ikan mandarin"],
      ask: "dusk dive",
      intro: [
        "Nama kami berasal dari dragonet, keluarga ikan karang kecil, dan ikan mandarin adalah anggotanya yang paling terkenal. Saat matahari terbenam, pasangan ikan mandarin naik dari pecahan karang untuk menari berdua selama beberapa menit.",
        "Dusk dive adalah cara untuk menyaksikannya: penyelaman singkat dan tenang saat cahaya meredup dan karang malam mulai terjaga.",
      ],
      forWho: "Penyelam bersertifikat, termasuk fotografer makro.",
      goodToKnow: [
        "Ini penyelaman scuba, jadi perlu sertifikasi.",
        "Dimulai sekitar matahari terbenam. Lihat jam matahari terbenam hari ini di kondisi laut terkini.",
        "Bawa senter selam dan pakai dengan lembut: ikan mandarin pemalu dan bersembunyi dari cahaya terang.",
      ],
    },
  },
];

/** Layanan dalam satu bahasa: { slug, title, summary, chips, ask, intro, forWho, goodToKnow }. */
export const localizeService = (service, lang = "en") => ({ slug: service.slug, ...(service[lang] ?? service.en) });

export const servicesIn = (lang = "en") => services.map((service) => localizeService(service, lang));

export function serviceBySlug(slug, lang = "en") {
  const service = services.find((s) => s.slug === slug);
  return service ? localizeService(service, lang) : null;
}
