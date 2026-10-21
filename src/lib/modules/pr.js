// PR & mitra: agen dan mitra usaha (travel agent, OTA, homestay, liveaboard, transportasi, media) dan
// kalender konten media sosial (mengikuti Zanclus content-plan-model).
import { RecordError } from "../records.js";

export const PARTNER_TYPES = [
  ["agent", "Travel agent / partner"],
  ["ota", "OTA (Booking.com, GetYourGuide…)"],
  ["homestay", "Homestay & resort"],
  ["liveaboard", "Liveaboard"],
  ["transport", "Transportasi (kapal, speedboat)"],
  ["media", "Media & influencer"],
  ["community", "Pemerintah & komunitas"],
  ["supplier", "Pemasok"],
  ["other", "Lainnya"],
];

export const partner = {
  kind: "partner",
  prefix: "mtr",
  noun: "mitra",
  fields: [
    { key: "name", label: "Nama agen / mitra", short: "Nama", type: "text", required: true, max: 80, list: true },
    { key: "type", label: "Jenis", type: "select", required: true, options: PARTNER_TYPES, default: "agent", list: true },
    { key: "status", label: "Status", type: "select", required: true, default: "active", options: [["active", "Aktif"], ["prospect", "Prospek"], ["inactive", "Tidak aktif"]], list: true },
    { key: "contactName", label: "Nama kontak", type: "text", max: 80, list: true },
    { key: "phone", label: "WhatsApp / telepon", type: "phone", list: true },
    { key: "email", label: "Email", type: "email" },
    { key: "website", label: "Situs atau media sosial", type: "url", placeholder: "https://" },
    { key: "commission", label: "Komisi (%)", type: "number", decimals: true, min: 0, max: 100, hint: "Kesepakatan dengan mitra ini, bila ada." },
    { key: "lastContact", label: "Terakhir dihubungi", type: "date", list: true },
    { key: "notes", label: "Catatan kerja sama", type: "textarea", max: 2000, wide: true },
  ],
  usedBy: [{ kind: "reservation", key: "partnerId", noun: "reservasi" }],
};

export const PLATFORMS = [
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
  ["facebook", "Facebook"],
  ["youtube", "YouTube"],
  ["website", "Website"],
];
export const FORMATS = [
  ["reel", "Reel / Short"],
  ["foto", "Foto"],
  ["carousel", "Carousel"],
  ["story", "Story"],
  ["video", "Video panjang"],
  ["artikel", "Artikel"],
  ["live", "Live"],
];
export const POST_STATUS = [
  ["idea", "Ide"],
  ["draft", "Draf"],
  ["scheduled", "Terjadwal"],
  ["published", "Tayang"],
  ["evaluated", "Dievaluasi"],
];
export const METRICS = [
  ["views", "Tayangan"],
  ["reach", "Jangkauan"],
  ["likes", "Suka"],
  ["comments", "Komentar"],
  ["saves", "Simpan"],
  ["shares", "Bagikan"],
];

export const post = {
  kind: "post",
  prefix: "knt",
  noun: "konten",
  dateField: "date",
  fields: [
    { key: "date", label: "Tanggal tayang", short: "Tanggal", type: "date", required: true, list: true },
    { key: "time", label: "Jam", type: "time" },
    { key: "title", label: "Judul / ide", short: "Judul", type: "text", required: true, max: 120, list: true },
    { key: "platform", label: "Platform", type: "select", required: true, options: PLATFORMS, default: "instagram", list: true },
    { key: "format", label: "Format", type: "select", required: true, options: FORMATS, default: "reel", list: true },
    { key: "status", label: "Status", type: "select", required: true, options: POST_STATUS, default: "idea", list: true },
    { key: "pic", label: "Penanggung jawab", short: "PJ", type: "text", max: 60, list: true },
    { key: "caption", label: "Caption", type: "textarea", max: 2000, wide: true, rows: 4 },
    { key: "link", label: "Tautan setelah tayang", type: "url", placeholder: "https://" },
    ...METRICS.map(([key, label]) => ({ key, label, type: "number", min: 0, max: 1e9 })),
    { key: "evaluation", label: "Evaluasi", type: "textarea", max: 500, wide: true },
  ],
  check(r) {
    if ((r.status === "published" || r.status === "evaluated") && !r.link) {
      throw new RecordError("Isi tautan kontennya setelah tayang.", "link");
    }
  },
};

/** Ringkasan bulan: rencana vs tayang per platform dan jumlah metrik konten yang sudah tayang. */
export function contentSummary(posts) {
  const live = (p) => p.status === "published" || p.status === "evaluated";
  const platforms = PLATFORMS.map(([key, label]) => ({
    key,
    label,
    planned: posts.filter((p) => p.platform === key).length,
    live: posts.filter((p) => p.platform === key && live(p)).length,
  })).filter((p) => p.planned);
  const metrics = METRICS.map(([key, label]) => ({ key, label, total: posts.filter(live).reduce((s, p) => s + (p[key] ?? 0), 0) }));
  const status = POST_STATUS.map(([key, label]) => ({ key, label, count: posts.filter((p) => p.status === key).length }));
  return { platforms, metrics, status };
}
