#!/bin/sh
ROOT=`dirname $0`/..
OUT=`dirname $0`/sign
mkdir -p $OUT
echo "out: $OUT"
$ROOT/ext/xar/xar/src/xar --extract-certs $OUT -f $1
openssl pkcs12 -in $2 -nodes -nocerts -out $OUT/key.pem
