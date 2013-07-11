import sys, os

try:
  from urllib.request import urlopen
except ImportError:
  from urllib2 import urlopen
  pass

def download(url, filename):
  sys.stdout.write('Download: %s ' % filename)
  sys.stdout.write('  0%')
  sys.stdout.flush()

  src = urlopen(url)
  dst = open(filename, 'wb')

  size = int(src.info().getheader('Content-Length'))
  written = 0

  while True:
    buf = src.read(1024 * 100)
    if not buf:
      break
    dst.write(buf)
    dst.flush()
    written += len(buf)
    sys.stdout.write('\b' * 4 + '%3d%%' % (written * 100 / size))
    sys.stdout.flush()
    pass

  dst.close()
  src.close()

  sys.stdout.write('\n')
  sys.stdout.flush()
  pass

def copy_file(path_from, path_to):
  if os.path.isdir(path_to):
    path_to = os.path.join(path_to, os.path.basename(path_from))
    pass

  fp = open(path_from, 'rb')
  try:
    data = fp.read()
  finally:
    fp.close()
    pass

  fp = open(path_to, 'wb')
  try:
    fp.write(data)
  finally:
    fp.close()
    pass
  pass
