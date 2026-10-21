"""Netralkan warna perut manta dari Kling (krem kemerahan) menjadi putih keabuan yang sejuk.

    python3 brand/ocean/manta-belly.py hasil-kling.mp4 manta-putih.mkv

Air di video laut dalam selalu lebih biru daripada merah, jadi hanya piksel "hangat" (merah > biru)
yang disentuh, yaitu tubuh manta. Kecerahan dipertahankan dan sedikit dinaikkan, warnanya digeser
ke putih kebiruan seperti perut manta karang di bawah air. Menghasilkan video lossless (FFV1)
1280x720 yang lalu diolah make-loop.py. Butuh ffmpeg dan numpy.
"""
import subprocess
import sys

import numpy as np

src, dst = sys.argv[1], sys.argv[2]
W, H = 1280, 720

reader = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-i", src, "-vf", f"scale={W}:{H}:flags=lanczos", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    stdout=subprocess.PIPE,
)
writer = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", "24", "-i", "-", "-c:v", "ffv1", dst],
    stdin=subprocess.PIPE,
)
tint = np.array([0.93, 0.99, 1.06], np.float32)
size = W * H * 3
while chunk := reader.stdout.read(size):
    if len(chunk) < size:
        break
    f = np.frombuffer(chunk, np.uint8).reshape(H, W, 3).astype(np.float32)
    # Seberapa hangat piksel ini: 0 untuk air (biru), 1 untuk perut manta yang jelas krem.
    warm = np.clip((f[..., 0] - f[..., 2] - 2) / 30, 0, 1)[..., None]
    luma = f @ np.array([0.299, 0.587, 0.114], np.float32)
    neutral = np.clip(luma[..., None] * 1.08 * tint, 0, 255)
    out = f * (1 - warm) + neutral * warm
    writer.stdin.write(np.clip(out + 0.5, 0, 255).astype(np.uint8).tobytes())
writer.stdin.close()
writer.wait()
