import os
import time
import shutil
import zipfile

import util
from browser import Browser

class Safari(Browser):
  name = 'safari'
  capname = 'SAFARI'
  supports_alert = False

  def prepare_caps(self, caps):
    self.backup_suffix = '-bkp%d' % time.time()
    self.backup_list = []

    try:
      self.setup()
    except:
      self.restore()
      raise

    caps['safari.extension.noInstall'] = True
    pass

  def setup(self):
    library_path = os.path.join(os.getenv('HOME'), 'Library')
    self.backup(os.path.join(library_path, 'Safari'))
    self.backup(os.path.join(library_path, 'Caches', 'com.apple.Safari'))
    self.backup(os.path.join(library_path, 'Caches', 'Metadata', 'Safari'))
    self.backup(os.path.join(library_path, 'Cookies'))

    self.install_extensions()
    pass

  def backup(self, path):
    print('Backup: %s' % path)
    if not os.path.exists(path):
      return
    os.rename(path, path + self.backup_suffix)
    self.backup_list.append((path, path + self.backup_suffix))
    pass

  def restore(self):
    for path, path_bkp in self.backup_list:
      print('Restore backup: %s' % path_bkp)
      if os.path.exists(path):
        shutil.rmtree(path)
        pass
      os.rename(path_bkp, path)
      pass
    pass

  def quit(self):
    try:
      Browser.quit(self)
    finally:
      self.restore()
      pass
    pass

  def install_extensions(self):
    driver = os.path.join(self.browserdir, 'SafariDriver.safariextz')
    if not os.path.exists(driver):
      print('****************************************************************')
      print('%s not found. Put it in safari directory first.' % os.path.basename(driver))
      print('You can get it from seLenium-server-standalone.jar by following:')
      print('  unzip -j selenium-server-standalone*.jar org/openqa/selenium/safari/SafariDriver.safariextz')
      print('****************************************************************')
      raise RuntimeError()

    extdir = os.path.join(os.getenv('HOME'), 'Library', 'Safari', 'Extensions')
    os.makedirs(extdir)
    util.copy_file(driver, extdir)
    util.copy_file(os.path.join(self.bindir, 'pixplus.safariextz'), extdir)
    util.copy_file(os.path.join(self.browserdir, 'Extensions.plist'), extdir)
    pass

  pass
