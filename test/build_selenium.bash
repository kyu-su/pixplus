#!/bin/bash

set -xe

if test ! -e selenium; then
  git clone https://github.com/SeleniumHQ/selenium.git
fi
cd selenium
./go selenium-server-standalone
cp $(find . -name selenium-standalone.jar) ..
