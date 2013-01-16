import sys
import json
import datetime

try:
  import pyatom
except ImportError:
  sys.stderr.write('WARNING: To generate feed.atom, pyatom is required.\n')
  sys.exit(0)
  pass

url_home    = 'http://crckyl.ath.cx/'
url_pixplus = 'http://crckyl.ath.cx/pixplus'
url_feed    = 'http://crckyl.ath.cx/pixplus/feed.atom'
url_version = 'http://crckyl.ath.cx/pixplus/archive/%s'

author = {
  'name':  'wowo',
  'uri':   'http://crckyl.ath.cx/',
  'email': 'crckyl@myopera.com'
  }

def gen_changes(changes):
  out = ['<ul>']
  for line in changes:
    out.append('  <li>%s</li>' % line)
    pass
  out.append('</ul>')
  return out

def gen_atom(changelog):
  feed = pyatom.AtomFeed(
    title    = 'pixplus',
    subtitle = 'pixplus changelogs',
    feed_url = url_feed,
    url      = url_pixplus,
    author   = author
    )

  for item in changelog:
    version = item['version']
    time = datetime.datetime.strptime(item['date'], '%Y/%m/%d')

    changes = ['<h1>pixplus %s</h1>' % version]
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

    feed.add(
      title        = 'pixplus %s' % version,
      content      = '\n'.join(changes),
      content_type = 'html',
      author       = author,
      url          = url_version % version,
      updated      = time
      )
    pass

  sys.stdout.write(feed.to_string().encode('utf-8'))
  pass

if __name__ == '__main__':
  gen_atom(json.load(sys.stdin)['data'])
  pass
