"""Olah video Kling (frame awal = frame akhir) menjadi video loop website + poster.

    python3 brand/video/make-loop.py hasil-kling.mp4 --name hero-diver --size 1080x1080 --whiten
    python3 brand/video/make-loop.py hasil-kling.mp4 --name ocean-manta-loop --size 1280x720 --crf-mp4 27 --crf-webm 42

Menghasilkan public/media/<name>.mp4 + .webm (tanpa suara, 24 fps) dan
src/assets/<name>.webp (poster = frame pertama). Butuh ffmpeg (libx264,
libvpx-vp9), numpy, dan opencv-python.
"""
import argparse
import subprocess
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]

parser = argparse.ArgumentParser()
parser.add_argument("source")
parser.add_argument("--name", required=True)
parser.add_argument("--size", default="1080x1080", help="LEBARxTINGGI")
parser.add_argument("--whiten", action="store_true", help="latar keabuan (±250) dijadikan putih 255")
parser.add_argument("--blend", type=int, default=0, help="crossfade N frame di sambungan loop (0 = tanpa)")
parser.add_argument("--crf-mp4", default="26")
parser.add_argument("--crf-webm", default="40")
args = parser.parse_args()
width, height = (int(v) for v in args.size.split("x"))

raw = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", args.source, "-vf", f"scale={width}:{height}:flags=lanczos", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    capture_output=True,
    check=True,
).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, height, width, 3)

# Frame terakhir sama dengan frame pertama, jadi dibuang agar loop tidak tersendat.
loop = frames[:-1]
if args.blend:
    # Bila frame akhir Kling tidak persis sama dengan frame awal: N frame terakhir dilebur
    # perlahan ke N frame pertama, lalu N frame pertama dibuang, jadi sambungannya halus.
    n = args.blend
    blended = loop[n:].astype(np.float32)
    for j in range(n):
        a = (j + 1) / (n + 1)
        blended[len(blended) - n + j] = blended[len(blended) - n + j] * (1 - a) + loop[j] * a
    loop = np.clip(blended + 0.5, 0, 255).astype(np.uint8)
if args.whiten:
    # Latar Kling sekitar 247-252, bukan putih murni: nada >= 244 dipetakan ke 255,
    # nada di bawah 200 tidak berubah, supaya video menyatu dengan halaman putih.
    x = np.arange(256, dtype=np.float32)
    lut = np.clip(np.where(x < 200, x, 200 + (x - 200) * 55 / 44), 0, 255).astype(np.uint8)
    loop = np.stack([cv2.LUT(f, lut) for f in loop])

media = ROOT / "public/media"
media.mkdir(parents=True, exist_ok=True)
pipe_in = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{width}x{height}", "-r", "24", "-i", "-"]
encoders = {
    f"{args.name}.mp4": ["-c:v", "libx264", "-preset", "slow", "-crf", args.crf_mp4, "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an"],
    f"{args.name}.webm": ["-c:v", "libvpx-vp9", "-crf", args.crf_webm, "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-pix_fmt", "yuv420p", "-an"],
}
for name, enc in encoders.items():
    subprocess.run([*pipe_in, *enc, str(media / name)], input=np.ascontiguousarray(loop).tobytes(), check=True)

poster = ROOT / f"src/assets/{args.name}.webp"
cv2.imwrite(str(poster), cv2.cvtColor(loop[0], cv2.COLOR_RGB2BGR), [cv2.IMWRITE_WEBP_QUALITY, 82])
for path in [media / f"{args.name}.mp4", media / f"{args.name}.webm", poster]:
    print(f"{path.relative_to(ROOT)}: {path.stat().st_size // 1024} KB")
