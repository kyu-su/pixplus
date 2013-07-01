import os

from selenium.webdriver import DesiredCapabilities

from browser_seleniumserver import BrowserSeleniumServer
import util

curdir = os.path.abspath(os.path.dirname(__file__))

class Opera(BrowserSeleniumServer):
  name = 'opera'
  supports_alert = False

  def __init__(self, mode, config):
    BrowserSeleniumServer.__init__(self, config)

    self.userjs = []
    self.extensions = []
    if mode == 'userjs':
      self.userjs.append(os.path.join(self.rootdir, 'pixplus.js'))
    elif mode == 'extension':
      self.extensions.append(os.path.join(self.bindir, 'pixplus.oex'))
    else:
      raise ValueError('Invalid mode - %s' % mode)

    self.create_profile()

    self.caps = {}
    self.caps.update(DesiredCapabilities.OPERA)
    self.caps['opera.profile'] = self.profiledir

    self.create_driver(self.caps)
    pass

  def set_window_size(self, width, height):
    pass

  def create_profile(self):
    BrowserSeleniumServer.create_profile(self)
    util.copy_file(os.path.join(curdir, 'operaprefs.ini'), self.profiledir)
    self.install_userjs()
    self.install_extensions()
    pass

  def install_userjs(self):
    path_userjs = os.path.join(self.profiledir, 'userjs')
    os.mkdir(path_userjs)
    for ujs in self.userjs:
      util.copy_file(ujs, path_userjs)
      pass
    pass

  def install_extensions(self):
    if not self.extensions:
      return

    path_widgets = os.path.join(self.profiledir, 'widgets')
    os.mkdir(path_widgets)

    fp_widgets_dat = open(os.path.join(path_widgets, 'widgets.dat'), 'w')
    fp_widgets_dat.write('''
<?xml version="1.0" encoding="utf-8"?>
<preferences>
  <section id="widgets">
    <value id="version" xml:space="preserve">1</value>
  </section>
''')

    for oex in self.extensions:
      filename = os.path.basename(oex)
      uuid = '-'.join(map(lambda s: os.urandom(s).encode('hex'), (4, 2, 2, 2, 6)))
      util.copy_file(oex, path_widgets)

      fp_widgets_dat.write('''
  <section id="wuid-%(uuid)s">
    <value id="path to widget data" xml:space="preserve">{Preferences}widgets/%(filename)s</value>
    <value id="download_URL" null="yes"/>
    <value id="content-type" xml:space="preserve">3</value>
    <value id="class state" xml:space="preserve">enabled</value>
    <value id="update last modified" xml:space="preserve">0</value>
    <value id="update expires" xml:space="preserve">0</value>
  </section>
''' % {'uuid': uuid, 'filename': filename})

      path_widget = os.path.join(path_widgets, 'wuid-%s' % uuid)
      os.mkdir(path_widget)

      fp = open(os.path.join(path_widget, 'prefs.dat'), 'w')
      fp.write('''
<?xml version="1.0" encoding="utf-8"?>
<preferences>
  <section id="ui">
    <value id="name" xml:space="preserve">%(name)s</value>
    <value id="default-prefs-applied" xml:space="preserve">1</value>
  </section>
  <section id="wuid-%(uuid)s">
    <value id="network_access" xml:space="preserve">24</value>
  </section>
  <section id="user">
    <value id="GadgetRunOnSecureConn" xml:space="preserve">yes</value>
    <value id="GadgetEnabledOnStartup" xml:space="preserve">yes</value>
  </section>
</preferences>
''' % {'uuid': uuid, 'name': filename})
      fp.close()
      pass

    fp_widgets_dat.write('</preferences>')
    fp_widgets_dat.close()
    pass

  pass
