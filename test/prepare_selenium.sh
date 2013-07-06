#!/bin/bash
if test ! -d selenium; then
  git clone https://code.google.com/p/selenium/
  cd selenium
else
  cd selenium
  git reset --hard
  git pull
  rm -rf py/selenium/webdriver/firefox/{x86,amd64,webdriver.xpi}
  rm selenium-standalone.jar
fi

sed -i.bak 's/ -Xmx2048m / -Xmx1024m /' go
./go clean
./go selenium-server-standalone
cp build/javascript/firefox-driver/webdriver.xpi py/selenium/webdriver/firefox/
cp -r build/java/client/src/org/openqa/selenium/firefox/{x86,amd64} py/selenium/webdriver/firefox/
cp build/java/server/src/org/openqa/grid/selenium/selenium-standalone.jar ./
