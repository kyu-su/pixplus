#!/bin/sh
for f in chromium chromium-browser /Applications/Chromium.app/Contents/MacOS/Chromium; do
  path=`which "$f" 2>/dev/null`
  test $? -eq 0 && "$path" --version | grep 'Chromium\|Chrome' >/dev/null && echo "$path" && exit 0
done
echo not found
