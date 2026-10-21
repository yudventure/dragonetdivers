"""Gelapkan manta di video Kling menjadi bayangan (latar panel kondisi laut, brand/ocean/README.md).

    python3 brand/ocean/manta-shadow.py hasil-kling.mp4 manta-bayangan.mkv

Menghasilkan video lossless (FFV1) 1280x720 yang lalu diolah make-loop.py. Butuh ffmpeg,
numpy, dan opencv-python.

Masker = piksel yang lebih gelap atau lebih pudar dari latar median (laut tanpa manta), lalu
manta dilacak dari frame tempat ia paling besar, maju dan mundur, lewat komponen yang
bersinggungan dengan masker frame sebelumnya. Celah gelap di riak permukaan tidak ikut.
"""
import subprocess
import sys

import cv2
import numpy as np

src, dst = sys.argv[1], sys.argv[2]
W, H = 1280, 720
MW, MH = 960, 540
def frames():
    p = subprocess.Popen(["ffmpeg","-v","error","-i",src,"-vf",f"scale={W}:{H}:flags=lanczos","-f","rawvideo","-pix_fmt","rgb24","-"],stdout=subprocess.PIPE)
    size = W*H*3
    while True:
        b = p.stdout.read(size)
        if len(b) < size: break
        yield np.frombuffer(b,np.uint8).reshape(H,W,3)
sample = [f for i,f in enumerate(frames()) if i % 3 == 0]
bg = np.median(np.stack(sample),axis=0).astype(np.uint8); del sample
small = lambda x: cv2.resize(x,(MW,MH),interpolation=cv2.INTER_AREA)
lab = lambda x: cv2.cvtColor(cv2.GaussianBlur(small(x),(5,5),0),cv2.COLOR_RGB2LAB).astype(np.float32)
B = lab(bg); chB = np.hypot(B[...,1]-128,B[...,2]-128)

# 1. Kandidat per frame
labels, stats = [], []
for f in frames():
    F = lab(f); dL = F[...,0]-B[...,0]; dC = np.hypot(F[...,1]-128,F[...,2]-128)-chB
    m = ((dL < -14) | ((dC < -9) & (dL < 8))).astype(np.uint8)
    m[: int(0.06*MH)] = 0
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3,3),np.uint8))
    n, lbl, st, _ = cv2.connectedComponentsWithStats(m, 8)
    labels.append(lbl.astype(np.uint16)); stats.append(st)
N = len(labels)

# 2. Lacak manta dari frame dengan komponen terbesar
start = max(range(N), key=lambda i: max([0]+[s[cv2.CC_STAT_AREA] for s in stats[i][1:]]))
masks = [None]*N
def pick(i, prev):
    st = stats[i]
    if len(st) < 2: return None
    if prev is None:
        ids = [int(np.argmax(st[1:, cv2.CC_STAT_AREA]))+1]
    else:
        r = int(max(6, 0.12*np.sqrt(prev.sum())))
        zone = cv2.dilate(prev, cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2*r+1,2*r+1)))
        hit = np.unique(labels[i][zone>0]); hit = [int(h) for h in hit if h]
        if not hit: return None
        big = max(st[h, cv2.CC_STAT_AREA] for h in hit)
        ids = [h for h in hit if st[h, cv2.CC_STAT_AREA] >= max(4, 0.12*big)]
        # Kecuali saat ia sudah kecil sekali, manta tidak boleh tiba-tiba menyusut 4x atau membesar 4x.
        area = sum(st[h, cv2.CC_STAT_AREA] for h in ids); pa = prev.sum()
        if pa > 200 and not (pa/4 < area < pa*4): return None
    return np.isin(labels[i], ids).astype(np.uint8)
masks[start] = pick(start, None)
for rng in (range(start+1, N), range(start-1, -1, -1)):
    prev = masks[start]
    for i in rng:
        m = pick(i, prev)
        if m is None: break
        masks[i] = m; prev = m

# 3. Gelapkan: warna air di titik itu, jauh lebih gelap, tepi lembut
shade = bg.astype(np.float32)*0.22
out = subprocess.Popen(["ffmpeg","-v","error","-y","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r","24","-i","-","-c:v","ffv1",dst],stdin=subprocess.PIPE)
for i, f in enumerate(frames()):
    o = f
    if masks[i] is not None:
        m = cv2.morphologyEx(masks[i], cv2.MORPH_CLOSE, np.ones((5,5),np.uint8))
        m = cv2.resize(m.astype(np.float32),(W,H),interpolation=cv2.INTER_LINEAR)
        a = cv2.GaussianBlur(m,(0,0),1.6)[...,None]*0.93
        o = np.clip(f.astype(np.float32)*(1-a) + shade*a + 0.5, 0, 255).astype(np.uint8)
    out.stdin.write(o.tobytes())
out.stdin.close(); out.wait()
on = [i for i in range(N) if masks[i] is not None]
print("frames", N, "start", start, "manta from", on[0], "to", on[-1], "count", len(on))
