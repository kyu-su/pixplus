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
  pass

def print_conf(conf):
  for sec in conf:
    for item in sec['items']:
      name = 'conf_%s_%s' % (sec['name'], item['key'])
      value = item['value']
      type_safari = 'TextField'
      value_safari = '<string>%s</string>' % escape(str(value))
      more = ''
      if 'hint' in item:
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

      params = {
        'name':          name,
        'value':         quoteattr(str(value)),
        'type_safari':   type_safari,
        'value_safari':  value_safari,
        'more':          more
        }

      print(format % params)
      pass
    pass
  pass

print_conf(json.loads(sys.stdin.read())['data'])
