import sys
import json

i18n = {
  'changes': {'ja': '\u5909\u66f4\u70b9', 'en': 'Changes'}
  }

def atom_changes(changes):
  out = ['<ul>']
  for line in changes:
    out.append('  <li>%s</li>' % line)
    pass
  out.append('</ul>')
  return out

def make_atom_time(version):
  return '%sT00:00:00.000Z' % version['date'].replace('/', '-')

def atom(changelog):
  out = []

  out.append('''
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title type="text">pixplus</title>
  <id>http://crckyl.ath.cx/pixplus/release.atom</id>
  <updated>%(time)s</updated>
  <link href="http://crckyl.ath.cx/pixplus/" />
  <link href="http://crckyl.ath.cx/pixplus/release.atom" rel="self" />
  <author>
    <name>wowo</name>
    <uri>http://crckyl.ath.cx/</uri>
    <email>crckyl@gmail.com</email>
  </author>
  <subtitle type="text">pixplus changelogs</subtitle>
'''.strip('\n') % {'time': make_atom_time(changelog[0])})

  for version in changelog:
    changes = []
    changes_i18n = version['changes_i18n']
    for lng in 'ja', 'en':
      if lng in changes_i18n:
        changes += atom_changes(changes_i18n[lng])
        pass
      pass

    entry = '''
  <entry>
    <title type="text">pixplus %(ver)s</title>
    <id>http://crckyl.ath.cx/pixplus/archive/%(ver)s</id>
    <updated>%(time)s</updated>
    <link href="http://crckyl.ath.cx/pixplus/archive/%(ver)s" />
    <author>
      <name>wowo</name>
      <uri>http://crckyl.ath.cx/</uri>
      <email>crckyl@gmail.com</email>
    </author>
    <content type="html"><![CDATA[
      <h1>pixplus %(ver)s</h1>
      %(changes)s
    ]]></content>
  </entry>
'''

    entry = entry.strip('\n') % {
      'ver': version['version'],
      'time': make_atom_time(version),
      'changes': '\n      '.join(changes)
      }

    out.append(entry)
    pass

  out.append('</feed>')
  return out

def markdown_escape(text):
  text = text.replace('_', '\\_')
  text = text.replace('*', '\\*')
  return text

def markdown(changelog):
  out = ['''
pixplus version history
=======================
'''.lstrip()]

  for version in changelog:
    out.append('## [%(version)s - %(date)s](%(releasenote)s)' % version)
    out.append('')

    changes_i18n = version['changes_i18n']
    for lng in 'ja', 'en':
      if lng in changes_i18n:
        if len(changes_i18n) > 1:
          out.append('### %s' % i18n['changes'][lng])
          out.append('')
          pass
        out += map(lambda l: '* %s' % markdown_escape(l), changes_i18n[lng])
        out.append('')
        pass
      pass
    pass

  return out

if __name__ == '__main__':
  if sys.version < '3':
    import codecs
    for key, translates in i18n.items():
      for lng, text in translates.items():
        translates[lng] = codecs.unicode_escape_decode(text)[0]
        pass
      pass
    pass

  changelog = json.load(sys.stdin)
  for version in changelog:
    if 'changes_i18n' not in version:
      version['changes_i18n'] = {
        'ja': version['changes']
        }
      pass
    pass

  out = locals()[sys.argv[1]](changelog)

  out = '\n'.join(out).strip()
  try:
    print(out)
  except UnicodeEncodeError:
    print(out.encode('utf-8'))
    pass
  pass
