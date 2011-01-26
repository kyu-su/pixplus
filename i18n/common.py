import re

LIST_MESSAGES_REGEX = re.compile(r'(?<!\\)("[^"]*\\u[^"]*")')

def list_messages(path, target):
  line_number = 1
  f = open(path, 'r')
  for line in f:
    m = LIST_MESSAGES_REGEX.search(line)
    if m:
      if isinstance(target, tuple):
        if target[0].has_key(m.group(1)):
          target[0][m.group(1)]['line'].append((path, line_number))
        else:
          target[0][m.group(1)] = {'line': [(path, line_number)], 'msgid': m.group(1), 'msgstr': m.group(1)}
          target[1].append(m.group(1))
          pass
      elif callable(target):
        target(line, m.group(1))
        pass
      else:
        raise TypeError('invalid argument')
      pass
    line_number += 1
    pass
  f.close()
  pass

def parse_po(path, target = {}):
  f = open(path, 'r')
  for line in f:
    m = re.match(r'(msgid|msgstr) (".*")', line)
    if m:
      if m.group(1) == 'msgid':
        msgid = m.group(2)
      else:
        if isinstance(target, dict):
          target[msgid] = {'msgid': msgid, 'msgstr': m.group(2)}
        elif callable(target):
          target(msgid, m.group(2))
        else:
          raise TypeError('invalid argument')
        pass
      pass
    pass
  f.close()
  return target
