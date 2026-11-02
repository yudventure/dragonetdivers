"use client";

import { useEffect, useRef } from "react";

// Kotak tanda tangan untuk formulir selam: digambar dengan jari, pena, atau mouse (pointer events), garis
// halus berwarna abyss, kanvas tajam di layar retina. onChange(dataUrl PNG) setelah setiap goresan yang cukup
// panjang, onChange("") saat dihapus. Ukuran kanvas mengikuti lebar kotak; tanda tangan ikut diskalakan bila
// lebarnya berubah (mis. ponsel diputar) supaya tidak hilang.
const MIN_LENGTH = 40; // px goresan total sebelum dianggap tanda tangan

export default function SignaturePad({ label, hint, clearLabel, onChange, invalid, describedBy, resetKey }) {
  const canvas = useRef(null);
  const state = useRef({ drawing: false, last: null, length: 0, strokes: [] });

  const paint = () => {
    const el = canvas.current;
    if (!el) return;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = el.getBoundingClientRect();
    el.width = Math.round(width * ratio);
    el.height = Math.round(height * ratio);
    const ctx = el.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = "#0A323B";
    for (const stroke of state.current.strokes) {
      ctx.beginPath();
      stroke.forEach(([x, y], i) => (i ? ctx.lineTo(x * width, y * height) : ctx.moveTo(x * width, y * height)));
      if (stroke.length === 1) ctx.lineTo(stroke[0][0] * width + 0.1, stroke[0][1] * height);
      ctx.stroke();
    }
  };

  useEffect(() => {
    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(canvas.current);
    return () => observer.disconnect();
  }, []);

  // Formulir baru (mis. untuk penyelam berikutnya): kosongkan.
  useEffect(() => {
    state.current = { drawing: false, last: null, length: 0, strokes: [] };
    paint();
  }, [resetKey]);

  const point = (e) => {
    const rect = canvas.current.getBoundingClientRect();
    return [(e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height, rect];
  };

  const down = (e) => {
    e.preventDefault();
    canvas.current.setPointerCapture?.(e.pointerId);
    const [x, y] = point(e);
    state.current.drawing = true;
    state.current.last = [x, y];
    state.current.strokes.push([[x, y]]);
    paint();
  };
  const move = (e) => {
    if (!state.current.drawing) return;
    e.preventDefault();
    const [x, y, rect] = point(e);
    const [lx, ly] = state.current.last;
    state.current.length += Math.hypot((x - lx) * rect.width, (y - ly) * rect.height);
    state.current.last = [x, y];
    state.current.strokes.at(-1).push([x, y]);
    paint();
  };
  const up = () => {
    if (!state.current.drawing) return;
    state.current.drawing = false;
    onChange(state.current.length >= MIN_LENGTH ? canvas.current.toDataURL("image/png") : "");
  };
  const clear = () => {
    state.current = { drawing: false, last: null, length: 0, strokes: [] };
    paint();
    onChange("");
  };

  return (
    <div className="grid gap-1.5">
      <canvas
        ref={canvas}
        role="img"
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={up}
        className={`h-48 w-full touch-none rounded-input border-2 border-dashed bg-white sm:h-56 ${invalid ? "border-danger" : "border-lagoon"}`}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate">{hint}</p>
        <button type="button" onClick={clear} className="h-8 rounded-full px-3 text-sm font-bold text-ember hover:bg-sunrise-wash">
          {clearLabel}
        </button>
      </div>
    </div>
  );
}
