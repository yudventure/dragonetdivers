"use client";

// Tombol − angka + untuk jumlah tamu (sidebar keranjang dan checkout). size "sm" untuk baris keranjang.
export default function GuestStepper({ id, value, min, max, onChange, fewer, more, size = "md", invalid = false }) {
  const box = size === "sm" ? "h-9" : "h-12";
  const button = size === "sm" ? "w-9 text-lg" : "w-12 text-xl";
  return (
    <div className={`flex ${box} items-center rounded-input border bg-white ${invalid ? "border-danger" : "border-line-strong"}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={fewer}
        className={`grid h-full ${button} place-items-center font-bold text-teal disabled:text-mist`}
      >
        −
      </button>
      <output id={id} aria-live="polite" className="min-w-8 flex-1 px-1 text-center font-semibold text-abyss tabular-nums">
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={more}
        className={`grid h-full ${button} place-items-center font-bold text-teal disabled:text-mist`}
      >
        +
      </button>
    </div>
  );
}
