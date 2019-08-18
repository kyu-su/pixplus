import sys
import re
import json

def stable(f):
  def w(changelog):
    return f(list(filter(lambda v: v['date'], changelog)))
  return w

def out_json(changelog):
  return [json.dumps(changelog, sort_keys = True, indent = 2)]

def out_dev_version(changelog):
  return [changelog[0]['version']]

@stable
def out_stable_version(changelog):
  return [changelog[0]['version']]

i18n = {
  'changes': {'ja': u'\u5909\u66f4\u70b9', 'en': 'Changes'}
}

def atom_changes(changes):
  out = ['<ul>']
  for line in changes:
    out.append('  <li>%s</li>' % line)
  out.append('</ul>')
  return out

def make_atom_time(version):
  return '%sT00:00:00.000Z' % version['date'].replace('/', '-')

@stable
def out_atom(changelog):
  out = []

  out.append('''
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title type="text">pixplusPlus</title>
  <id>https://github.com/kyu-su/pixplusPlus/release.atom</id>
  <updated>%(time)s</updated>
  <link href="https://github.com/kyu-su/pixplusPlus/" />
  <link href="https://github.com/kyu-su/pixplusPlus/release.atom" rel="self" />
  <author>
    <name>wowo</name>
    <uri>https://ccl4.info/</uri>
    <email>crckyl@gmail.com</email>
  </author>
  <subtitle type="text">pixplusPlus changelogs</subtitle>
'''.strip('\n') % {'time': make_atom_time(changelog[0])})

  for version in changelog:
    changes = []
    changes_i18n = version['changes_i18n']
    for lng in 'ja', 'en':
      if lng in changes_i18n:
        changes += atom_changes(changes_i18n[lng])

    entry = '''
  <entry>
    <title type="text">pixplusPlus %(ver)s</title>
    <id>https://ccl4.info/pixplus/archive/%(ver)s</id>
    <updated>%(time)s</updated>
    <link href="https://ccl4.info/pixplus/archive/%(ver)s" />
    <author>
      <name>wowo</name>
      <uri>https://ccl4.info/</uri>
      <email>crckyl@gmail.com</email>
    </author>
    <content type="html"><![CDATA[
      <h1>pixplusPlus %(ver)s</h1>
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

  out.append('</feed>')
  return out

def markdown_escape(text):
  text = text.replace('_', '\\_')
  text = text.replace('*', '\\*')
  return text

@stable
def out_markdown(changelog):
  out = ['''
pixplusPlus version history
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
        out += map(lambda l: '* %s' % markdown_escape(l), changes_i18n[lng])
        out.append('')

  return out

if __name__ == '__main__':
  changelog = json.load(sys.stdin)
  for version in changelog:
    if 'changes_i18n' not in version:
      version['changes_i18n'] = {
        'ja': version['changes']
        }

  out = locals()['out_%s' % sys.argv[1]](changelog)

  out = '\n'.join(out).strip()
  try:
    print(out)
  except UnicodeEncodeError:
    print(out.encode('utf-8'))
