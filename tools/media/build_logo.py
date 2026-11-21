"""Split the client's 2017 logo (transparent PNG) into recolourable white masks.
Usage: python -I build_logo.py <logo.png> <out-dir>
Writes mark.png, wordmark.png, lockup.png (no tagline), plus favicon-*.png (yellow mark on near-black)."""
import sys, os
from collections import deque
from PIL import Image, ImageDraw
import numpy as np
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
a = np.array(Image.open(src).convert("RGBA"))[:, :, 3].astype(np.uint8)
a[:4, :] = 0; a[-4:, :] = 0; a[:, :4] = 0; a[:, -4:] = 0          # drop the 1px frame
H, W = a.shape; solid = a > 50
lab = np.zeros((H, W), np.int32); comps = []
for y in range(H):
    for x in range(W):
        if solid[y, x] and not lab[y, x]:
            n = len(comps) + 1; q = deque([(y, x)]); lab[y, x] = n; pts = []
            while q:
                cy, cx = q.popleft(); pts.append((cy, cx))
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < H and 0 <= nx < W and solid[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = n; q.append((ny, nx))
            ys = [p[0] for p in pts]; xs = [p[1] for p in pts]
            comps.append(dict(n=n, size=len(pts), cx=sum(xs) / len(xs), cy=sum(ys) / len(ys), x0=min(xs), x1=max(xs), y0=min(ys), y1=max(ys)))
comps = [c for c in comps if c["size"] > 12]
# The crescent's tail touches the italic "F", so they form one component. Split it geometrically:
# below y=274 is crescent; above, anything left of the F's slanted left edge (x = 345 - 0.2*(y-155)) is the mark.
big = max(comps, key=lambda c: c["size"])
yy, xx = np.mgrid[0:H, 0:W]
in_big = lab == big["n"]
mark_px = in_big & ((yy >= 274) | (xx < 345 - 0.2 * (yy - 155) - 6))
f_px = in_big & ~mark_px
SPLIT_MARK, SPLIT_F = len(comps) + 101, len(comps) + 102
lab[mark_px] = SPLIT_MARK; lab[f_px] = SPLIT_F
comps = [c for c in comps if c is not big]
mark = [c for c in comps if c["x1"] < 345 and c["cx"] < 300] + [dict(n=SPLIT_MARK)]
tag = [c for c in comps if c["n"] not in [m["n"] for m in mark] and c["y0"] > 355]
word = [c for c in comps if c not in tag and c["n"] not in [m["n"] for m in mark]] + [dict(n=SPLIT_F)]
print(f"{len(comps)+1} components: mark {len(mark)}, wordmark {len(word)}, tagline {len(tag)}")
# grow each label set by 2px so anti-aliased edge pixels (alpha <= 50) stay with their shape
def mask_for(group):
    keep = np.isin(lab, [c["n"] for c in group])
    img = Image.fromarray((keep * 255).astype(np.uint8)).filter(__import__("PIL.ImageFilter", fromlist=["x"]).MaxFilter(5))
    m = np.minimum(np.array(img), a)
    ids = [c["n"] for c in group]
    if SPLIT_MARK in ids and SPLIT_F not in ids: m[f_px] = 0
    if SPLIT_F in ids and SPLIT_MARK not in ids: m[mark_px] = 0
    return m
def save(m, name):
    ys, xs = np.where(m > 0); box = (xs.min() - 2, ys.min() - 2, xs.max() + 3, ys.max() + 3)
    rgba = np.zeros((H, W, 4), np.uint8); rgba[:, :, :3] = 255; rgba[:, :, 3] = m
    im = Image.fromarray(rgba).crop(box); im.save(os.path.join(out, name), optimize=True)
    print(name, im.size); return im
mk = save(mask_for(mark), "mark.png")
save(mask_for(word), "wordmark.png")
save(mask_for(mark + word), "lockup.png")
# favicons: yellow mark centred on a near-black rounded square
for s in (32, 180, 512):
    bg = Image.new("RGBA", (s, s), (0, 0, 0, 0)); d = ImageDraw.Draw(bg)
    d.rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * 0.22), fill=(11, 11, 15, 255))
    m = mk.copy(); m.thumbnail((int(s * 0.74), int(s * 0.74)), Image.LANCZOS)
    col = Image.new("RGBA", m.size, (251, 228, 33, 255)); col.putalpha(m.getchannel("A"))
    bg.alpha_composite(col, ((s - m.width) // 2, (s - m.height) // 2))
    bg.save(os.path.join(out, f"favicon-{s}.png"), optimize=True)
print("favicons ok")
