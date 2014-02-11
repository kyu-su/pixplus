import sys
import re

def subst_css(match):
  css = open(match.group('filename')).read()
  css = re.sub(r'[\r\n]+', '', css)
  css = '\\\r\n'.join(filter(lambda a: a, re.split('(.{80})', css)))
  return match.group('left') + css + '\\' + match.group('right')

def main(text):
  return re.sub(r'(?P<left>__SUBST_FILE_CSS__\((?P<filename>.*)\).*[\r\n]+)[\s\S]*?(?P<right>[\r\n]+.*__SUBST_FILE_CSS_END__)', subst_css, text)

if __name__ == '__main__':
  sys.stdout.write(main(sys.stdin.read()))
  pass
