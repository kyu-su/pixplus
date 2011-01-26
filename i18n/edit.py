#!/usr/bin/python

import sys
import os
import re

from common import *

messages = parse_po(sys.argv[1])

for line in sys.stdin:
  for msg in messages.values():
    if msg['msgstr'] != '""' and line.find(msg['msgid']) >= 0:
      line = line.replace(msg['msgid'], msg['msgstr'])
      break
    pass
  sys.stdout.write(line)
