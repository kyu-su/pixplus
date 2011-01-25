#!/usr/bin/python

import sys
import re

messages = {}

f = open(sys.argv[1], 'r')
for line in f:
  m = re.match(r'(msgid|msgstr)=(".*")', line)
  if m:
    if m.group(1) == 'msgid':
      msgid = m.group(2)
    else:
      messages[msgid] = {'msgid': msgid, 'msgstr': m.group(2)}
      pass
    pass
  pass
f.close()

for line in sys.stdin:
  for msg in messages.values():
    if msg['msgstr'] != '""' and line.find(msg['msgid']) >= 0:
      line = line.replace(msg['msgid'], msg['msgstr'])
      break
    pass
  sys.stdout.write(line)
