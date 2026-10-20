// Daftar layanan lengkap (BRANDING.md §1: fun dive, kursus, snorkeling, trip, ditambah dusk dive
// dari cerita logo). Dipakai grid layanan di beranda dan halaman /services/[slug].
// Isi hanya gambaran umum + hal yang perlu diketahui: belum ada harga, jadwal, nama agensi sertifikasi,
// atau klaim lain yang belum diberikan pemilik. Tambahkan di sini bila datanya sudah ada.

export const services = [
  {
    slug: "fun-dives",
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
  {
    slug: "dive-courses",
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
  {
    slug: "snorkeling",
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
  {
    slug: "island-trips",
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
  {
    slug: "dusk-dives",
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
];

export const serviceBySlug = (slug) => services.find((service) => service.slug === slug) ?? null;
