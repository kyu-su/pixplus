#!/bin/sh
CHROME=chromium:chromium-browser
for n in Chromium "Google Chrome"; do
  CHROME="$CHROME:/Applications/$n.app/Contents/MacOS/$n"
done
IFS=:
for f in $CHROME; do
  path=`which "$f" 2>/dev/null`
  test $? -eq 0 && "$path" --version | grep 'Chromium\|Chrome' >/dev/null && echo "$path" && exit 0
done
echo not found
