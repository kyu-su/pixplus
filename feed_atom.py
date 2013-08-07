import sys
import json

def gen_changes(changes):
  out = ['<ul>']
  for line in changes:
    out.append('  <li>%s</li>' % line)
    pass
  out.append('</ul>')
  return out

def gen_atom(changelog):
  print('''
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title type="text">pixplus</title>
  <id>http://crckyl.ath.cx/pixplus/feed.atom</id>
  <updated>2013-06-26T00:00:00Z</updated>
  <link href="http://crckyl.ath.cx/pixplus" />
  <link href="http://crckyl.ath.cx/pixplus/feed.atom" rel="self" />
  <author>
    <name>wowo</name>
    <uri>http://crckyl.ath.cx/</uri>
    <email>crckyl@myopera.com</email>
  </author>
  <subtitle type="text">pixplus changelogs</subtitle>
'''.strip('\n'))

  for item in changelog:
    version = item['version']
    date = item['date']

    changes = []
    changes_i18n = item.get('changes_i18n')
    if changes_i18n:
      for lng in 'ja', 'en':
        if lng not in changes_i18n:
          continue
        changes += gen_changes(changes_i18n[lng])
        pass
      pass
    else:
      changes += gen_changes(item.get('changes'))
      pass

    entry = '''
  <entry xml:base="http://crckyl.ath.cx/pixplus/feed.atom">
    <title type="text">pixplus %(ver)s</title>
    <id>http://crckyl.ath.cx/pixplus/archive/%(ver)s</id>
    <updated>%(date)sT00:00:00+09:00</updated>
    <link href="http://crckyl.ath.cx/pixplus/archive/%(ver)s" />
    <author>
      <name>wowo</name>
      <uri>http://crckyl.ath.cx/</uri>
      <email>crckyl@myopera.com</email>
    </author>
    <content type="html"><![CDATA[
      <h1>pixplus %(ver)s</h1>
      %(changes)s
    ]]></content>
  </entry>
'''.strip('\n') % {'ver': version,
                   'date': date.replace('/', '-'),
                   'changes': '\n      '.join(changes)}

    print(entry.encode('utf-8'))
    pass

  print('</feed>')
  pass

if __name__ == '__main__':
  gen_atom(json.load(sys.stdin)['data'])
  pass
