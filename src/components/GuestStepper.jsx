"use client";

// Tombol − angka + untuk jumlah tamu (kartu paket dan checkout). size "sm" untuk kartu dan baris keranjang.
// Dengan onRemove, tombol − di jumlah minimal mengeluarkan paket dari keranjang (label remove).
export default function GuestStepper({ id, value, min, max, onChange, fewer, more, onRemove, remove, size = "md", invalid = false }) {
  const box = size === "sm" ? "h-9" : "h-12";
  const button = size === "sm" ? "w-9 text-lg" : "w-12 text-xl";
  const removing = Boolean(onRemove) && value <= min;
  return (
    <div className={`flex ${box} items-center rounded-input border bg-white ${invalid ? "border-danger" : "border-line-strong"}`}>
      <button
        type="button"
        onClick={() => (removing ? onRemove() : onChange(Math.max(min, value - 1)))}
        disabled={value <= min && !removing}
        aria-label={removing ? remove : fewer}
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
