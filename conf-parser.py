import sys
import json

def print_conf(conf, prefix):
    for key in sorted(conf.keys()):
        name = '%s_%s' % (prefix, key)
        if isinstance(conf[key], dict):
            print_conf(conf[key], name)
        else:
            value = conf[key][0]
            if isinstance(value, bool):
                if value:
                    value = 'true'
                else:
                    value = 'false'
            print '  <preference name="%s" value="%s" />' % (name, value)

print_conf(json.loads(sys.stdin.read()), 'conf')
