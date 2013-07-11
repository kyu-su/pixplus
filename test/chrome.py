import os
import base64

from browser import Browser

class Chrome(Browser):
  name = 'chrome'
  capname = 'CHROME'

  def prepare_caps(self, caps):
    self.extensions = []
    self.add_extension(os.path.join(self.bindir, 'pixplus.crx'))

    caps['chromeOptions'] = {
      'extensions': self.extensions
      }
    pass

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
