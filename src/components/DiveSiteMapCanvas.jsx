"use client";

// Bagian peta interaktif dari DiveSiteMap.jsx. Client component karena prop `tautan` berupa fungsi. Titik,
// wilayah, teks, dan alamat tautan dihitung di server lalu dikirim sebagai prop, jadi teks antarmuka semua
// bahasa (src/content/, src/lib/dive-map.js) tidak ikut ke peramban.
import PetaRajaAmpat from "./peta-raja-ampat/PetaRajaAmpat.jsx";
import "./peta-raja-ampat/peta-raja-ampat.css";

export default function DiveSiteMapCanvas({ bahasa, sites, areas, teks, href }) {
  return <PetaRajaAmpat bahasa={bahasa} tanda={sites} wilayah={areas} judul={false} teks={teks} tautan={() => href} className="peta-dragonet" />;
}
