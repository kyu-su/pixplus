#!/bin/bash

if test "${RSVG_CONVERT:-x}" = x; then
  RSVG_CONVERT=rsvg-convert
fi

if test "${INKSCAPE:-x}" = x; then
  for cmd in gimp /Applications/Inkscape.app/Contents/Resources/script; do
    if which $cmd >/dev/null 2>&1; then
      INKSCAPE=$cmd
      break
    fi
  done
fi

if test "${GIMP:-x}" = x; then
  for cmd in gimp /Applications/GIMP.app/Contents/MacOS/GIMP; do
    if which $cmd >/dev/null 2>&1; then
      GIMP=$cmd
      break
    fi
  done
fi

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
  <<EOF "$GIMP" -ib - -b '(gimp-quit 0)'
(let* ((image (car (file-svg-load
                      RUN-NONINTERACTIVE ; run-mode     INT32  The run mode { RUN-INTERACTIVE (0), RUN-NONINTERACTIVE (1) }
                      "$SVG"             ; filename     STRING The name of the file to load
                      "$SVG"             ; raw-filename STRING The name of the file to load
                      90                 ; resolution   FLOAT  Resolution to use for rendering the SVG (defaults to 90 dpi)
                      $size              ; width        INT32  Width (in pixels) to load the SVG in. (0 for original width, a negative width to specify a maximum width)
                      $size              ; height       INT32  Height (in pixels) to load the SVG in. (0 for original height, a negative width to specify a maximum height)
                      0                  ; paths        INT32  Whether to not import paths (0), import paths individually (1) or merge all imported paths (2)
                      )))
       (drawable (car (gimp-image-get-active-layer image)))
       )

  (gimp-file-save
     RUN-NONINTERACTIVE  ; run-mode     INT32    The run mode { RUN-INTERACTIVE (0), RUN-NONINTERACTIVE (1), RUN-WITH-LAST-VALS (2) }
     image               ; image        IMAGE    Input image
     drawable            ; drawable     DRAWABLE Drawable to save
     "$PNG"              ; filename     STRING   The name of the file to save the image in
     "$PNG"              ; raw-filename STRING   The name as entered by the user
     )
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
