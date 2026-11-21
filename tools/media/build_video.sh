#!/bin/bash
# Encodes the curated Drive clips (listed in clips.txt) into web loops.
# Usage: build_video.sh <ffmpeg> <src-dir> <out-dir> [name-regex]   (regex limits which clips are rebuilt)
# name | source | start | duration | mode (loop|pingpong|audio) | wide-crop centre (0-1, or - for none)
set -euo pipefail
FF="$1"; SRC="$2"; OUT="$3"; ONLY="${4:-.}"; mkdir -p "$OUT"
HERE="$(cd "$(dirname "$0")" && pwd)"
while IFS='|' read -r name src ss dur mode cy; do
  [[ -z "$name" || "$name" == \#* ]] && continue
  [[ "$name" =~ $ONLY ]] || continue
  in="$SRC/$src"; base="$OUT/$name"
  common=(-nostdin -hide_banner -loglevel error -y -ss "$ss" -t "$dur" -i "$in")
  enc=(-c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -movflags +faststart)
  case "$mode" in
    loop)     "$FF" "${common[@]}" -vf "fps=25,scale=720:1280:flags=lanczos" "${enc[@]}" -crf 27 -an "$base.mp4" ;;
    pingpong) "$FF" "${common[@]}" -filter_complex "[0:v]fps=25,scale=720:1280:flags=lanczos,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[v]" -map "[v]" "${enc[@]}" -crf 27 -an "$base.mp4" ;;
    audio)    "$FF" "${common[@]}" -vf "fps=30,scale=720:1280:flags=lanczos" "${enc[@]}" -crf 26 -c:a aac -b:a 96k "$base.mp4" ;;
  esac
  "$FF" -nostdin -hide_banner -loglevel error -y -i "$base.mp4" -frames:v 1 -q:v 4 "$base.jpg"
  if [[ "$cy" != "-" ]]; then
    # 16:9 band out of the 9:16 frame, centred at cy of the height
    "$FF" "${common[@]}" -vf "fps=25,crop=1080:608:0:'min(max(0,ih*$cy-304),ih-608)',scale=1280:720:flags=lanczos" "${enc[@]}" -crf 27 -an "$base-wide.mp4"
    "$FF" -nostdin -hide_banner -loglevel error -y -i "$base-wide.mp4" -frames:v 1 -q:v 4 "$base-wide.jpg"
  fi
  printf "%-12s %s\n" "$name" "$(for f in "$base".mp4 "$base"-wide.mp4; do [ -f "$f" ] && printf "%s=%sKB " "$(basename "$f")" "$(( $(stat -f %z "$f") / 1024 ))"; done)"
done < "$HERE/clips.txt"
