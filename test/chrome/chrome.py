import os
import base64
import time

from browser import Browser

class Chrome(Browser):
  name = 'chrome'
  capname = 'CHROME'

  def prepare_caps(self, caps):
    # filename = 'abp.crx'
    # url = 'https://downloads.adblockplus.org/devbuilds/adblockpluschrome/adblockpluschrome-1.8.5.1232.crx'
    # abp = self.download(url, filename)

    self.extensions = []
    self.add_extension(os.path.join(self.bindir, 'pixplus.crx'))
    # self.add_extension(abp)

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
