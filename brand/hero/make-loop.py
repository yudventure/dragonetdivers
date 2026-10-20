"""Olah video Kling (frame awal = frame akhir) menjadi aset hero website.

    python3 brand/hero/make-loop.py hasil-kling.mp4

Menghasilkan public/media/hero-diver.mp4 + .webm (loop 1080 px tanpa suara)
dan src/assets/hero-diver.webp (poster = frame pertama). Butuh ffmpeg
(libx264, libvpx-vp9), numpy, dan opencv-python.
"""
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np

SIZE = 1080
ROOT = Path(__file__).resolve().parents[2]

src = sys.argv[1]
raw = subprocess.run(
    ["ffmpeg", "-v", "error", "-i", src, "-vf", f"scale={SIZE}:{SIZE}:flags=lanczos", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    capture_output=True,
    check=True,
).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, SIZE, SIZE, 3)

# Latar Kling sekitar 247-252, bukan putih murni: nada >= 244 dipetakan ke 255,
# nada di bawah 200 tidak berubah, supaya video menyatu dengan halaman putih.
x = np.arange(256, dtype=np.float32)
lut = np.clip(np.where(x < 200, x, 200 + (x - 200) * 55 / 44), 0, 255).astype(np.uint8)
# Frame terakhir sama dengan frame pertama, jadi dibuang agar loop tidak tersendat.
loop = np.stack([cv2.LUT(f, lut) for f in frames[:-1]])

media = ROOT / "public/media"
media.mkdir(parents=True, exist_ok=True)
pipe_in = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{SIZE}x{SIZE}", "-r", "24", "-i", "-"]
encoders = {
    "hero-diver.mp4": ["-c:v", "libx264", "-preset", "slow", "-crf", "26", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an"],
    "hero-diver.webm": ["-c:v", "libvpx-vp9", "-crf", "40", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", "-pix_fmt", "yuv420p", "-an"],
}
for name, args in encoders.items():
    subprocess.run([*pipe_in, *args, str(media / name)], input=loop.tobytes(), check=True)

poster = ROOT / "src/assets/hero-diver.webp"
cv2.imwrite(str(poster), cv2.cvtColor(loop[0], cv2.COLOR_RGB2BGR), [cv2.IMWRITE_WEBP_QUALITY, 82])
for path in [media / "hero-diver.mp4", media / "hero-diver.webm", poster]:
    print(f"{path.relative_to(ROOT)}: {path.stat().st_size // 1024} KB")
