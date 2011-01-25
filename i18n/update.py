#!/usr/bin/python

import sys
import os
import re

messages_map = {}
messages_keys = []

for path in sys.argv[2:]:
  line_number = 1
  for line in open(path, 'r'):
    m = re.search(r'(?<!\\)("[^"]*\\u[^"]*")', line)
    if m:
      if messages_map.has_key(m.group(1)):
        l = messages_map[m.group(1)]['line']
        if l.has_key(path):
          l[path].append(line_number)
        else:
          l[path] = [line_number]
          pass
      else:
        messages_map[m.group(1)] = {'line': {path: [line_number]}, 'msgid': m.group(1), 'msgstr': '""'}
        messages_keys.append(m.group(1))
        pass
      pass
    line_number += 1
    pass
  pass

if os.path.exists(sys.argv[1]):
  f = open(sys.argv[1], 'r')
  for line in f:
    m = re.match(r'(msgid|msgstr)=(".*")', line)
    if m:
      if m.group(1) == 'msgid':
        msgid = m.group(2)
      elif messages_map.has_key(msgid):
        messages_map[msgid]['msgstr'] = m.group(2)
      else:
        messages_map[msgid] = {'msgid': msgid, 'msgstr': m.group(2)}
        messages_keys.append(msgid)
        pass
      pass
    pass
  f.close()
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
