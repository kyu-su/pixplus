#!/bin/bash

PRLCTL=prlctl
PORT=1234
SELENIUM_SERVER_JAR=selenium-standalone.jar

MACHINE="$1"
SNAPSHOT_UUID="$2"
USER="$3"

shift; shift; shift

machine_list() {
  $PRLCTL list --all 1>&2
}

snapshot_list() {
  $PRLCTL snapshot-list "$MACHINE" --tree 1>&2
}

usage() {
  echo "usage: $(basename $0) <Machine name|Machine ID> <Snapshot ID> <user name>" 1>&2

  (echo; echo Machines:) 1>&2
  machine_list

  if test x"$MACHINE" != x; then
    (echo; echo Snapshots of "'$MACHINE'":) 1>&2
    snapshot_list
  fi

  exit 1
}

search_netdev() {
  $PRLCTL list --info "$MACHINE_UUID" | grep '^  net\d* (+) type=shared '
}

netdev_mac() {
  search_netdev | head -1 | sed 's/.* mac=\([0-9a-fA-F]*\) .*/\1/'
}

if test ! -f "$SELENIUM_SERVER_JAR"; then
  cat 1>&2 <<EOF
Selenium server jar file not found. Build it before running this script.
You can build selenium-standalone.jar automatically by running the command below:

  $ ./build_selenium.bash
EOF
  exit 1
fi

if test x"$MACHINE" = x; then
  usage
fi

if $PRLCTL list --info "$MACHINE" >/dev/null 2>&1; then
  MACHINE_UUID=$($PRLCTL list --info "$MACHINE" | grep '^ID: ' | awk '{print $2}')
else
  usage
  exit 1
fi

if test x"$SNAPSHOT_UUID" = x -o x"$USER" = x; then
  usage
  exit 1
fi

echo "UUID: $MACHINE_UUID"

set -xe

if test ! -f mac2ipaddr; then
  gcc -Wall -Wextra -mmacosx-version-min=10.5 mac2ipaddr.c -o mac2ipaddr
fi

$PRLCTL snapshot-switch "$MACHINE_UUID" -i "$SNAPSHOT_UUID"

if search_netdev >/dev/null 2>&1; then
  MACADDR=$(netdev_mac)
else
  echo "There's no usable network device" 1>&2
  exit 1
fi

echo "Network card: $MACADDR"

$PRLCTL start "$MACHINE_UUID"

echo 'Waiting for vm...'
while true; do
  sleep 3
  if $PRLCTL status "$MACHINE_UUID" 2>/dev/null | grep ' exist running' >/dev/null 2>&1; then
    if $PRLCTL exec "$MACHINE_UUID" true >/dev/null 2>&1; then
      # successfully started
      break
    fi
  else
    echo 'VM was stopped unexpectedly...' 1>&2
    exit 1
  fi
done

echo 'Waiting for network device...'

while true; do
  sleep 3
  $PRLCTL exec "$MACHINE_UUID" 'cat>/mac2ipaddr;chmod +x /mac2ipaddr' < mac2ipaddr
  if read IPADDR < <($PRLCTL exec "$MACHINE_UUID" "/mac2ipaddr $MACADDR"); then
    echo "IP addr: $IPADDR"
    break
  fi
done

$PRLCTL exec "$MACHINE_UUID" 'cat>/selenium-standalone.jar' < "$SELENIUM_SERVER_JAR"
$PRLCTL exec "$MACHINE_UUID" "sudo -u $USER java -jar /selenium-standalone.jar -port $PORT" >selenium.log 2>&1 &

echo 'Waiting for selenium server...'
while true; do
  sleep 3
  if curl -f "http://$IPADDR:$PORT/selenium-server/driver/?cmd=getLogMessages" >/dev/null 2>&1; then
    break
  fi
done

echo "All done! Use this: $IPADDR:$PORT"

python main.py -d $IPADDR -p $PORT "$@"
