#!/bin/sh
for f in chromium chromium-browser "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; do
  path=`which "$f"`
  test $? -eq 0 && $path --version | grep Chromium >/dev/null && echo $path && exit 0
done
echo not found
