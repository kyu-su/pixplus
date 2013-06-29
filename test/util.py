import sys
import urllib2

def download(url, filename):
  sys.stdout.write('Download: %s ' % filename)
  sys.stdout.write('  0%')
  sys.stdout.flush()

  src = urllib2.urlopen(url)
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
