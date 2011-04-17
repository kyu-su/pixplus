import sys
import json
from xml.sax.saxutils import escape
from xml.sax.saxutils import quoteattr

format = '  <preference name="%(name)s" value=%(value)s />'
if sys.argv[1] == 'safari':
  format = '''    <dict>
      <key>Title</key>
      <string>%(name)s</string>
      <key>Key</key>
      <string>%(name)s</string>
      <key>DefaultValue</key>
      %(value_safari)s
      <key>Type</key>
      <string>%(type_safari)s</string>%(more)s
    </dict>'''
elif sys.argv[1] == 'firefox':
  format = 'pref("extensions.pixplus.%(name)s", %(value_firefox)s);'
  pass

def print_conf(conf):
  for sec in conf:
    for item in sec['items']:
      # for compatibility
      if sec['name'] == 'general':
        name = 'conf_%s' % item['key']
      else:
        name = 'conf_%s_%s' % (sec['name'], item['key'])
        pass

      value = item['value']
      type_safari = 'TextField'
      value_safari = '<string>%s</string>' % escape(str(value))
      value_firefox = json.dumps(value)
      more = ''
      if item.has_key('hint'):
        type_safari = 'PopUpButton'
        more = '''
      <key>Titles</key>
      <array>'''
        for hint in item['hint']:
          more += '\n        <string>%s</string>' % hint['title']
          pass
        more += '\n      </array>'
        more += '''
      <key>Values</key>
      <array>'''
        for hint in item['hint']:
          more += '\n        <string>%s</string>' % str(hint['value'])
          pass
        more += '\n      </array>'
      elif isinstance(value, bool):
        type_safari = 'CheckBox'
        if value:
          value = 'true'
        else:
          value = 'false'
          pass
        value_safari = '<%s/>' % value
        pass
      if isinstance(value, int) or isinstance(value, float):
        value_firefox = '"%s"' % value
        pass
      print (format % {'name':          name,
                       'value':         quoteattr(str(value)),
                       'type_safari':   type_safari,
                       'value_safari':  value_safari,
                       'value_firefox': value_firefox,
                       'more':          more}).encode('utf-8')

print_conf(json.loads(sys.stdin.read()))
