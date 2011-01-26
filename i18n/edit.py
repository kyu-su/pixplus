#!/usr/bin/python

import sys
import os
import re

from common import *

messages = {}
if os.path.exists(sys.argv[1]): parse_po(sys.argv[1], messages)

for line in sys.stdin:
  for msg in messages.values():
    if msg['msgstr'] != '""' and line.find(msg['msgid']) >= 0:
      line = line.replace(msg['msgid'], msg['msgstr'])
      break
    pass
  sys.stdout.write(line)
