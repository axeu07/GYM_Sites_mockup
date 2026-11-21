"""Hero-grade stills from the 24 MP originals (photo:/edit: entries in selection.json).
Writes  img/xl/<key>.jpg        2400px long edge (crisp in large frames on 2560-4K screens)
        img/hero/<key>.jpg       3200x1800 16:9 crop around a focal point (full-width heroes)
        img/hero/<key>-sm.jpg    1920x1080 version of the same crop
Usage: python -I build_hero.py <_source> <mockups/shared/img> [--sheet <out.jpg>]"""
import sys, os, json, glob
from PIL import Image, ImageOps, ImageDraw
src, out = sys.argv[1], sys.argv[2]
sheet = sys.argv[sys.argv.index("--sheet") + 1] if "--sheet" in sys.argv else None
here = os.path.dirname(os.path.abspath(__file__))
sel = json.load(open(os.path.join(here, "selection.json")))
# focal point (x, y as 0-1 of the image) for the 16:9 crop; default centre
FOCUS = json.load(open(os.path.join(here, "hero_focus.json"))) if os.path.exists(os.path.join(here, "hero_focus.json")) else {}
os.makedirs(os.path.join(out, "xl"), exist_ok=True); os.makedirs(os.path.join(out, "hero"), exist_ok=True)
thumbs = []
for key, ref in sel.items():
    if key.startswith("_") or not ref.startswith(("photo:", "edit:")): continue
    kind, n = ref.split(":")
    folder = "12-September-2026-_All-photos" if kind == "photo" else "12-September-2026-_Edit-photos"
    hits = [p for p in glob.glob(os.path.join(src, "drive", folder, f"{n}__*")) if not os.path.basename(p).startswith("._")]
    if not hits: print("MISSING", key); continue
    im = ImageOps.exif_transpose(Image.open(hits[0])).convert("RGB")
    xl = im.copy(); xl.thumbnail((2400, 2400), Image.LANCZOS)
    xl.save(os.path.join(out, "xl", f"{key}.jpg"), "JPEG", quality=84, optimize=True, progressive=True)
    W, H = im.size; fx, fy = FOCUS.get(key, [0.5, 0.5])
    cw = W; ch = round(W * 9 / 16)
    if ch > H: ch = H; cw = round(H * 16 / 9)
    x0 = min(max(0, round(fx * W - cw / 2)), W - cw); y0 = min(max(0, round(fy * H - ch / 2)), H - ch)
    crop = im.crop((x0, y0, x0 + cw, y0 + ch))
    for suffix, size, q in (("", (3200, 1800), 82), ("-sm", (1920, 1080), 80)):
        c = crop.resize(size, Image.LANCZOS) if crop.width >= size[0] else crop.copy()
        c.save(os.path.join(out, "hero", f"{key}{suffix}.jpg"), "JPEG", quality=q, optimize=True, progressive=True)
    print(f"{key:16s} {W}x{H}  crop {cw}x{ch} @({fx},{fy})  → hero {'3200x1800' if crop.width >= 3200 else crop.size}")
    if sheet: t = crop.resize((480, 270), Image.LANCZOS); thumbs.append((key, t))
if sheet and thumbs:
    cols = 4; rows = (len(thumbs) + cols - 1) // cols
    S = Image.new("RGB", (cols * 484, rows * 290), (30, 30, 30)); d = ImageDraw.Draw(S)
    for i, (k, t) in enumerate(thumbs):
        x, y = (i % cols) * 484, (i // cols) * 290; S.paste(t, (x, y)); d.text((x + 4, y + 273), k, fill=(255, 230, 0))
    S.save(sheet, quality=84); print("sheet", sheet)
