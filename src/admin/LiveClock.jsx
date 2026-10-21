"use client";

import { useEffect, useState } from "react";

const time = (d) => new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone: "Asia/Jayapura" }).format(d);
const day = (d) => new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jayapura" }).format(d);

// Jam WIT di kartu sambutan dashboard; nilai awal dari server supaya tidak kosong sebelum hidrasi.
export default function LiveClock({ initial }) {
  const [now, setNow] = useState(() => new Date(initial));
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="grid justify-items-start sm:justify-items-end">
      <p className="font-display text-4xl font-semibold tabular-nums sm:text-5xl" suppressHydrationWarning>
        {time(now)}
      </p>
      <p className="text-sm text-white/80" suppressHydrationWarning>
        {day(now)} · WIT
      </p>
    </div>
  );
}
