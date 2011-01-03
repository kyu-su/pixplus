#!/bin/sh
for f in chromium-browser "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"; do
  which "$f" && exit 0
done
echo not found
