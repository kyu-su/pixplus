import sys, os
import json

try:
  from urllib.request import urlopen
except ImportError:
  from urllib2 import urlopen
  pass

def download(url, filename):
  sys.stdout.write('Download: %s ' % url)
  sys.stdout.write('  0%')
  sys.stdout.flush()

  src = urlopen(url)
  dst = open(filename, 'wb')

  try:
    size = int(src.info()['Content-Length'])
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

  except:
    try:
      dst.close()
      src.close()
    except:
      pass
    os.unlink(filename)
    raise

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

def read_json(filename, default = None):
  if not os.path.exists(filename):
    return default

  fp = open(filename)
  try:
    return json.load(fp)
  finally:
    fp.close()
    pass
  pass

def write_json(filename, obj):
  fp = open(filename, 'w')
  try:
    json.dump(obj, fp)
  finally:
    fp.close()
    pass
  pass
