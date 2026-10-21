"use client";

import Image from "next/image";
import { useState } from "react";
import plate from "../../brand/logo/dragonet-divers-logo-plate.png";
import logo from "../../brand/logo/dragonet-divers-logo.png";
import photo from "../assets/gallery/manta-belly.webp";
import { EyeIcon, LockIcon, MailIcon } from "../components/icons";

const MODULES = ["Permintaan booking", "Kondisi laut", "Status situs"];

function Field({ id, label, icon: Icon, children }) {
  return (
    <label htmlFor={id} className="grid gap-1.5">
      <span className="text-sm font-semibold text-abyss">{label}</span>
      <span className="flex h-12 items-center gap-2 rounded-input border border-line-strong bg-white px-3 focus-within:border-teal focus-within:ring-3 focus-within:ring-lagoon/40">
        <Icon className="size-5 shrink-0 text-slate" />
        {children}
      </span>
    </label>
  );
}

// Halaman masuk operator, mengikuti tata letak Zanclus: kiri foto laut dengan pesan ruang kerja,
// kanan kartu login. Password dikirim ke /api/admin/login; sesi disimpan di cookie httpOnly.
export default function AdminLogin({ configured, issues }) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Login gagal.");
      window.location.assign("/admin");
    } catch (e) {
      setError(e.message || "Login gagal.");
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-dvh bg-foam lg:grid-cols-[1.05fr_1fr]">
      <aside aria-hidden="true" className="relative isolate hidden overflow-hidden bg-abyss text-white lg:grid">
        <Image src={photo} alt="" fill sizes="50vw" priority className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(10_50_59/0.35)_0%,rgb(10_50_59/0.55)_55%,rgb(10_50_59/0.92)_100%)]" />
        <div className="flex flex-col justify-between p-12">
          <Image src={plate} alt="" width={64} height={64} className="size-16" />
          <div className="grid max-w-[30rem] gap-4">
            <p className="text-xs font-bold tracking-[0.16em] text-sunrise uppercase">Dragonet Divers · Raja Ampat</p>
            <h2 className="text-4xl leading-tight text-white">Ruang kerja tim Dragonet.</h2>
            <p className="text-white/85">Pantau permintaan tamu, kondisi laut, dan isi website dari satu tempat.</p>
            <ul className="flex flex-wrap gap-2">
              {MODULES.map((m) => (
                <li key={m} className="rounded-full bg-white/12 px-3 py-1 text-sm font-semibold ring-1 ring-white/25">
                  {m}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-white/70">Kurkapa · Mansuar · Raja Ampat</p>
        </div>
      </aside>

      <main className="grid content-start gap-8 px-4 py-8 sm:px-10 lg:content-center lg:px-16">
        <a href="/" className="w-fit text-sm font-semibold text-teal hover:underline">
          ← Kembali ke website
        </a>
        <section className="mx-auto grid w-full max-w-[26rem] gap-6 rounded-frame bg-white p-6 shadow-float ring-1 ring-mist sm:p-8">
          <div className="flex items-center gap-3">
            <Image src={logo} alt="" width={44} height={44} className="size-11" />
            <span className="grid leading-none">
              <span className="font-display text-lg font-semibold text-teal">Dragonet Divers</span>
              <span className="mt-1.5 text-[10px] font-bold tracking-[0.2em] text-slate">ADMIN</span>
            </span>
          </div>
          <div className="grid gap-2">
            <p className="eyebrow">Operator sign in</p>
            <h1 className="text-[1.75rem] leading-tight text-abyss">Selamat datang kembali.</h1>
            <p className="text-sm text-slate">Masuk dengan akun operator untuk membuka dashboard Dragonet.</p>
          </div>

          {configured ? (
            <form onSubmit={submit} className="grid gap-4">
              <Field id="admin-email" label="Email operator" icon={MailIcon}>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="operator@dragonetdivers.com"
                  required
                  className="h-full w-full bg-transparent text-abyss outline-none placeholder:text-slate/60"
                />
              </Field>
              <Field id="admin-password" label="Password" icon={LockIcon}>
                <input
                  id="admin-password"
                  name="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  autoCapitalize="off"
                  spellCheck={false}
                  required
                  className="h-full w-full bg-transparent text-abyss outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-pressed={show}
                  aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
                  className="grid size-8 shrink-0 place-items-center rounded-full text-slate hover:bg-teal-wash hover:text-teal"
                >
                  <EyeIcon className="size-[18px]" />
                </button>
              </Field>
              {error && (
                <p role="alert" className="rounded-input bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-teal px-6 font-bold text-white transition-colors duration-200 ease-brand hover:bg-teal-dark disabled:bg-mist disabled:text-slate"
              >
                {busy ? "Memeriksa…" : "Masuk"}
              </button>
            </form>
          ) : (
            <div className="grid gap-3 rounded-card bg-sunrise-wash p-4 text-sm text-abyss">
              <p className="font-bold">Login operator belum diatur.</p>
              <p>Isi variabel berikut di hPanel (Websites → dragonetdivers.com → Environment variables), lalu deploy ulang.</p>
              <ul className="grid gap-1.5">
                {issues.map((issue) => (
                  <li key={issue.name}>
                    <code className="font-bold text-ember">{issue.name}</code> {issue.reason}
                  </li>
                ))}
                <li>
                  <code className="font-bold text-ember">SESSION_SECRET</code> Teks acak panjang (disarankan).
                </li>
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
