"""Build web images from the curated selection. Usage: python -I build_images.py <source-dir> <out-dir>
Writes <name>.jpg (long edge 1600) and <name>-sm.jpg (long edge 800), progressive, metadata stripped."""
import sys, os, json, glob
from PIL import Image, ImageOps
src, out = sys.argv[1], sys.argv[2]
sel = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "selection.json")))
def find(kind, n):
    if kind == "frame":
        return os.path.join(src, "frames", f"f{n}.jpg")
    folder = "12-September-2026-_All-photos" if kind == "photo" else "12-September-2026-_Edit-photos"
    hits = [p for p in glob.glob(os.path.join(src, "drive", folder, f"{n}__*")) if not os.path.basename(p).startswith("._")]
    return hits[0] if hits else None
total = 0
for name, ref in sel.items():
    if name.startswith("_"): continue
    kind, n = ref.split(":")
    p = find(kind, n)
    if not p or not os.path.exists(p):
        print("MISSING", name, ref); continue
    im = ImageOps.exif_transpose(Image.open(p)).convert("RGB")
    for suffix, edge, q in (("", 1600, 80), ("-sm", 800, 78)):
        c = im.copy(); c.thumbnail((edge, edge), Image.LANCZOS)
        dst = os.path.join(out, f"{name}{suffix}.jpg")
        c.save(dst, "JPEG", quality=q, optimize=True, progressive=True)
        total += os.path.getsize(dst)
    print(f"{name:20s} {ref:10s} {im.size[0]}x{im.size[1]} -> {c.size[0]*2}x{c.size[1]*2}")
print("total MB", round(total/1e6, 1))
