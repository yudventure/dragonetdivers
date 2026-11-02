import Link from "next/link";
import { notFound } from "next/navigation";
import AdminGate from "@/admin/AdminGate";
import AdminShell from "@/admin/AdminShell";
import PrintButton from "@/admin/PrintButton";
import { uiText } from "@/content/ui";
import { localeNamesId } from "@/lib/i18n";
import { agreementBlocks, boxItems, isWaiverCode, MEDICAL } from "@/lib/waiver";
import { currentAdmin } from "@/server/admin-auth";
import { waiverByCode } from "@/server/waivers";

export const dynamic = "force-dynamic";
export const metadata = { title: "Formulir selam" };

const dateId = (date) =>
  date ? new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${date.slice(0, 10)}T00:00:00Z`)) : "–";

function Rows({ items }) {
  return (
    <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
      {items
        .filter(([, value]) => value !== "" && value !== null && value !== undefined)
        .map(([label, value]) => (
          <div key={label} className="grid gap-0.5">
            <dt className="text-xs font-bold tracking-[0.1em] text-slate uppercase">{label}</dt>
            <dd className="text-abyss">{value}</dd>
          </div>
        ))}
    </dl>
  );
}

const Box = ({ title, children }) => (
  <section className="grid gap-4 rounded-card bg-white p-5 ring-1 ring-mist break-inside-avoid sm:p-6">
    <h2 className="text-xs font-bold tracking-[0.14em] text-teal uppercase">{title}</h2>
    {children}
  </section>
);

// /admin/formulir/<kode>: satu formulir selam lengkap (data diri, profil penyelam, jawaban medis dengan teks
// pertanyaannya dalam Bahasa Indonesia, teks perjanjian yang disetujui, tanda tangan), bisa dicetak.
export default async function WaiverDetailPage({ params }) {
  const admin = await currentAdmin();
  if (!admin) return <AdminGate />;
  const { code } = await params;
  if (!isWaiverCode(code)) notFound();
  const w = await waiverByCode(code).catch((error) => console.error(`[admin/formulir] ${error.code ?? error.message}`));
  if (!w) notFound();
  const d = w.data;
  const t = uiText("id").waiver;
  const yes = (v) => (v ? "Ya" : "Tidak");

  return (
    <AdminShell admin={admin} active="formulir">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <Link href="/admin/formulir" className="text-sm font-bold text-teal hover:underline">
          ← Semua formulir
        </Link>
        <PrintButton />
      </div>
      <div className="grid gap-1">
        <p className="font-mono text-sm text-slate">{w.code}</p>
        <h1 className="text-3xl leading-tight text-abyss">{w.name}</h1>
        <p className="text-slate">
          Ditandatangani{" "}
          {new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Jayapura" }).format(new Date(w.createdAt))} WIT · bahasa{" "}
          {localeNamesId[w.lang] ?? w.lang}
          {w.order && (
            <>
              {" "}
              · pesanan <span className="font-mono">{w.order}</span>
            </>
          )}
        </p>
      </div>
      {w.clearance ? (
        <p className="rounded-card bg-sunrise-wash p-4 font-semibold text-abyss ring-1 ring-sunrise">
          Perlu persetujuan dokter sebelum menyelam: ada jawaban Ya pada pertanyaan yang memerlukan evaluasi dokter. Minta surat evaluasi dokter
          (Diver Medical) sebelum tamu menyelam.
        </p>
      ) : (
        <p className="rounded-card bg-success/10 p-4 font-semibold text-success">Tidak perlu persetujuan dokter menurut kuesioner medis.</p>
      )}

      <Box title="Data diri">
        <Rows
          items={[
            [t.fields.fullName, w.name],
            [t.fields.birthDate, `${dateId(w.birthDate)} (${d.age ?? ""} tahun)`],
            [t.fields.nationality, w.nationality],
            [t.fields.date, dateId(w.date)],
            [t.fields.emergency, d.emergency],
            [t.fields.email, w.email],
            [t.fields.phone, w.phone],
            [t.fields.address, d.address],
            [t.fields.room, d.room],
            ...(w.minor ? [[t.fields.guardian, d.guardian]] : []),
          ]}
        />
      </Box>

      <Box title="Profil penyelam dan asuransi">
        <Rows
          items={[
            [t.fields.certAgency, d.certified === false ? "Belum bersertifikat (ikut kursus)" : d.certAgency],
            [t.fields.certLevel, d.certified === false ? "" : d.certLevel],
            [t.fields.certNumber, d.certNumber],
            [t.fields.loggedDives, d.loggedDives ?? ""],
            [t.fields.lastDive, d.lastDive ? dateId(d.lastDive) : ""],
            [t.fields.insurance, d.insurance === "yes" ? `Ya${d.insurer ? ` (${d.insurer})` : ""}` : d.insurance === "no" ? "Tidak" : "Tidak diisi"],
          ]}
        />
      </Box>

      <Box title="Kuesioner medis">
        <ol className="grid gap-2">
          {MEDICAL.map((q, i) => (
            <li key={q.id} className={`grid gap-2 rounded-input p-3 ring-1 ${d.medical?.[q.id] ? "bg-sunrise-wash ring-sunrise" : "ring-mist"}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-abyss">
                  <span className="font-bold text-teal">{i + 1}.</span> {t.medical.questions[i]}
                </p>
                <span className={`shrink-0 text-sm font-bold ${d.medical?.[q.id] ? "text-ember" : "text-slate"}`}>{yes(d.medical?.[q.id])}</span>
              </div>
              {q.box && d.medical?.[q.id] && (
                <ul className="grid gap-1.5 rounded-input bg-white p-3">
                  <li className="text-xs font-bold text-slate">{t.medical.boxIntro[q.box]}</li>
                  {boxItems(q.box).map((id, j) => (
                    <li key={id} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-abyss">{t.medical.boxes[q.box][j]}</span>
                      <span className={`shrink-0 font-bold ${d.medical?.[id] ? "text-ember" : "text-slate"}`}>{yes(d.medical?.[id])}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      </Box>

      <Box title="Tanda tangan">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={w.signature} alt={`Tanda tangan ${w.minor ? d.guardian : w.name}`} className="h-40 w-full max-w-md rounded-input bg-white object-contain ring-1 ring-mist" />
        <Rows
          items={[
            ["Nama yang diketik", d.confirmName],
            ["Penanda tangan", w.minor ? `${d.guardian} (orang tua atau wali)` : w.name],
            ["Alamat IP", w.ip],
            ["Perangkat", w.userAgent],
          ]}
        />
      </Box>

      <details className="rounded-card bg-white p-5 ring-1 ring-mist sm:p-6" open>
        <summary className="cursor-pointer text-xs font-bold tracking-[0.14em] text-teal uppercase">Teks perjanjian yang disetujui</summary>
        <div className="mt-4 grid gap-3">
          {agreementBlocks(w.agreement).map((block, i) =>
            block.heading ? (
              <h3 key={i} className="pt-1 text-base font-semibold text-abyss">
                {block.text}
              </h3>
            ) : (
              <p key={i} className="text-sm leading-relaxed text-abyss">
                {block.text}
              </p>
            ),
          )}
        </div>
      </details>
    </AdminShell>
  );
}
