import os
import base64
import time

from browser import Browser

class Chrome(Browser):
  name = 'chrome'
  capname = 'CHROME'

  def prepare_caps(self, caps):
    self.extensions = []
    self.add_extension(os.path.join(self.bindir, 'pixplus.crx'))
    self.add_extension(self.download_crx('ab.crx', 'gighmmpiobklfepjocnamgkkbiglidom'))

    caps['chromeOptions'] = {
      'extensions': self.extensions
      }
    pass

  def download_crx(self, filename, ext_id, chrome_version = '37.0.2062.120'):
    url = 'https://clients2.google.com/service/update2/crx?response=redirect&prodversion=%s&x=id%%3D%s%%26uc' % (ext_id, chrome_version)
    return self.download(url, filename)

  def add_extension(self, filename):
    fp = open(filename, 'rb')
    try:
      data = fp.read()
    finally:
      fp.close()
      pass
    data = base64.b64encode(data)
    try:
      data = str(data, 'ascii')
    except TypeError:
      pass
    self.extensions.append(data)
    pass

  pass
