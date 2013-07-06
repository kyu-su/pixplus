#!/bin/bash
git clone https://code.google.com/p/selenium/
cd selenium
sed -i.bak 's/ -Xmx2048m / -Xmx1024m /' go
./go //java/server/src/org/openqa/selenium/remote/server:server:uber //java/client/src/org/openqa/selenium:client-combined:project
cp build/javascript/firefox-driver/webdriver.xpi py/selenium/webdriver/firefox/
cp -r build/java/client/src/org/openqa/selenium/firefox/{x86,amd64} py/selenium/webdriver/firefox/
cp build/java/server/src/org/openqa/selenium/remote/server/server-standalone.jar ./
