#!/bin/bash
# Hero-grade clips: same cuts as clips.txt, but at the camera's native 1080x1920 and high quality (CRF 19),
# plus native 1080x608 16:9 crops (no upscaling). Output: <out>/hq/<name>.mp4 (+ -wide.mp4, posters).
# Usage: build_video_hq.sh <ffmpeg> <src-dir> <out-dir> [name-regex]
set -euo pipefail
FF="$1"; SRC="$2"; OUT="$3/hq"; ONLY="${4:-.}"; mkdir -p "$OUT"
HERE="$(cd "$(dirname "$0")" && pwd)"
while IFS='|' read -r name src ss dur mode cy; do
  [[ -z "$name" || "$name" == \#* ]] && continue
  [[ "$name" =~ $ONLY ]] || continue
  [[ "$mode" == "audio" ]] && continue
  in="$SRC/$src"; base="$OUT/$name"
  common=(-nostdin -hide_banner -loglevel error -y -ss "$ss" -t "$dur" -i "$in")
  enc=(-c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -movflags +faststart -crf 19 -an)
  if [[ "$mode" == "pingpong" ]]; then
    "$FF" "${common[@]}" -filter_complex "[0:v]fps=25,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[v]" -map "[v]" "${enc[@]}" "$base.mp4"
  else
    "$FF" "${common[@]}" -vf "fps=25" "${enc[@]}" "$base.mp4"
  fi
  "$FF" -nostdin -hide_banner -loglevel error -y -i "$base.mp4" -frames:v 1 -q:v 2 "$base.jpg"
  if [[ "$cy" != "-" ]]; then
    vf="fps=25,crop=1080:608:0:'min(max(0,ih*$cy-304),ih-608)'"
    if [[ "$mode" == "pingpong" ]]; then
      "$FF" "${common[@]}" -filter_complex "[0:v]$vf,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[v]" -map "[v]" "${enc[@]}" "$base-wide.mp4"
    else
      "$FF" "${common[@]}" -vf "$vf" "${enc[@]}" "$base-wide.mp4"
    fi
    "$FF" -nostdin -hide_banner -loglevel error -y -i "$base-wide.mp4" -frames:v 1 -q:v 2 "$base-wide.jpg"
  fi
  printf "%-12s %s\n" "$name" "$(for f in "$base".mp4 "$base"-wide.mp4; do [ -f "$f" ] && printf "%s=%sKB " "$(basename "$f")" "$(( $(stat -f %z "$f") / 1024 ))"; done)"
done < "$HERE/clips.txt"
