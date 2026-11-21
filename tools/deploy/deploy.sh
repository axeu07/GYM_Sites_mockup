#!/usr/bin/env bash
# Deploys mockups/ to Vercel as a static site (free Hobby plan).
#   bash deploy/deploy.sh            deploy; on the first run it deploys twice so link previews get the real address
#   SITE_URL=https://… bash deploy/deploy.sh   force the address used for link previews (custom domain)
#   DRY_RUN=1 bash deploy/deploy.sh  build the clean copy and report its size, but do not upload
# First time on a machine: `npx vercel login`. The project link (.vercel/) is kept in tools/deploy/.vercel so
# later runs update the same URL. The drive is exFAT (creates ._* files), so we deploy from a clean copy that
# also leaves out stills and clips no page refers to.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/../../mockups"
TMP="${TMPDIR:-/tmp}"; OUT="${TMP%/}/ikigai-directions"

build_copy() {
  rm -rf "$OUT" && mkdir -p "$OUT"
  rsync -a --exclude '._*' --exclude '.DS_Store' "$SRC/" "$OUT/"
  cp "$HERE/vercel.json" "$HERE/robots.txt" "$OUT/"
  [ -d "$HERE/.vercel" ] && cp -R "$HERE/.vercel" "$OUT/.vercel"
  # Drop media that nothing references (keys appear as quoted strings or file names in the page sources).
  HERE="$HERE" python3 - "$OUT" <<'PY'
import os, re, sys
out = sys.argv[1]
src = ""
for root, _, files in os.walk(out):
    if "/shared/img" in root or "/shared/video" in root: continue
    for f in files:
        if f.endswith((".html", ".js", ".css")):
            src += open(os.path.join(root, f), encoding="utf-8", errors="ignore").read() + "\n"
def used(key):
    return re.search(r'["\'`/]%s(["\'`]|(-sm|-wide)?\.(jpg|mp4))' % re.escape(key), src) is not None
kept = dropped = saved = 0
# Hero-grade folders ship only what tools/deploy/hq-keep.txt lists; the rest by reference.
here = os.environ.get("HERE", "")
keep = {l.strip() for l in open(os.path.join(here, "hq-keep.txt")) if l.strip() and not l.startswith("#")}
HQ = ("video/hq", "img/hero", "img/xl")
for sub in ("shared/img", "shared/video"):
    for root, _, files in os.walk(os.path.join(out, sub)):
        rel = os.path.relpath(root, os.path.join(out, "shared"))
        for f in sorted(files):
            key = os.path.splitext(f)[0]
            # images have -sm variants, videos have -wide variants: strip only the one that applies
            # (an image key can itself end in "-wide", e.g. turf-wide)
            strip = "-sm" if sub == "shared/img" else "-wide"
            if key.endswith(strip): key = key[: -len(strip)]
            p = os.path.join(root, f)
            ok = (f"{rel}/{key}" in keep) if rel in HQ else used(key)
            if ok: kept += 1
            else: saved += os.path.getsize(p); os.remove(p); dropped += 1
total = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(out) for f in fs)
print(f"clean copy: {total/1e6:.1f} MB ({kept} media files kept, {dropped} unreferenced dropped, {saved/1e6:.1f} MB saved)")
PY
}

inject_previews() { # $1 = site address without trailing slash
  perl -0pi -e "s#<meta name=\"twitter:card\"#<meta property=\"og:url\" content=\"$1/\">\n<meta property=\"og:image\" content=\"$1/shared/og.jpg\">\n<meta property=\"og:image:width\" content=\"1200\">\n<meta property=\"og:image:height\" content=\"630\">\n<meta name=\"twitter:image\" content=\"$1/shared/og.jpg\">\n<meta name=\"twitter:card\"#" "$OUT/index.html"
}

upload() { # prints the deployment URL on the last line
  (cd "$OUT" && npx --yes vercel@latest deploy --prod --yes "$@")
  [ -d "$OUT/.vercel" ] && rm -rf "$HERE/.vercel" && cp -R "$OUT/.vercel" "$HERE/.vercel"
}

build_copy
if [ -n "${DRY_RUN:-}" ]; then echo "dry run: nothing uploaded ($OUT)"; exit 0; fi

if [ -n "${SITE_URL:-}" ]; then
  inject_previews "${SITE_URL%/}"; upload "$@"
elif [ -f "$HERE/site-url.txt" ]; then
  inject_previews "$(cat "$HERE/site-url.txt")"; upload "$@"
else
  # First deploy: we only learn the address afterwards, so deploy, read the production address, then deploy again with it.
  upload "$@"
  NAME="$(python3 -c "import json,sys; print(json.load(open(sys.argv[1]))['projectName'])" "$HERE/.vercel/project.json" 2>/dev/null || true)"
  URL="$(cd "$OUT" && npx --yes vercel@latest inspect "$(cd "$OUT" && npx --yes vercel@latest ls --prod 2>/dev/null | grep -o 'https://[^ ]*' | head -1)" 2>&1 | grep -o "https://${NAME:-ikigai-directions}[a-z0-9-]*\.vercel\.app" | awk '{ print length, $0 }' | sort -n | head -1 | cut -d' ' -f2- || true)"
  if [ -n "$URL" ]; then
    echo "$URL" > "$HERE/site-url.txt"; echo "production address: $URL — redeploying with link previews"
    build_copy; inject_previews "$URL"; upload "$@"
  else
    echo "Could not read the production address. Run again with SITE_URL=https://<project>.vercel.app to add link previews."
  fi
fi
