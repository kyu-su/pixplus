import os
import base64
import time

from browser import Browser

class Safari(Browser):
  name = 'safari'
  capname = 'SAFARI'

  def prepare_caps(self, caps):
    caps['safari.options'] = {
      'extensions': [
        {'filename': 'pixplus.safariextz',
         'contents': self.read_file_as_base64(os.path.join(self.distdir, 'pixplus.safariextz'))},
        {'filename': 'AdBlock.safariextz',
         'contents': self.read_file_as_base64(self.download('https://data.getadblock.com/safari/AdBlock.safariextz', 'AdBlock.safariextz'))}
      ]
    }
    pass

  pass
