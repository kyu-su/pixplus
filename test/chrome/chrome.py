import os
import base64
import time
import subprocess
import re

from browser import Browser

class Chrome(Browser):
  name = 'chrome'
  capname = 'CHROME'

  def prepare_caps(self, caps):
    v_str = subprocess.check_output([self.args.chrome_bin, '--version'])
    m = re.match(r'Chromium ([\d\.]+)\s*', v_str.decode('utf-8'))
    if not m:
      raise RuntimeError('Failed to detect Chromium version')
    self.chrome_version = m.group(1)

    caps['chromeOptions'] = {
      'extensions': [
        self.read_file_as_base64(os.path.join(self.distdir, 'pixplus.crx')),
        self.read_file_as_base64(self.download_crx('abp.crx', 'cfhdojbkjhnklbpkdaibdccddilifddb'))
      ]
    }
    if self.args.chrome_bin:
      caps['chromeOptions']['binary'] = self.args.chrome_bin

  def download_crx(self, filename, ext_id):
    url = 'https://clients2.google.com/service/update2/crx?response=redirect&prodversion=%s&x=id%%3D%s%%26uc'
    url = url % (self.chrome_version, ext_id)
    return self.download(url, filename)

def register_args(parser):
  parser.add_argument('--chrome-command', dest = 'chrome_bin')
