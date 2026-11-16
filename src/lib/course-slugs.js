// Alamat halaman kursus selam di bawah /services/dive-courses (permintaan pemilik 16 November 2026), urut seperti
// daftar pemilik: Open Water, Advanced Open Water, React Right, Diver Stress & Rescue, Divemaster. Tanpa teks,
// jadi bisa dipakai sitemap dan mode developer tanpa memuat isi kursus. Isinya di src/content/courses.js.
export const COURSES_SERVICE = "dive-courses";

export const COURSE_SLUGS = ["open-water-diver", "advanced-open-water-diver", "react-right", "diver-stress-and-rescue", "divemaster"];

export const isCourseSlug = (slug) => COURSE_SLUGS.includes(slug);

/** Alamat halaman kursus tanpa awalan bahasa, mis. /services/dive-courses/open-water-diver. */
export const coursePath = (slug) => `/services/${COURSES_SERVICE}/${slug}`;
