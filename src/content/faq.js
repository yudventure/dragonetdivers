// Pertanyaan yang sering ditanyakan (seksi FAQ di beranda, di bawah "How to get here").
// Fakta umum dicek ke sumber terbuka (Oktober 2026): musim terbaik Oktober–April dan suhu air
// 27–30 °C (panduan selam Raja Ampat), sedikit ATM dan kartu jarang diterima (indonesia.travel),
// jeda terbang setelah menyelam (Divers Alert Network). Tanpa harga, jadwal, atau klaim bisnis yang
// belum diberikan pemilik (CLAUDE.md). Jawaban berupa teks biasa; `link` opsional; `rate: true`
// menambahkan kurs US$ ke Rupiah hari ini di bawah jawabannya (src/server/exchange-rate.js).
// English (en) dan Bahasa Indonesia (id) berurutan sama; tests/i18n.test.js memeriksa jumlah dan tautannya.
import * as koPack from "./locales/ko.js";
import * as zhPack from "./locales/zh.js";
const en = [
  {
    q: "Do I need to be a certified diver?",
    a: "For fun dives you need an entry-level scuba certification, such as Open Water, or an equivalent. If you have never dived before, start with one of our dive courses, or join a snorkeling trip and see the reefs from the surface.",
  },
  {
    q: "Can non-divers come along?",
    a: "Yes. Snorkeling and island trips are made for non-divers, and many sites in the Dampier Strait have shallow reefs and jetties that are lovely to snorkel.",
  },
  {
    q: "When is the best time to visit?",
    a: "Raja Ampat can be dived all year. October to April usually brings the calmest seas, and December to April is when manta rays gather most often at the cleaning stations in the Dampier Strait. From June to September the wind picks up and the sea can be rougher.",
  },
  {
    q: "How warm is the water?",
    a: "Around 27 to 30 °C most of the year, so a 3 mm wetsuit is enough for most divers. The live sea conditions panel at the top of this page shows today's sea surface temperature.",
  },
  {
    q: "Do I need a permit to dive in Raja Ampat?",
    a: "Yes. Every visitor needs a Raja Ampat Marine Park entry card before entering the protected waters. It is sold at the marine park office in Waisai and is valid for 12 months.",
    link: { href: "https://kkprajaampat.com/en/entry-card/", label: "Entry card details" },
  },
  {
    q: "What should I bring?",
    a: "Your certification card and logbook if you dive, reef-safe sunscreen, a light jacket for boat rides, and enough cash in Indonesian rupiah. There are very few ATMs in Raja Ampat and most places do not take cards.",
    rate: true,
  },
  {
    q: "How long should I wait before flying after diving?",
    a: "Divers Alert Network recommends at least 12 hours after a single dive and at least 18 hours after several dives a day or several days of diving. Plan a dive-free day before your flight out of Sorong.",
    link: { href: "https://dan.org/health-medicine/health-resource/health-safety-guidelines/guidelines-for-flying-after-diving/", label: "DAN guidelines" },
  },
  {
    q: "Do I need dive insurance?",
    a: "We strongly recommend travel insurance that covers scuba diving, including medical evacuation, since Raja Ampat is remote and getting to a hospital can take a long time.",
  },
];

const id = [
  {
    q: "Apakah saya harus bersertifikat selam?",
    a: "Untuk fun dive kamu perlu sertifikasi selam tingkat dasar, seperti Open Water, atau yang setara. Kalau belum pernah menyelam, mulai dengan salah satu kursus selam kami, atau ikut trip snorkeling dan nikmati karang dari permukaan.",
  },
  {
    q: "Apakah yang tidak menyelam boleh ikut?",
    a: "Boleh. Snorkeling dan trip pulau memang dibuat untuk yang tidak menyelam, dan banyak titik di Selat Dampier punya karang dangkal dan dermaga yang asyik untuk snorkeling.",
  },
  {
    q: "Kapan waktu terbaik untuk datang?",
    a: "Raja Ampat bisa diselami sepanjang tahun. Oktober sampai April biasanya lautnya paling tenang, dan Desember sampai April pari manta paling sering berkumpul di cleaning station Selat Dampier. Juni sampai September angin lebih kencang dan laut bisa lebih berombak.",
  },
  {
    q: "Seberapa hangat airnya?",
    a: "Sekitar 27 sampai 30 °C hampir sepanjang tahun, jadi wetsuit 3 mm sudah cukup untuk kebanyakan penyelam. Panel kondisi laut di bagian atas halaman ini menunjukkan suhu permukaan laut hari ini.",
  },
  {
    q: "Apakah perlu izin untuk menyelam di Raja Ampat?",
    a: "Ya. Setiap pengunjung wajib punya kartu masuk Kawasan Konservasi Perairan Raja Ampat sebelum memasuki perairan yang dilindungi. Kartu dijual di kantor pengelola di Waisai dan berlaku 12 bulan.",
    link: { href: "https://kkprajaampat.com/en/entry-card/", label: "Detail kartu masuk" },
  },
  {
    q: "Apa saja yang perlu dibawa?",
    a: "Kartu sertifikasi dan logbook kalau kamu menyelam, tabir surya ramah karang, jaket tipis untuk perjalanan perahu, dan uang tunai rupiah yang cukup. ATM di Raja Ampat sangat sedikit dan kebanyakan tempat tidak menerima kartu.",
    rate: true,
  },
  {
    q: "Berapa lama harus menunggu sebelum terbang setelah menyelam?",
    a: "Divers Alert Network menyarankan minimal 12 jam setelah satu kali penyelaman dan minimal 18 jam setelah beberapa penyelaman sehari atau menyelam beberapa hari berturut-turut. Sisakan satu hari tanpa menyelam sebelum penerbanganmu dari Sorong.",
    link: { href: "https://dan.org/health-medicine/health-resource/health-safety-guidelines/guidelines-for-flying-after-diving/", label: "Panduan DAN" },
  },
  {
    q: "Apakah perlu asuransi selam?",
    a: "Kami sangat menyarankan asuransi perjalanan yang menanggung selam scuba, termasuk evakuasi medis, karena Raja Ampat terpencil dan perjalanan ke rumah sakit bisa memakan waktu lama.",
  },
];

export const faqs = { en, id, zh: zhPack.faq, ko: koPack.faq };
