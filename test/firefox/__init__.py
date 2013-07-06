import sys, os
import time
import urllib

from selenium import webdriver

from browser import Browser
import util

curdir = os.path.abspath(os.path.dirname(__file__))

class Firefox(Browser):
  name = 'firefox'
  addons = {
    'greasemonkey': 748,
    'scriptish': 231203
    }

  def __init__(self, mode, config):
    Browser.__init__(self, config)
    self.profile = webdriver.FirefoxProfile()
    self.add_addon(mode)
    self.profiledir = self.profile.path

    binary = None
    if config['firefox']:
      from selenium.webdriver.firefox.firefox_binary import FirefoxBinary
      binary = FirefoxBinary(config['firefox'])
      pass

    self.driver = webdriver.Firefox(firefox_profile = self.profile, firefox_binary = binary)
    pass

  def prepare_addon(self, addonid, name):
    filename = 'addon-%d-latest.xpi' % addonid
    url = 'https://addons.mozilla.org/firefox/downloads/latest/%d/%s' % (addonid, filename)
    dlpath = os.path.join(curdir, filename)
    if not os.path.exists(dlpath) or os.stat(dlpath).st_mtime < time.time() - 60 * 60 * 24:
      util.download(url, dlpath)
      pass
    return dlpath

  def add_addon(self, name):
    filename = self.prepare_addon(self.addons[name], name)
    print('Setup %s' % name)
    self.profile.add_extension(extension = filename)
    getattr(self, 'setup_%s' % name)()
    pass

  def setup_greasemonkey(self):
    path_gm = os.path.join(self.profile.path, 'gm_scripts')
    os.mkdir(path_gm)
    util.copy_file(os.path.join(curdir, 'gm_config.xml'), os.path.join(path_gm, 'config.xml'))
    util.copy_file(os.path.join(self.bindir, 'pixplus.user.js'), path_gm)
    self.profile.set_preference('extensions.greasemonkey.stats.prompted', True)
    pass

  def setup_scriptish(self):
    path_st = os.path.join(self.profile.path, 'scriptish_scripts')
    os.mkdir(path_st)
    util.copy_file(os.path.join(curdir, 'scriptish-config.json'), path_st)
    util.copy_file(os.path.join(self.bindir, 'pixplus.user.js'), path_st)
    os.utime(os.path.join(path_st, 'pixplus.user.js'), (2000000000, 2000000000))
    pass

  pass