#!/bin/bash
# Builds every still and clip the IKIGAI mockups use, from the client's media folder.
# Usage: bash build_ikigai.sh <ikigai_media-dir> <mockups/shared-dir>
#   img/<k>.jpg (1600px long edge) + img/<k>-sm.jpg (800px)   stills
#   img/xl/<k>.jpg (≤2400px)                                   hero-grade stills
#   img/hero/<k>.jpg (3200x1800) + -sm (1920x1080)             16:9 heroes from the enhanced panoramas
#   video/<k>.mp4 (720x1280 loop) + .jpg poster                portrait loops
#   video/<k>-wide.mp4 (1280x720) + .jpg                       16:9: the portrait clip over a blurred, dimmed copy of itself
#   (no video/hq: the sources are phone video, so IK.vidHQ = IK.vid)
set -euo pipefail
SRC="$1"; OUT="$2"
FF=(ffmpeg -nostdin -hide_banner -loglevel error -y)
ENC=(-c:v libx264 -preset medium -profile:v high -pix_fmt yuv420p -movflags +faststart)
mkdir -p "$OUT/img/xl" "$OUT/img/hero" "$OUT/video"
UP="$SRC/ikigai-enhanced-backgrounds/upscaled"; PANO="$SRC/ikigai-enhanced-backgrounds/panoramic"
POSTER="$SRC/WhatsApp Image 2026-11-20 at 10.53.10 AM.jpeg"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

still() { # key source-file  → 1600 / 800 long edge (never upscaled past 1.6x)
  local k="$1" f="$2"
  "${FF[@]}" -i "$f" -vf "scale='if(gt(iw,ih),min(1600,iw*1.6),-2)':'if(gt(iw,ih),-2,min(1600,ih*1.6))':flags=lanczos" -q:v 3 "$OUT/img/$k.jpg"
  "${FF[@]}" -i "$f" -vf "scale='if(gt(iw,ih),min(800,iw*1.6),-2)':'if(gt(iw,ih),-2,min(800,ih*1.6))':flags=lanczos" -q:v 4 "$OUT/img/$k-sm.jpg"
}
frame() { # key video time → a still from the clip
  "${FF[@]}" -ss "$3" -i "$2" -frames:v 1 -q:v 2 "$TMP/$1.png"; still "$1" "$TMP/$1.png"
}

# --- 1. the enhanced photos (portrait cuts) + their 16:9 panoramas ---
for k in boxing-mural dumbbells exterior functional gym-floor ikigai-sign plate-machine power-rack punchbag; do
  still "$k" "$UP/ikigai-$k-portrait.jpg"
  "${FF[@]}" -i "$UP/ikigai-$k-portrait.jpg" -vf "scale='if(gt(ih,2400),-2,iw)':'min(2400,ih)':flags=lanczos" -q:v 3 "$OUT/img/xl/$k.jpg"
  "${FF[@]}" -i "$PANO/ikigai-$k-pano-4k.jpg" -vf "scale=3200:1800:flags=lanczos" -q:v 4 "$OUT/img/hero/$k.jpg"
  "${FF[@]}" -i "$PANO/ikigai-$k-pano-4k.jpg" -vf "scale=1920:1080:flags=lanczos" -q:v 4 "$OUT/img/hero/$k-sm.jpg"
done

# --- 2. the floor with the wall slogan, and tiles cut from the facilities poster ---
still slogan-floor "$SRC/WhatsApp Image 2026-11-20 at 10.53.14 AM.jpeg"
"${FF[@]}" -i "$SRC/WhatsApp Image 2026-11-20 at 10.53.14 AM.jpeg" -q:v 3 "$OUT/img/xl/slogan-floor.jpg"
crop() { "${FF[@]}" -i "$POSTER" -vf "crop=$2" "$TMP/$1.png"; still "$1" "$TMP/$1.png"; }
crop boxing-sign 420:255:105:165
crop air-bikes 420:255:572:165
crop steam-room 420:255:105:460
crop washroom 420:255:572:460

# --- 3. stills taken from the club's videos ---
frame zumba-class "$SRC/zumba.mp4" 17.5
frame zumba-smile "$SRC/zumba.mp4" 2.0
frame dance-class "$SRC/WhatsApp Video 2026-11-20 at 10.53.15 AM.mp4" 12.7
frame dance-crew "$SRC/WhatsApp Video 2026-11-20 at 10.53.15 AM.mp4" 18.0
frame treadmills "$SRC/WhatsApp Video 2026-11-20 at 10.53.14 AM.mp4" 0.3
frame airbike-rider "$SRC/WhatsApp Video 2026-11-20 at 10.53.13 AM.mp4" 2.0
frame trek-bridge "$SRC/WhatsApp Video 2026-11-20 at 10.53.10 AM (1).mp4" 4.7
frame trek-river "$SRC/WhatsApp Video 2026-11-20 at 10.53.10 AM (1).mp4" 0.6
frame runner "$SRC/background.mp4" 5.6

# --- 4. clips ---
poster_of() { "${FF[@]}" -i "$1.mp4" -frames:v 1 -q:v 4 "$1.jpg"; }
wide_of() { # 16:9 version: the portrait clip, centred, over a blurred and dimmed copy of itself
  "${FF[@]}" -i "$1.mp4" -filter_complex "[0:v]split[a][b];[a]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,boxblur=28:2,eq=brightness=-0.16:saturation=0.8[bg];[b]scale=-2:720[fg];[bg][fg]overlay=(W-w)/2:0" "${ENC[@]}" -crf 27 -an "$1-wide.mp4"
  poster_of "$1-wide"
}
clip() { # key source start duration mode(loop|pingpong|audio) [crop-filter]
  local k="$1" f="$2" ss="$3" d="$4" mode="$5" pre="${6:-null}" base="$OUT/video/$1"
  local vf="$pre,fps=25,scale=720:1280:force_original_aspect_ratio=increase:flags=lanczos,crop=720:1280"
  case "$mode" in
    loop) "${FF[@]}" -ss "$ss" -t "$d" -i "$f" -vf "$vf" "${ENC[@]}" -crf 26 -an "$base.mp4" ;;
    pingpong) "${FF[@]}" -ss "$ss" -t "$d" -i "$f" -filter_complex "[0:v]$vf,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[v]" -map "[v]" "${ENC[@]}" -crf 26 -an "$base.mp4" ;;
    audio) "${FF[@]}" -ss "$ss" -t "$d" -i "$f" -vf "$vf" "${ENC[@]}" -crf 25 -c:a aac -b:a 96k "$base.mp4" ;;
  esac
  poster_of "$base"; wide_of "$base"
}
# Push-ins rescale every frame (sub-pixel lanczos) and crop the centre. Don't use zoompan here: it rounds to whole
# pixels, so the picture shakes and the files come out 5-10x bigger.
PUSH="scale=w='trunc(720*(1+0.08*n/NF)/2)*2':h=-2:eval=frame:flags=lanczos,crop=720:1280"
kenburns() { # key image seconds → slow push-in on a still (for spaces with no footage yet)
  local k="$1" f="$2" d="$3" n=$(( $3 * 25 )) base="$OUT/video/$1"
  "${FF[@]}" -loop 1 -framerate 25 -t "$d" -i "$f" -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,${PUSH//NF/$n}" "${ENC[@]}" -crf 27 -an "$base.mp4"
  poster_of "$base"; wide_of "$base"
}
restore() { # steam room then washroom: each small poster tile centred over a blurred fill, slow push, crossfade
  local base="$OUT/video/restore"
  for t in steam-room washroom; do
    "${FF[@]}" -loop 1 -framerate 25 -t 4 -i "$TMP/$t.png" -filter_complex "[0:v]split[a][b];[a]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,boxblur=30:2,eq=brightness=-0.18[bg];[b]scale=700:-2:flags=lanczos[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,${PUSH//NF/100}" "${ENC[@]}" -crf 27 -an "$TMP/r-$t.mp4"
  done
  "${FF[@]}" -i "$TMP/r-steam-room.mp4" -i "$TMP/r-washroom.mp4" -filter_complex "[0][1]xfade=transition=fade:duration=0.8:offset=3.2" "${ENC[@]}" -crf 27 -an "$base.mp4"
  poster_of "$base"; wide_of "$base"
}

clip zumba "$SRC/zumba.mp4" 15.5 6 loop
clip dance "$SRC/WhatsApp Video 2026-11-20 at 10.53.15 AM.mp4" 9 6 loop
clip airbike "$SRC/WhatsApp Video 2026-11-20 at 10.53.13 AM.mp4" 0 5.1 loop
clip treadmills "$SRC/WhatsApp Video 2026-11-20 at 10.53.14 AM.mp4" 0 3.0 pingpong "crop=506:900"
clip trek "$SRC/WhatsApp Video 2026-11-20 at 10.53.10 AM (1).mp4" 0.5 8 loop
clip film "$SRC/background.mp4" 0 14.32 audio
clip day "$SRC/zumba.mp4" 0 20.6 audio
kenburns boxing "$UP/ikigai-boxing-mural-portrait.jpg" 6
kenburns floor "$SRC/WhatsApp Image 2026-11-20 at 10.53.14 AM.jpeg" 6
kenburns rack "$UP/ikigai-power-rack-portrait.jpg" 6
kenburns bag "$UP/ikigai-punchbag-portrait.jpg" 6
kenburns sign "$UP/ikigai-ikigai-sign-portrait.jpg" 6
restore

# No separate hero-grade clips: the sources are phone video, so IK.vidHQ points at these same files.
echo "stills: $(ls "$OUT/img" | grep -c 'jpg$')  clips: $(ls "$OUT/video" | grep -c 'mp4$')"
du -sh "$OUT/img" "$OUT/video"
