#!/usr/bin/python

import sys
import os
import json
import hashlib

from common import *

messages = {}
if os.path.exists(sys.argv[1]): parse_po(sys.argv[1], messages)

messages_json = {}
if os.path.exists(sys.argv[2]):
  json_fp = open(sys.argv[2], 'r')
  messages_json = json.load(json_fp)
  json_fp.close()
  pass

for line in sys.stdin:
  p = LIST_MESSAGES_REGEX.split(line)
  if len(p) > 1:
      msgid = '__MSG_%s__' % hashlib.sha1(p[1]).hexdigest()
      msgstr = p[1]
      if messages.has_key(msgstr): msgstr = messages[msgstr]['msgstr']
      messages_json[msgid] = {'message': json.loads(msgstr)}
      p[1] = '"%s"' % msgid
      sys.stdout.write(''.join(p))
      pass
  else:
    sys.stdout.write(line)
    pass
  pass

json_fp = open(sys.argv[2], 'w')
json_fp.write(json.dumps(messages_json))
json_fp.close()
