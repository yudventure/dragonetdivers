import { notFound } from "next/navigation";

// Alamat yang tidak ada di bawah /en atau /id: tampilkan 404 dalam bahasanya (app/[lang]/not-found.jsx),
// lengkap dengan header dan footer situs.
export default function Missing() {
  notFound();
}
