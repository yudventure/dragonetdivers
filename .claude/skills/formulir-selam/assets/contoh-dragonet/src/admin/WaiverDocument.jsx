import Image from "next/image";
import logo from "../../brand/logo/dragonet-divers-logo.png";
import { uiText } from "@/content/ui";
import { agreementBlocks, boxItems, emergencyOf, MEDICAL } from "@/lib/waiver";
import { displayPhone, DOC_LANGUAGES, docDate, docTime } from "@/lib/waiver-document";

// Cetak tanpa margin halaman, supaya peramban tidak menambahkan tanggal, judul, dan alamat web di atas dan
// bawah tiap lembar (terlihat di cetakan pemilik 11 November 2026). Jarak tepi dibuat sendiri: thead dan tfoot
// tabel di bawah diulang peramban di setiap halaman, tfoot berisi nomor surat, nama, dan negara.
const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 0; }
  html, body { background: #fff !important; }
  .waiver-doc { width: 210mm !important; box-shadow: none !important; border-radius: 0 !important; outline: 0 !important; }
  .waiver-doc, .waiver-doc * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
.waiver-doc h2, .waiver-doc h3 { break-after: avoid; }
.waiver-doc .keep { break-inside: avoid; }
`;

const LABEL = "text-[6.6pt] font-bold tracking-[0.14em] text-slate uppercase";

/** Judul bagian dengan garis tipis, seperti kotak di contoh waiver. */
const Section = ({ title, aside, children, className = "" }) => (
  <section className={`mt-[4.5mm] rounded-[2mm] px-[4mm] pt-[3mm] pb-[3.5mm] ring-1 ring-mist [-webkit-box-decoration-break:clone] [box-decoration-break:clone] ${className}`}>
    <div className="mb-[2mm] flex items-baseline justify-between gap-4">
      <h2 className="font-display text-[10.5pt] leading-tight font-semibold text-teal">{title}</h2>
      {aside}
    </div>
    {children}
  </section>
);

/** Baris keterangan: label di kiri, isi tebal di kanan. Kosong ditampilkan sebagai tanda pisah pendek. */
const Rows = ({ items }) => (
  <dl className="grid">
    {items.map(([label, value]) => (
      <div key={label} className="grid grid-cols-[30mm_1fr] gap-[3mm] border-b border-mist/70 py-[1.1mm] last:border-0">
        <dt className="text-[7.6pt] text-slate">{label}</dt>
        <dd className="text-[8.2pt] font-semibold break-words text-abyss">{value === "" || value == null ? "–" : value}</dd>
      </div>
    ))}
  </dl>
);

const Answer = ({ yes }) => (
  <span className={`inline-block w-[9mm] text-right text-[7.6pt] font-bold ${yes ? "text-ember" : "text-teal"}`}>{yes ? "YES" : "NO"}</span>
);

/** Garis isian tanda tangan: isi di atas garis, keterangan kecil di bawahnya (seperti formulir kertas). */
const Line = ({ label, children, className = "" }) => (
  <div className={`grid content-end gap-[1.2mm] ${className}`}>
    <div className="min-h-[6mm] border-b-[1.2px] border-abyss pb-[1mm] text-[9pt] font-semibold text-abyss">{children}</div>
    <p className="text-[7pt] text-slate">{label}</p>
  </div>
);

/**
 * Formulir selam sebagai dokumen A4 bermerek Dragonet Divers (kop: logo, nama, alamat, judul perjanjian, nomor
 * surat), dipakai di /admin/formulir/<kode> sebagai pratinjau dan untuk dicetak atau disimpan sebagai PDF.
 * Isi mengikuti contoh waiver pemilik: data peserta, profil penyelam dan asuransi, kuesioner medis dengan jawaban
 * YES/NO, teks perjanjian yang dibaca dan disetujui tamu (bahasa formulirnya), lalu blok tanda tangan. Judul dan
 * label English (dokumen untuk tamu mancanegara); pertanyaan medis juga dalam bahasa formulir bila bukan English.
 * w = waiverByCode, contact = { address: [baris], email, whatsapp }, host = domain website.
 */
export default function WaiverDocument({ w, contact, host }) {
  const d = w.data ?? {};
  const en = uiText("en").waiver;
  const own = w.lang !== "en" ? uiText(w.lang).waiver : null;
  const signedDate = docDate(w.createdAt);
  const signedTime = docTime(w.createdAt);
  const language = DOC_LANGUAGES[w.lang] ?? w.lang;
  const certified = d.certified !== false;
  const emergency = emergencyOf(d);
  const signer = w.minor ? d.guardian : w.name;
  const insurance = d.insurance === "yes" ? `Yes${d.insurer ? `, ${d.insurer}` : ""}` : d.insurance === "no" ? "No" : "Not answered";

  return (
    <article className="waiver-doc mx-auto w-[210mm] min-w-[210mm] bg-white font-sans text-abyss shadow-[0_10px_40px_-12px_rgb(10_50_59/0.25)] ring-1 ring-mist">
      <style>{PRINT_CSS}</style>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <td className="p-0">
              <div className="h-[11mm]" />
            </td>
          </tr>
        </thead>
        <tfoot>
          <tr>
            <td className="p-0">
              <div className="mx-[14mm] mt-[4mm] flex h-[13mm] items-start justify-between gap-4 border-t border-mist pt-[2.2mm] text-[6.8pt] text-slate">
                <span>Dragonet Divers Raja Ampat · Diving waiver and liability release</span>
                <span className="text-right">
                  <span className="font-mono font-semibold text-abyss">{w.code}</span> · {w.name} · {w.nationality}
                </span>
              </div>
            </td>
          </tr>
        </tfoot>
        <tbody>
          <tr>
            <td className="px-[14mm] py-0 align-top">
              {/* Kop */}
              <header className="flex items-start gap-[4.5mm]">
                <Image src={logo} alt="Dragonet Divers Raja Ampat" width={80} height={80} priority className="size-[20mm] shrink-0" />
                <div className="grid min-w-0 flex-1 gap-[0.9mm] pt-[0.5mm]">
                  <p className="text-[8.6pt] font-bold tracking-[0.24em] text-ember">DRAGONET DIVERS · RAJA AMPAT</p>
                  <p className="text-[7.6pt] font-semibold text-lagoon">{contact.address.join(", ")}</p>
                  <h1 className="font-display text-[14pt] leading-[1.15] font-semibold text-abyss">Assumption of Risk, Liability Release &amp; Hold Harmless Agreement</h1>
                </div>
                <div className="grid shrink-0 justify-items-end gap-[0.6mm] rounded-[2mm] bg-teal-wash px-[3.5mm] py-[2.6mm] text-right ring-1 ring-teal/20">
                  <p className="text-[6.4pt] font-bold tracking-[0.16em] text-teal uppercase">Document no.</p>
                  <p className="font-mono text-[10pt] leading-tight font-bold text-abyss">{w.code}</p>
                  <p className="text-[6.8pt] text-slate">
                    Signed {signedDate}, {signedTime} WIT
                  </p>
                  <p className="text-[6.8pt] text-slate">Form language {language}</p>
                </div>
              </header>
              <p className="mt-[2.5mm] flex flex-wrap gap-x-[2.5mm] text-[7.2pt] text-slate">
                {[host, contact.email, contact.whatsapp ? `WhatsApp ${displayPhone(contact.whatsapp)}` : ""].filter(Boolean).map((item, i) => (
                  <span key={item} className="whitespace-nowrap">
                    {i > 0 && <span className="mr-[2.5mm] text-mist">|</span>}
                    {item}
                  </span>
                ))}
              </p>
              <div className="relative mt-[2mm] h-[1.1mm] rounded-full bg-teal">
                <span className="absolute inset-y-0 left-0 w-[32mm] rounded-full bg-mandarin" />
              </div>

              {/* Peserta */}
              <section className="keep mt-[4.5mm] flex items-center justify-between gap-[5mm] rounded-[2mm] bg-foam px-[4mm] py-[3mm]">
                <div className="grid min-w-0 gap-[0.6mm]">
                  <p className={LABEL}>Participant</p>
                  <p className="font-display text-[15pt] leading-tight font-semibold text-abyss">{w.name}</p>
                  <p className="text-[8pt] text-slate">
                    {w.nationality} · Born {docDate(w.birthDate)}
                    {Number.isInteger(d.age) ? ` (${d.age} years)` : ""} · First dive {docDate(w.date)}
                  </p>
                </div>
                <p
                  className={`max-w-[62mm] shrink-0 rounded-[2mm] px-[3mm] py-[2mm] text-[7.6pt] leading-snug font-bold ring-1 ${
                    w.clearance ? "bg-mandarin-wash text-ember ring-sunrise" : "bg-teal-wash text-teal ring-teal/25"
                  }`}
                >
                  {w.clearance ? "Physician clearance required before diving" : "No physician evaluation indicated"}
                </p>
              </section>

              <div className="grid grid-cols-2 gap-[4mm]">
                <Section title="Contact and stay" className="keep">
                  <Rows
                    items={[
                      ["WhatsApp", w.phone],
                      ["Email", w.email],
                      ["Home address", d.address],
                      ["Emergency contact", emergency.name],
                      ...(emergency.phone ? [["Emergency phone", emergency.phone]] : []),
                      ["Staying at", d.room],
                      ...(w.order ? [["Booking", w.order]] : []),
                      ...(w.minor ? [["Parent or guardian", d.guardian]] : []),
                    ]}
                  />
                </Section>
                <Section title="Diver profile and insurance" className="keep">
                  <Rows
                    items={[
                      ["Certified diver", certified ? "Yes" : "No, joining a dive course"],
                      ["Agency", certified ? d.certAgency : ""],
                      ["Level", certified ? d.certLevel : ""],
                      ["Certification no.", d.certNumber],
                      ["Logged dives", Number.isInteger(d.loggedDives) ? d.loggedDives : ""],
                      ["Last dive", docDate(d.lastDive)],
                      ["Dive insurance", insurance],
                    ]}
                  />
                </Section>
              </div>

              {/* Kuesioner medis */}
              <Section
                title="Diver Medical · Participant Questionnaire"
                aside={<span className="text-[7pt] text-slate">Answers as given by the participant</span>}
              >
                <ol className="grid">
                  {MEDICAL.map((q, i) => {
                    const yes = d.medical?.[q.id] === true;
                    return (
                      <li key={q.id} className={`keep border-b border-mist/70 py-[1.1mm] last:border-0 ${yes ? "bg-mandarin-wash/60" : ""}`}>
                        <div className="grid grid-cols-[6mm_1fr_auto] items-start gap-[1.5mm]">
                          <span className="text-[7.6pt] font-bold text-teal">{i + 1}.</span>
                          <span className="text-[7.6pt] leading-snug text-abyss">
                            {en.medical.questions[i]}
                            {own && <span className="mt-[0.4mm] block text-[6.9pt] text-slate">{own.medical.questions[i]}</span>}
                          </span>
                          <Answer yes={yes} />
                        </div>
                        {q.box && yes && (
                          <ul className="mt-[1mm] ml-[7.5mm] grid gap-[0.6mm] rounded-[1.5mm] bg-white px-[2.5mm] py-[1.5mm] ring-1 ring-sunrise/70">
                            <li className="text-[6.8pt] font-bold text-slate">
                              Box {q.box} · {en.medical.boxIntro[q.box]}
                            </li>
                            {boxItems(q.box).map((id, j) => (
                              <li key={id} className="grid grid-cols-[6mm_1fr_auto] items-start gap-[1.5mm] text-[7.2pt]">
                                <span className="font-semibold text-slate">{id}</span>
                                <span className="text-abyss">
                                  {en.medical.boxes[q.box][j]}
                                  {own && <span className="block text-[6.6pt] text-slate">{own.medical.boxes[q.box][j]}</span>}
                                </span>
                                <Answer yes={d.medical?.[id] === true} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ol>
                <p className={`mt-[2mm] text-[7.8pt] font-bold ${w.clearance ? "text-ember" : "text-teal"}`}>
                  {w.clearance ? `! ${en.medical.clearance}` : `✓ ${en.medical.noClearance}`}
                </p>
                <p className="mt-[0.8mm] text-[7.4pt] text-abyss">✓ {en.medical.declaration}</p>
              </Section>

              {/* Perjanjian */}
              <Section
                title="Agreement"
                aside={<span className="text-[7pt] text-slate">Text as read and accepted by the participant, form language {language}</span>}
              >
                <div className="grid gap-[1.6mm]">
                  {agreementBlocks(w.agreement).map((block, i) =>
                    block.heading ? (
                      <h3 key={i} className="pt-[1.4mm] text-[8.4pt] font-bold text-teal">
                        {block.text}
                      </h3>
                    ) : (
                      <p key={i} className="text-[7.9pt] leading-[1.55] text-abyss [hyphens:auto]">
                        {block.text}
                      </p>
                    ),
                  )}
                </div>
                <p className="mt-[2.5mm] rounded-[1.5mm] bg-teal-wash px-[3mm] py-[2mm] text-[7.6pt] font-semibold text-abyss">✓ {en.sign.agree}</p>
              </Section>

              {/* Tanda tangan */}
              <section className="keep mt-[5mm] border-t-[2px] border-abyss pt-[4mm]">
                <div className="grid grid-cols-[1.6fr_1fr_0.8fr] gap-x-[6mm]">
                  <Line label="Participant's full name">{w.name}</Line>
                  <Line label="Nationality">{w.nationality}</Line>
                  <Line label="Date">{signedDate}</Line>
                </div>
                <div className="mt-[4mm] grid grid-cols-2 gap-x-[8mm]">
                  <Line label={w.minor ? "Signature of parent or guardian" : "Participant's signature"}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={w.signature} alt={`Signature of ${signer}`} className="h-[17mm] w-auto max-w-full object-contain" />
                  </Line>
                  <Line label="Emergency contact and phone">{[emergency.name, emergency.phone].filter(Boolean).join(" · ")}</Line>
                </div>
                <div className="mt-[4mm] grid grid-cols-2 gap-x-[8mm]">
                  <Line label="Parent or guardian name (participant under 18)">{w.minor ? d.guardian : ""}</Line>
                  <Line label="Name typed to confirm">{d.confirmName}</Line>
                </div>
                <p className="mt-[3.5mm] rounded-[1.5mm] bg-foam px-[3mm] py-[2mm] text-[6.8pt] leading-relaxed text-slate">
                  Signed electronically by {signer}
                  {w.minor ? ` for ${w.name}` : ""} on {signedDate} at {signedTime} WIT at {host}/waiver
                  {w.ip ? ` from IP ${w.ip}` : ""}. Document no. {w.code}.{w.userAgent ? ` Device ${w.userAgent.slice(0, 140)}` : ""}
                </p>
              </section>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
