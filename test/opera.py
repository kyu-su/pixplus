import os
import tempfile
import subprocess
import time

from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.webdriver.remote.webdriver import WebDriver as RemoteWebDriver
from selenium.webdriver.common import utils as selutils

from browser import Browser
import util

class Opera(Browser):
  selenium_jar_url = 'https://selenium.googlecode.com/files/selenium-server-standalone-2.33.0.jar'

  def __init__(self, mode):
    self.userjs = []
    self.extensions = []
    if mode == 'userjs':
      self.userjs.append('../pixplus.js')
    elif mode == 'extension':
      self.extensions.append('../bin/pixplus.oex')
    else:
      raise ValueError('Invalid mode - %s' % mode)

    self.create_profile()

    self.caps = {}
    self.caps.update(DesiredCapabilities.OPERA)
    self.caps['opera.profile'] = self.profiledir

    jar = self.download_selenium()
    self.port = selutils.free_port()

    self.log_fp = open('selenium.log', 'w')
    self.process = subprocess.Popen(
      ['java', '-jar', jar, '-port', str(self.port)],
      stdout = self.log_fp, stderr = subprocess.STDOUT
      )

    while not selutils.is_connectable(self.port):
      time.sleep(1)
      pass

    Browser.__init__(self, RemoteWebDriver(
        'http://localhost:%d/wd/hub' % self.port,
        desired_capabilities = self.caps
        ))
    pass

  def set_window_size(self, width, height):
    pass

  def quit(self):
    try:
      Browser.quit(self)
    except http_client.BadStatusLine:
      pass

    self.process.kill()
    self.process.wait()
    self.log_fp.close()
    pass

  def create_profile(self):
    self.profiledir = tempfile.mkdtemp()
    util.copy_file('operaprefs.ini', self.profiledir)
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

  def download_selenium(self):
    filename = self.selenium_jar_url.split('/').pop()
    if not os.path.exists(filename):
      util.download(self.selenium_jar_url, filename)
      pass
    return filename

  pass
