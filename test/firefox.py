import sys, os
import time
import urllib

from selenium import webdriver

from browser import Browser
import util

class Firefox(Browser):
  addons = {
    'greasemonkey': 748,
    'scriptish': 231203
    }

  def __init__(self, addons):
    self.profile = webdriver.FirefoxProfile()
    self.add_addons(addons)
    Browser.__init__(self, webdriver.Firefox(firefox_profile = self.profile))
    pass

  def prepare_addon(self, addonid, name):
    filename = 'addon-%d-latest.xpi' % addonid
    url = 'https://addons.mozilla.org/firefox/downloads/latest/%d/%s' % (addonid, filename)
    if not os.path.exists(filename) or os.stat(filename).st_mtime < time.time() - 60 * 60 * 24:
      util.download(url, filename)
      pass
    return filename

  def add_addons(self, addons):
    for name in addons:
      filename = self.prepare_addon(self.addons[name], name)
      print('Setup %s' % name)
      self.profile.add_extension(extension = filename)
      getattr(self, 'setup_%s' % name)()
      pass
    pass

  def setup_greasemonkey(self):
    path_gm = os.path.join(self.profile.path, 'gm_scripts')
    os.mkdir(path_gm)
    util.copy_file('gm_config.xml', os.path.join(path_gm, 'config.xml'))
    util.copy_file('../bin/pixplus.user.js', path_gm)
    self.profile.set_preference('extensions.greasemonkey.stats.prompted', True)
    pass

  def setup_scriptish(self):
    path_st = os.path.join(self.profile.path, 'scriptish_scripts')
    os.mkdir(path_st)
    util.copy_file('scriptish-config.json', path_st)
    util.copy_file('../bin/pixplus.user.js', path_st)
    os.utime(os.path.join(path_st, 'pixplus.user.js'), (2000000000, 2000000000))
    pass

  pass
