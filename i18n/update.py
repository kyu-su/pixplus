#!/usr/bin/python

import sys
import os
import re

from common import *

messages_map = {}
messages_keys = []

for path in sys.argv[2:]:
  list_messages(path, (messages_map, messages_keys))
  pass

if os.path.exists(sys.argv[1]):
  def po_cb(msgid, msgstr):
    if messages_map.has_key(msgid):
      messages_map[msgid]['msgstr'] = msgstr
    elif msgstr != '""':
      messages_map[msgid] = {'msgid': msgid, 'msgstr': msgstr}
      messages_keys.append(msgid)
      pass
    pass
  parse_po(sys.argv[1], po_cb)
  pass

f = open(sys.argv[1], 'w')
for key in messages_keys:
  msg = messages_map[key]
  raw = re.split(r'\\u([0-9a-z]{4})', msg['msgid'])
  for idx in range(len(raw) / 2):
    raw[idx * 2 + 1] = unichr(int(raw[idx * 2 + 1], 16))
    pass
  p = ''
  l = ''
  if msg.has_key('line'):
    for path in sys.argv[2:]:
      if msg['line'].has_key(path):
        l += '%s:%s ' % (path, ':'.join(map(str, msg['line'][path])))
        pass
      pass
  else:
    p = '# '
    pass
  f.write(('# %s%s\n' % (l, ''.join(raw))).encode('utf-8'))
  f.write('%smsgid=%s\n' % (p, msg['msgid']))
  f.write('%smsgstr=%s\n\n' % (p, msg['msgstr']))
f.close()
