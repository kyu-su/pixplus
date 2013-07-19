import sys, os
import time
import urllib
import zipfile
import base64

try:
  from elementtree.ElementTree import ElementTree
except ImportError:
  from xml.etree.ElementTree import ElementTree
  pass

import util
from browser import Browser

ADDONS = {
  'greasemonkey': 748,
  'scriptish': 231203
  }

class Firefox(Browser):
  name = 'firefox'
  capname = 'FIREFOX'
  extension_mode = False

  def prepare_caps(self, caps):
    self.user_prefs = {}
    self.create_profile()
    self.add_addon(self.args.firefox_mode)

    fp = open(os.path.join(self.profiledir, 'user.js'), 'w')
    try:
      for key, value in self.user_prefs.items():
        fp.write('user_pref("%s", %s);\n' % (key, value))
        pass
    finally:
      fp.close()
      pass

    caps['firefox_profile'] = self.b64()

    if self.args.firefox_bin:
      caps['firefox_binary'] = self.args.firefox_bin
      pass
    pass

  def prepare_addon(self, addonid, name):
    filename = 'addon-%d-latest.xpi' % addonid
    url = 'https://addons.mozilla.org/firefox/downloads/latest/%d/%s' % (addonid, filename)
    dlpath = os.path.join(self.browserdir, filename)
    if not os.path.exists(dlpath) or os.stat(dlpath).st_mtime < time.time() - 60 * 60 * 24:
      util.download(url, dlpath)
      pass
    return dlpath

  def add_addon(self, name):
    filename = self.prepare_addon(ADDONS[name], name)
    print('Setup %s' % name)
    self.install_xpi(filename)
    getattr(self, 'setup_%s' % name)()
    pass

  def install_xpi(self, filename):
    extract_path = os.path.join(self.profiledir, 'extensions', os.path.basename(filename))
    os.makedirs(extract_path)
    z = zipfile.ZipFile(filename, 'r')
    z.extractall(extract_path)

    doc = ElementTree(file = os.path.join(extract_path, 'install.rdf'))
    eid = doc.find('.//{http://www.mozilla.org/2004/em-rdf#}id').text
    os.rename(extract_path, os.path.join(os.path.dirname(extract_path), eid))
    pass

  def setup_greasemonkey(self):
    path_gm = os.path.join(self.profiledir, 'gm_scripts')
    os.mkdir(path_gm)
    util.copy_file(os.path.join(self.browserdir, 'gm_config.xml'), os.path.join(path_gm, 'config.xml'))
    util.copy_file(os.path.join(self.bindir, 'pixplus.user.js'), path_gm)
    self.user_prefs['extensions.greasemonkey.stats.prompted'] = 'true'
    pass

  def setup_scriptish(self):
    path_st = os.path.join(self.profiledir, 'scriptish_scripts')
    os.mkdir(path_st)
    util.copy_file(os.path.join(self.browserdir, 'scriptish-config.json'), path_st)
    util.copy_file(os.path.join(self.bindir, 'pixplus.user.js'), path_st)
    os.utime(os.path.join(path_st, 'pixplus.user.js'), (2000000000, 2000000000))
    pass

  def b64(self):
    fp = util.BytesIO()
    z = zipfile.ZipFile(fp, 'w', zipfile.ZIP_DEFLATED)
    for base, dirs, files in os.walk(self.profiledir):
      for filename in files:
        path = os.path.join(base, filename)
        z.write(path, path[len(self.profiledir):].lstrip('/'))
        pass
      pass
    z.close()

    data = base64.b64encode(fp.getvalue())
    try:
      data = str(data, 'ascii')
    except TypeError:
      pass
    return data

  pass

def register_args(parser):
  parser.add_argument('--firefox-command', dest = 'firefox_bin')
  parser.add_argument('--firefox-mode', dest = 'firefox_mode',
                      choices = ADDONS.keys(),
                      default = 'greasemonkey',
                      help = ','.join(ADDONS.keys()))
  pass
