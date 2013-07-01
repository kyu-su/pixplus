import os
import time
import shutil
import zipfile

from selenium.webdriver import DesiredCapabilities

from browser_seleniumserver import BrowserSeleniumServer
import util

class Safari(BrowserSeleniumServer):
  name = 'safari'

  def __init__(self):
    BrowserSeleniumServer.__init__(self)

    self.backup_suffix = '-bkp%d' % time.time()
    self.backup_list = []

    try:
      self.setup()
    except:
      self.restore()
      raise
    pass

  def setup(self):
    library_path = os.path.join(os.getenv('HOME'), 'Library')
    self.backup(os.path.join(library_path, 'Safari'))
    self.backup(os.path.join(library_path, 'Caches', 'com.apple.Safari'))
    self.backup(os.path.join(library_path, 'Caches', 'Metadata', 'Safari'))
    self.backup(os.path.join(library_path, 'Cookies'))

    self.install_extensions()

    self.caps = {}
    self.caps.update(DesiredCapabilities.SAFARI)
    self.caps['safari.extension.noInstall'] = True

    self.create_driver(self.caps)
    pass

  def backup(self, path):
    print('Backup: %s' % path)
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
      BrowserSeleniumServer.quit(self)
    finally:
      self.restore()
      pass
    pass

  def install_extensions(self):
    extdir = os.path.join(os.getenv('HOME'), 'Library', 'Safari', 'Extensions')
    os.makedirs(extdir)

    jar = self.download_selenium_server()
    jarzip = zipfile.ZipFile(jar, 'r')
    try:
      driverext = jarzip.read('org/openqa/selenium/safari/SafariDriver.safariextz')
    finally:
      jarzip.close()
      pass

    fp = open(os.path.join(extdir, 'SafariDriver.safariextz'), 'wb')
    try:
      fp.write(driverext)
    finally:
      fp.close()
      pass

    util.copy_file('../bin/pixplus.safariextz', extdir)
    util.copy_file('safari/Extensions.plist', extdir)
    pass

  pass
