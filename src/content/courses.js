// Kursus selam SSI di halaman /services/dive-courses dan halaman tiap kursus /services/dive-courses/<slug>
// (permintaan pemilik 16 November 2026, isi dari dokumen pemilik "SSI Diving Courses Website"). English (en) dan
// Bahasa Indonesia (id) di sini, Mandarin dan Korea di src/content/locales/zh.js dan ko.js (courses), bentuknya
// sama persis (diuji tests/courses.test.js dan tests/locales.test.js). Hanya dipakai di server.
// Isi mengikuti dokumen pemilik, tanpa harga dan jadwal tambahan. Tulisan tampil tanpa titik dua, titik koma,
// dan tanda pisah panjang (aturan pemilik).
// minAge (angka, untuk kartu kursus) di luar bahasa. Bentuk tiap bahasa: name, short, level, tagline, summary (kartu), intro[], overview?, facts [[label, nilai]],
// notes[], learn[] (teks, atau { title, tag?, text }), structure[] ({ title?, text }), certification,
// requirements?, closing? ({ title, text, slogan }).
import * as koPack from "./locales/ko.js";
import * as zhPack from "./locales/zh.js";
import { COURSE_SLUGS } from "../lib/course-slugs.js";

export const courses = [
  {
    slug: "open-water-diver",
    minAge: 10,
    en: {
      name: "SSI Open Water Diver",
      short: "Open Water Diver",
      level: "Beginner",
      tagline: "Become a certified diver",
      summary:
        "Your gateway to the underwater world. Learn the essential skills to dive with a certified buddy to 18 meters, on the coral reefs of Raja Ampat.",
      intro: [
        "Discover the incredible underwater world of Raja Ampat and become an internationally certified scuba diver with the SSI Open Water Diver course.",
        "Whether you have never dived before or have already tried an introductory dive, this course is your gateway to exploring the ocean with confidence, knowledge and essential diving skills. Learn to dive in one of the most biodiverse marine environments on Earth, surrounded by spectacular coral reefs and tropical marine life.",
      ],
      overview:
        "The SSI Open Water Diver program is an internationally recognized scuba diving certification that allows you to dive with a certified buddy, without professional supervision, within your training and experience limits, to a maximum depth of 18 meters. Our experienced SSI instructors guide you through every step of your training.",
      facts: [
        ["Certification", "SSI Open Water Diver"],
        ["Duration", "2.5 to 3 days (estimated)"],
        ["Minimum age", "10 years"],
        ["Maximum depth", "18 meters*"],
        ["Training dives", "At least 4 open water dives"],
        ["Experience required", "Basic swimming ability and comfort in the water"],
        ["Location", "Raja Ampat, Indonesia"],
      ],
      notes: ["*Junior divers follow age-specific depth and supervision limits. Ages 10 and 11 dive to a maximum of 12 meters."],
      learn: [
        "Basic scuba diving theory and principles",
        "Understanding and using scuba diving equipment",
        "Underwater breathing and buoyancy control",
        "Underwater skill exercises with scuba equipment",
        "Underwater communication and buddy procedures",
        "Dive planning and air management",
        "Essential safety and emergency procedures",
        "Responsible diving and marine conservation",
      ],
      structure: [
        {
          title: "Digital learning and academic sessions",
          text: "Complete your SSI digital learning materials and build your understanding of diving theory, equipment, physiology and safety procedures through the SSI online learning system.",
        },
        {
          title: "Confined water training",
          text: "Practise essential scuba diving skills in shallow, controlled water and build your confidence before you move on to open water dives.",
        },
        {
          title: "Open water training dives",
          text: "Complete at least four open water training dives, applying your knowledge and skills while exploring the beautiful coral reefs of Raja Ampat.",
        },
      ],
      certification:
        "Once you complete all academic, water skills and open water training requirements, you receive your internationally recognized SSI Open Water Diver digital certification.",
      requirements:
        "Participants must be comfortable in the water, meet the SSI swimming and water fitness requirements and complete the required diving medical questionnaire. Medical clearance may be required depending on your health.",
      closing: {
        title: "Start your diving adventure",
        text: "Take your first breath underwater and discover a whole new world beneath the surface. Join our SSI Open Water Diver course in Raja Ampat and begin a lifetime of underwater adventures.",
        slogan: "Learn. Explore. Discover. Become a diver.",
      },
    },
    id: {
      name: "SSI Open Water Diver",
      short: "Open Water Diver",
      level: "Pemula",
      tagline: "Jadi penyelam bersertifikat",
      summary:
        "Gerbangmu ke dunia bawah laut. Pelajari keterampilan dasar untuk menyelam bersama buddy bersertifikat sampai 18 meter, di terumbu karang Raja Ampat.",
      intro: [
        "Jelajahi dunia bawah laut Raja Ampat yang luar biasa dan jadilah penyelam scuba bersertifikat internasional lewat kursus SSI Open Water Diver.",
        "Entah kamu belum pernah menyelam atau sudah mencoba introductory dive, kursus ini adalah gerbangmu untuk menjelajahi laut dengan percaya diri, pengetahuan, dan keterampilan selam yang penting. Belajar menyelam di salah satu lingkungan laut dengan keanekaragaman hayati tertinggi di Bumi, dikelilingi terumbu karang yang memukau dan kehidupan laut tropis.",
      ],
      overview:
        "Program SSI Open Water Diver adalah sertifikasi selam scuba yang diakui secara internasional. Dengan sertifikat ini kamu boleh menyelam bersama buddy bersertifikat tanpa pengawasan profesional, sesuai batas pelatihan dan pengalamanmu, sampai kedalaman maksimal 18 meter. Instruktur SSI kami yang berpengalaman membimbingmu di setiap langkah pelatihan.",
      facts: [
        ["Sertifikasi", "SSI Open Water Diver"],
        ["Lama kursus", "2,5 sampai 3 hari (perkiraan)"],
        ["Usia minimal", "10 tahun"],
        ["Kedalaman maksimal", "18 meter*"],
        ["Penyelaman latihan", "Minimal 4 penyelaman di laut terbuka"],
        ["Pengalaman yang dibutuhkan", "Bisa berenang dasar dan nyaman di air"],
        ["Lokasi", "Raja Ampat, Indonesia"],
      ],
      notes: ["*Penyelam junior mengikuti batas kedalaman dan pengawasan sesuai usia. Usia 10 dan 11 tahun menyelam sampai maksimal 12 meter."],
      learn: [
        "Teori dan prinsip dasar selam scuba",
        "Mengenal dan memakai peralatan selam scuba",
        "Bernapas di bawah air dan mengatur daya apung",
        "Latihan keterampilan di bawah air dengan peralatan scuba",
        "Komunikasi bawah air dan prosedur buddy",
        "Perencanaan penyelaman dan pengelolaan udara",
        "Prosedur keselamatan dan keadaan darurat yang penting",
        "Menyelam secara bertanggung jawab dan konservasi laut",
      ],
      structure: [
        {
          title: "Belajar digital dan sesi teori",
          text: "Selesaikan materi belajar digital SSI dan pahami teori selam, peralatan, fisiologi, dan prosedur keselamatan lewat sistem belajar online SSI.",
        },
        {
          title: "Latihan di air dangkal",
          text: "Latih keterampilan selam scuba yang penting di air dangkal yang terkendali, dan bangun rasa percaya diri sebelum lanjut ke penyelaman di laut terbuka.",
        },
        {
          title: "Penyelaman latihan di laut terbuka",
          text: "Selesaikan minimal empat penyelaman latihan di laut terbuka, menerapkan pengetahuan dan keterampilanmu sambil menjelajahi terumbu karang Raja Ampat yang indah.",
        },
      ],
      certification:
        "Setelah semua syarat teori, keterampilan di air, dan latihan di laut terbuka selesai, kamu menerima sertifikasi digital SSI Open Water Diver yang diakui secara internasional.",
      requirements:
        "Peserta harus nyaman di air, memenuhi syarat renang dan kebugaran air SSI, dan mengisi kuesioner medis selam. Persetujuan dokter mungkin diperlukan, tergantung kondisi kesehatanmu.",
      closing: {
        title: "Mulai petualangan selammu",
        text: "Ambil napas pertamamu di bawah air dan temukan dunia baru di bawah permukaan. Ikuti kursus SSI Open Water Diver kami di Raja Ampat dan mulailah petualangan bawah laut seumur hidup.",
        slogan: "Belajar. Jelajahi. Temukan. Jadilah penyelam.",
      },
    },
  },
  {
    slug: "advanced-open-water-diver",
    minAge: 12,
    en: {
      name: "SSI Advanced Open Water Diver",
      short: "Advanced Open Water Diver",
      level: "Next step",
      tagline: "Explore more. Dive deeper.",
      summary:
        "Expand your diving horizons with five training dives, including Deep Diving and Navigation plus three electives. Explore Raja Ampat with more confidence and dive to 30 meters within your training limits. Junior limits apply.",
      intro: [
        "Build on your Open Water certification and discover new diving experiences in Raja Ampat. This practical course introduces five specialty areas and develops your confidence in a variety of underwater environments.",
      ],
      facts: [
        ["Certification", "SSI Advanced Open Water Diver"],
        ["Minimum age", "12 years"],
        ["Training dives", "5"],
        ["Maximum depth", "30 meters (ages 12 to 14, 21 meters)"],
        ["Prerequisite", "Open Water Diver certification or equivalent"],
      ],
      notes: [],
      learn: [
        { title: "Deep Diving", tag: "Mandatory", text: "Develop depth awareness and dive planning on a boat dive." },
        { title: "Navigation", tag: "Mandatory", text: "Practise compass and natural navigation on the house reef." },
        {
          title: "Three electives",
          tag: "Your choice",
          text: "Choose from Marine Ecology, Night and Limited Visibility, Wreck Diving, Perfect Buoyancy, or Waves, Tides and Currents.",
        },
      ],
      structure: [
        {
          text: "Complete digital learning, instructor briefings and one training dive in each of the five selected areas. Elective availability depends on conditions and instructor approval. Wreck training may involve an additional boat fuel charge.",
        },
      ],
      certification:
        "Earn the SSI Advanced Open Water Diver certification. Each training dive may count toward the matching full specialty. This course does not award five separate specialty certifications.",
    },
    id: {
      name: "SSI Advanced Open Water Diver",
      short: "Advanced Open Water Diver",
      level: "Langkah berikutnya",
      tagline: "Jelajahi lebih jauh. Menyelam lebih dalam.",
      summary:
        "Perluas cakrawala selammu dengan lima penyelaman latihan, termasuk Deep Diving dan Navigation ditambah tiga pilihan. Jelajahi Raja Ampat dengan lebih percaya diri dan menyelam sampai 30 meter sesuai batas pelatihanmu. Berlaku batas untuk penyelam junior.",
      intro: [
        "Lanjutkan dari sertifikasi Open Water dan temukan pengalaman menyelam baru di Raja Ampat. Kursus praktis ini memperkenalkan lima bidang spesialisasi dan membangun rasa percaya dirimu di berbagai lingkungan bawah air.",
      ],
      facts: [
        ["Sertifikasi", "SSI Advanced Open Water Diver"],
        ["Usia minimal", "12 tahun"],
        ["Penyelaman latihan", "5"],
        ["Kedalaman maksimal", "30 meter (usia 12 sampai 14 tahun, 21 meter)"],
        ["Syarat", "Sertifikasi Open Water Diver atau setara"],
      ],
      notes: [],
      learn: [
        { title: "Deep Diving", tag: "Wajib", text: "Melatih kesadaran kedalaman dan perencanaan penyelaman dalam penyelaman dari perahu." },
        { title: "Navigation", tag: "Wajib", text: "Berlatih navigasi kompas dan navigasi alami di house reef." },
        {
          title: "Tiga pilihan",
          tag: "Pilihanmu",
          text: "Pilih dari Marine Ecology, Night and Limited Visibility, Wreck Diving, Perfect Buoyancy, atau Waves, Tides and Currents.",
        },
      ],
      structure: [
        {
          text: "Selesaikan belajar digital, pengarahan dari instruktur, dan satu penyelaman latihan di setiap lima bidang yang dipilih. Ketersediaan pilihan bergantung pada kondisi dan persetujuan instruktur. Latihan wreck mungkin dikenai biaya bahan bakar perahu tambahan.",
        },
      ],
      certification:
        "Dapatkan sertifikasi SSI Advanced Open Water Diver. Setiap penyelaman latihan bisa dihitung untuk spesialisasi penuh yang sesuai. Kursus ini tidak memberikan lima sertifikasi spesialisasi terpisah.",
    },
  },
  {
    slug: "react-right",
    minAge: 12,
    en: {
      name: "SSI React Right",
      short: "React Right",
      level: "First aid",
      tagline: "Be prepared to respond",
      summary:
        "Learn essential first aid, CPR, AED use and emergency oxygen administration. An excellent companion to rescue diver training and a valuable skill set beyond diving.",
      intro: [
        "Develop essential emergency first response skills for diving and everyday life. React Right combines practical training with emergency care knowledge, helping you respond confidently while professional medical help is arranged.",
      ],
      facts: [
        ["Certification", "SSI React Right"],
        ["Minimum age", "12 years"],
        ["Prerequisite", "No scuba certification needed"],
        ["Training", "On land"],
        ["Duration", "Depends on the modules you choose"],
      ],
      notes: [],
      learn: [
        { title: "First Aid", text: "Assess an incident and provide initial care." },
        { title: "CPR", text: "Practise cardiopulmonary resuscitation." },
        { title: "AED", text: "Learn to use an automated external defibrillator." },
        { title: "Oxygen administration", text: "Practise emergency oxygen delivery for diving incidents." },
      ],
      structure: [
        {
          text: "Complete the academic material and hands-on emergency scenarios for the modules you choose. Training can be combined with Diver Stress & Rescue.",
        },
      ],
      certification:
        "Receive the SSI React Right certification for the modules you complete successfully. Emergency care credentials generally need renewing every two years.",
    },
    id: {
      name: "SSI React Right",
      short: "React Right",
      level: "Pertolongan pertama",
      tagline: "Siap bertindak saat dibutuhkan",
      summary:
        "Pelajari pertolongan pertama, CPR, penggunaan AED, dan pemberian oksigen darurat. Pendamping yang sangat baik untuk pelatihan penyelam penyelamat, dan keterampilan berharga di luar dunia selam.",
      intro: [
        "Kembangkan keterampilan tanggap darurat yang penting untuk menyelam dan kehidupan sehari-hari. React Right menggabungkan latihan praktik dengan pengetahuan perawatan darurat, supaya kamu bisa bertindak dengan percaya diri sambil menunggu bantuan medis profesional.",
      ],
      facts: [
        ["Sertifikasi", "SSI React Right"],
        ["Usia minimal", "12 tahun"],
        ["Syarat", "Tidak perlu sertifikasi selam"],
        ["Latihan", "Di darat"],
        ["Lama kursus", "Tergantung modul yang dipilih"],
      ],
      notes: [],
      learn: [
        { title: "First Aid", text: "Menilai kejadian dan memberi pertolongan awal." },
        { title: "CPR", text: "Berlatih resusitasi jantung paru." },
        { title: "AED", text: "Belajar memakai defibrilator eksternal otomatis." },
        { title: "Pemberian oksigen", text: "Berlatih memberi oksigen darurat untuk kecelakaan selam." },
      ],
      structure: [
        {
          text: "Selesaikan materi teori dan skenario darurat praktik untuk modul yang dipilih. Pelatihan bisa digabung dengan Diver Stress & Rescue.",
        },
      ],
      certification:
        "Terima sertifikasi SSI React Right untuk modul yang berhasil kamu selesaikan. Sertifikat perawatan darurat umumnya perlu diperbarui setiap dua tahun.",
    },
  },
  {
    slug: "diver-stress-and-rescue",
    minAge: 12,
    en: {
      name: "SSI Diver Stress & Rescue",
      short: "Diver Stress & Rescue",
      level: "Rescue",
      tagline: "Become a safer, more confident diver",
      summary:
        "Learn to prevent accidents, manage diver stress and respond to underwater emergencies. Build confidence through practical rescue exercises and become a more capable dive buddy.",
      intro: [
        "Learn to recognize stress, prevent diving accidents and respond effectively when a diver needs help. Develop practical rescue skills in confined water and in realistic open water scenarios.",
      ],
      facts: [
        ["Certification", "SSI Diver Stress & Rescue"],
        ["Minimum age", "12 years"],
        ["Training sessions", "3 in confined water and 3 in open water"],
        ["Maximum training depth", "18 meters, junior limits apply"],
        ["Prerequisite", "Open Water Diver certification or equivalent, and valid first aid training from the last two years"],
      ],
      notes: [],
      learn: [
        "Recognize and manage physical and psychological stress",
        "Practise self-rescue, helping tired or panicked divers, and emergency ascents",
        "Practise searching for a missing diver, assisting an unresponsive diver and coordinating an emergency response",
      ],
      structure: [
        {
          text: "Complete digital theory, confined water skill practice and open water rescue scenarios. Your instructor assesses your knowledge and practical performance. React Right can be arranged to meet the emergency care prerequisite.",
        },
      ],
      certification: "Earn the SSI Diver Stress & Rescue specialty certification and build a foundation for professional diver training.",
    },
    id: {
      name: "SSI Diver Stress & Rescue",
      short: "Diver Stress & Rescue",
      level: "Penyelamatan",
      tagline: "Jadi penyelam yang lebih aman dan percaya diri",
      summary:
        "Belajar mencegah kecelakaan, mengelola stres saat menyelam, dan menangani keadaan darurat di bawah air. Bangun rasa percaya diri lewat latihan penyelamatan praktis dan jadilah buddy yang lebih andal.",
      intro: [
        "Belajar mengenali stres, mencegah kecelakaan selam, dan bertindak tepat saat ada penyelam yang butuh bantuan. Kembangkan keterampilan penyelamatan praktis di air dangkal dan dalam skenario laut terbuka yang realistis.",
      ],
      facts: [
        ["Sertifikasi", "SSI Diver Stress & Rescue"],
        ["Usia minimal", "12 tahun"],
        ["Sesi latihan", "3 di air dangkal dan 3 di laut terbuka"],
        ["Kedalaman latihan maksimal", "18 meter, berlaku batas penyelam junior"],
        ["Syarat", "Sertifikasi Open Water Diver atau setara, dan pelatihan pertolongan pertama yang masih berlaku dalam dua tahun terakhir"],
      ],
      notes: [],
      learn: [
        "Mengenali dan mengelola stres fisik dan psikologis",
        "Berlatih menyelamatkan diri sendiri, membantu penyelam yang kelelahan atau panik, dan naik darurat",
        "Berlatih mencari penyelam yang hilang, membantu penyelam yang tidak sadar, dan mengoordinasikan tanggap darurat",
      ],
      structure: [
        {
          text: "Selesaikan teori digital, latihan keterampilan di air dangkal, dan skenario penyelamatan di laut terbuka. Instruktur menilai pengetahuan dan kemampuan praktikmu. React Right bisa diatur untuk memenuhi syarat perawatan darurat.",
        },
      ],
      certification: "Dapatkan sertifikasi spesialisasi SSI Diver Stress & Rescue dan bangun dasar untuk pelatihan penyelam profesional.",
    },
  },
  {
    slug: "divemaster",
    minAge: 18,
    en: {
      name: "SSI Divemaster",
      short: "Divemaster",
      level: "Professional",
      tagline: "Turn your passion into a profession",
      summary:
        "Begin your professional diving journey in Raja Ampat. Develop leadership, guiding and dive supervision skills through practical training and supervised dive operations. Entry and certification prerequisites apply.",
      intro: [
        "Take the next step toward a professional diving career in Raja Ampat. Develop leadership, dive supervision and guiding skills while learning to support recreational diver training and safe dive operations.",
      ],
      facts: [
        ["Certification", "SSI Divemaster"],
        ["Minimum age", "18 years"],
        ["Entry", "40 logged open water dives and 25 hours of dive time"],
        ["Prerequisite", "Diver Stress & Rescue certification or equivalent"],
        ["Also required", "Professional medical and emergency care requirements"],
      ],
      notes: [],
      learn: [
        "Dive briefings, site assessment, dive planning and group management",
        "Professional level demonstration skills, rescue readiness and diver supervision",
        "Dive leadership, environmental awareness and responsible reef practices",
        "Science of Diving, professional standards and the responsibilities of a certified assistant",
      ],
      structure: [
        {
          text: "Our proposed training schedule is five training days plus three days of supervised fun dive leadership practice. Candidates must show experience or qualifying specialty training in Deep Diving (deeper than 30 meters), Navigation, and Night and Limited Visibility. Additional training or logged dives may be needed.",
        },
      ],
      certification:
        "Professional certification requires completing all SSI assessments and the Science of Diving requirements, at least 60 logged open water dives totalling 40 hours, and the applicable active status requirements. Qualified active status Divemasters may guide certified divers and assist with authorized training.",
    },
    id: {
      name: "SSI Divemaster",
      short: "Divemaster",
      level: "Profesional",
      tagline: "Jadikan hobimu sebuah profesi",
      summary:
        "Mulai perjalanan selam profesionalmu di Raja Ampat. Kembangkan keterampilan memimpin, memandu, dan mengawasi penyelaman lewat pelatihan praktik dan operasi selam yang diawasi. Berlaku syarat masuk dan syarat sertifikasi.",
      intro: [
        "Ambil langkah berikutnya menuju karier selam profesional di Raja Ampat. Kembangkan keterampilan memimpin, mengawasi penyelaman, dan memandu, sambil belajar mendukung pelatihan penyelam rekreasi dan operasi selam yang aman.",
      ],
      facts: [
        ["Sertifikasi", "SSI Divemaster"],
        ["Usia minimal", "18 tahun"],
        ["Syarat masuk", "40 penyelaman laut terbuka tercatat dan 25 jam waktu menyelam"],
        ["Syarat", "Sertifikasi Diver Stress & Rescue atau setara"],
        ["Juga diperlukan", "Syarat medis dan perawatan darurat untuk profesional"],
      ],
      notes: [],
      learn: [
        "Pengarahan penyelaman, penilaian lokasi, perencanaan penyelaman, dan pengelolaan grup",
        "Keterampilan demonstrasi tingkat profesional, kesiapan menyelamatkan, dan pengawasan penyelam",
        "Kepemimpinan penyelaman, kesadaran lingkungan, dan praktik menjaga terumbu karang",
        "Science of Diving, standar profesional, dan tanggung jawab asisten bersertifikat",
      ],
      structure: [
        {
          text: "Jadwal pelatihan yang kami usulkan adalah lima hari pelatihan ditambah tiga hari latihan memimpin fun dive dengan pengawasan. Calon harus menunjukkan pengalaman atau pelatihan spesialisasi yang memenuhi syarat di Deep Diving (lebih dari 30 meter), Navigation, dan Night and Limited Visibility. Pelatihan atau penyelaman tercatat tambahan mungkin diperlukan.",
        },
      ],
      certification:
        "Sertifikasi profesional mensyaratkan semua penilaian SSI dan syarat Science of Diving selesai, minimal 60 penyelaman laut terbuka tercatat dengan total 40 jam, dan syarat status aktif yang berlaku. Divemaster berstatus aktif yang memenuhi syarat boleh memandu penyelam bersertifikat dan membantu pelatihan yang diizinkan.",
    },
  },
];

// Mandarin dan Korea dari src/content/locales/, berkunci slug.
for (const course of courses) {
  course.zh = zhPack.courses[course.slug];
  course.ko = koPack.courses[course.slug];
}

if (courses.map((c) => c.slug).join() !== COURSE_SLUGS.join()) throw new Error("COURSE_SLUGS tidak sama dengan isi kursus");

/** Kursus dalam satu bahasa: { slug, minAge, name, short, level, ... }. */
export const localizeCourse = (course, lang = "en") => ({ slug: course.slug, minAge: course.minAge, ...(course[lang] ?? course.en) });

export const coursesIn = (lang = "en") => courses.map((course) => localizeCourse(course, lang));

export function courseBySlug(slug, lang = "en") {
  const course = courses.find((c) => c.slug === slug);
  return course ? localizeCourse(course, lang) : null;
}
