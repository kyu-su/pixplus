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
      <string>%(type_safari)s</string>
    </dict>'''

def print_conf(conf, prefix):
  for key in sorted(conf.keys()):
    name = '%s_%s' % (prefix, key)
    if isinstance(conf[key], dict):
      print_conf(conf[key], name)
    else:
      value = conf[key][0]
      type_safari = 'TextField'
      value_safari = '<string>%s</string>' % value
      if isinstance(value, bool):
        if value:
          value = 'true'
        else:
          value = 'false'
          pass
        type_safari = 'CheckBox'
        value_safari = '<%s/>' % value
        pass
      print format % {'name': name, 'value': value,
                      'type_safari': type_safari, 'value_safari': value_safari}

print_conf(json.loads(sys.stdin.read()), 'conf')
