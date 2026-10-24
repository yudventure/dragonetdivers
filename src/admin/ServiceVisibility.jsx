"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Panel "Layanan di website" di /admin/paket: sakelar per layanan. Layanan yang disimpan tidak tampil di
 * menu, beranda, footer, dan halamannya (404), dan paketnya tidak bisa dipesan; paket dan harganya tetap
 * tersimpan. Setiap sakelar langsung disimpan (/api/admin/services). services = [{ slug, title, count }].
 */
export default function ServiceVisibility({ services, hidden: initial }) {
  const router = useRouter();
  const [hidden, setHidden] = useState(initial);
  const [state, setState] = useState({ busy: "", message: "", error: false });
  const shown = services.length - hidden.length;

  async function toggle(slug, show) {
    const before = hidden;
    const next = show ? hidden.filter((s) => s !== slug) : [...hidden, slug];
    setHidden(next);
    setState({ busy: slug, message: "", error: false });
    const response = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: next }),
    }).catch(() => null);
    const result = await response?.json().catch(() => ({}));
    if (!response?.ok) {
      setHidden(before);
      return setState({ busy: "", message: result?.error || "Belum tersimpan. Coba lagi.", error: true });
    }
    setHidden(result.hidden);
    const title = services.find((s) => s.slug === slug)?.title;
    setState({ busy: "", message: show ? `${title} tampil lagi di website.` : `${title} disimpan dan tidak tampil di website.`, error: false });
    router.refresh();
  }

  return (
    <section className="grid gap-4 rounded-card bg-white p-5 ring-1 ring-mist">
      <div className="grid max-w-[64ch] gap-1">
        <h2 className="text-xl text-abyss">Layanan di website</h2>
        <p className="text-sm text-slate">
          {shown} dari {services.length} layanan tampil. Layanan yang disimpan tidak muncul di menu, beranda, footer, dan halamannya, dan paketnya tidak
          bisa dipesan. Paket dan harganya tetap tersimpan, jadi bisa ditampilkan lagi kapan saja.
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => {
          const on = !hidden.includes(service.slug);
          const last = on && shown === 1;
          return (
            <li key={service.slug}>
              <label className={`flex items-start justify-between gap-4 rounded-input p-4 ring-1 ${on ? "bg-foam ring-mist" : "bg-white ring-line-strong"} ${last ? "cursor-not-allowed" : "cursor-pointer"}`}>
                <span className="grid gap-1">
                  <span className="flex flex-wrap items-center gap-2 font-semibold text-abyss">
                    {service.title}
                    {!on && <span className="rounded-full bg-mist px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate uppercase">Disimpan</span>}
                  </span>
                  <span className="text-sm text-slate">
                    {on ? "Tampil di website" : "Tidak tampil"} · {service.count} paket
                  </span>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label={`Tampilkan ${service.title} di website`}
                  checked={on}
                  disabled={Boolean(state.busy) || last}
                  onChange={(e) => toggle(service.slug, e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="relative mt-0.5 h-7 w-12 shrink-0 rounded-full bg-line-strong transition-colors duration-200 ease-brand peer-checked:bg-teal peer-focus-visible:ring-3 peer-focus-visible:ring-lagoon/40 peer-disabled:opacity-60 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-200 peer-checked:after:translate-x-5"
                />
              </label>
            </li>
          );
        })}
      </ul>
      {state.message && (
        <p role={state.error ? "alert" : "status"} className={`text-sm font-semibold ${state.error ? "text-danger" : "text-teal"}`}>
          {state.message}
        </p>
      )}
    </section>
  );
}
