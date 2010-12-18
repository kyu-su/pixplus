#!/bin/sh
#sed -e '1,/\/\* __CONFIG_BEGIN__ \*\//d' -e '/\/\* __CONFIG_END__ \*\//,$d' < includes/pixplus.js \
#  | perl -pe "s/',[\r\n]+/', /g" /dev/stdin \
#  | awk -f conf-parser.awk /dev/stdin
#sed -e '1,/\/\* __CONFIG_BEGIN__ \*\//d' -e '/\/\* __CONFIG_END__ \*\//,$d' < includes/pixplus.js \
#  | perl -pe "s/',[\r\n]+/', /g" /dev/stdin | tr -d '\r\n' \
#  | sed -e 's/^/{/' -e 's/$/}/' -e 's/ \([a-zA-Z0-9_]*\):/"\1":/g' -e "s/'/\"/g" \
#  | python conf-parser.py
sed -e '1,/\/\* __CONFIG_BEGIN__ \*\//d' -e '/\/\* __CONFIG_END__ \*\//,$d' < includes/pixplus.js \
  | sed -e '1 s/^/{/' -e '$ s/$/}/' | python conf-parser.py
