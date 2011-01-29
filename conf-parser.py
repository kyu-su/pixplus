import sys
import json

format = '  <preference name="%(name)s" value="%(value)s" />'
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

def print_conf(conf, prefix):
  for key in sorted(conf.keys()):
    name = '%s_%s' % (prefix, key)
    if isinstance(conf[key], dict):
      print_conf(conf[key], name)
    else:
      value = conf[key][0]
      type_safari = 'TextField'
      value_safari = '<string>%s</string>' % value
      value_firefox = json.dumps(value)
      more = ''
      if len(conf[key]) > 2:
        type_safari = 'PopUpButton'
        more = '''
      <key>Titles</key>
      <array>'''
        for entry in conf[key][2]:
          if isinstance(entry, dict):
            more += '\n        <string>%s</string>' % entry['title']
          else:
            more += '\n        <string>%s</string>' % entry
            pass
          pass
        more += '\n      </array>'
        more += '''
      <key>Values</key>
      <array>'''
        for entry in conf[key][2]:
          if isinstance(entry, dict):
            more += '\n        <string>%s</string>' % str(entry['value'])
          else:
            more += '\n        <string>%s</string>' % entry
            pass
          pass
        more += '\n      </array>'
      elif isinstance(value, bool):
        if value:
          value = 'true'
        else:
          value = 'false'
          pass
        type_safari = 'CheckBox'
        value_safari = '<%s/>' % value
        pass
      if isinstance(value, int) or isinstance(value, float):
        value_firefox = '"%s"' % value
        pass
      print (format % {'name':          name,
                       'value':         value,
                       'type_safari':   type_safari,
                       'value_safari':  value_safari,
                       'value_firefox': value_firefox,
                       'more':          more}).encode('utf-8')

print_conf(json.loads(sys.stdin.read()), 'conf')
