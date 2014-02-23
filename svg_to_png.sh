#!/bin/bash

RSVG_CONVERT=rsvg-convert
INKSCAPE=inkscape
GIMP=gimp

SVG=
PNG=
SIZE=

while test $# -gt 0; do
  case "$1" in
    -rsvg-convert) RSVG_CONVERT="$2"; shift ;;
    -inkscape)     INKSCAPE="$2"; shift ;;
    -gimp)         GIMP="$2"; shift ;;
    -svg)          SVG="$2"; shift ;;
    -png)          PNG="$2"; shift ;;
    -size)         SIZE="$2"; shift ;;
  esac
  shift
done

check_rsvg_convert() {
  "$RSVG_CONVERT" -v 2>/dev/null | grep rsvg-convert >/dev/null 2>&1
  return $?
}

run_rsvg_convert() {
  if test x"$SIZE" = x; then
    "$RSVG_CONVERT" "$SVG" -o "$PNG"
  else
    "$RSVG_CONVERT" "$SVG" -w "$SIZE" -o "$PNG"
  fi
  return $?
}

check_inkscape() {
  "$INKSCAPE" --version 2>/dev/null | grep Inkscape >/dev/null 2>&1
  return $?
}

run_inkscape() {
  if test x"$SIZE" = x; then
    "$INKSCAPE" -z -e "$PNG" "$SVG"
  else
    "$INKSCAPE" -z -e "$PNG" -w "$SIZE" -h "$SIZE" "$SVG"
  fi
  return $?
}

check_gimp() {
  "$GIMP" --version 2>/dev/null | grep 'GNU Image Manipulation Program' >/dev/null 2>&1
  return $?
}

run_gimp() {
  size=${SIZE:-0}
  <<EOF cat | "$GIMP" -ib - -b '(gimp-quit 0)'
(let* ((image (car (file-svg-load RUN-NONINTERACTIVE
                    "$SVG"
                    "$SVG"
                    90
                    $size
                    $size
                    0
                    )))
       (drawable (car (gimp-image-get-active-layer image)))
       )

  (gimp-file-save RUN-NONINTERACTIVE image drawable "$PNG" "$PNG")
  (gimp-image-delete image)
  (gimp-quit 0)
  )
EOF
  return $?
}

RUN_CMD=
CMD_TYPE=none

for cmd in rsvg_convert inkscape gimp; do
  if check_$cmd; then
    RUN_CMD=run_$cmd
    CMD_TYPE=$cmd
    break
  fi
done

if test x"$SVG" = x; then
  echo "$CMD_TYPE"
  test x"$RUN_CMD" != x
  exit $?
fi

if test x"$RUN_CMD" = x; then
  exit 1
fi

"$RUN_CMD" >/dev/null 2>&1
