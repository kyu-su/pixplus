import os
import shutil
import time
import json
import base64

from PIL import Image

try:
  import http.client as http_client
except ImportError:
  import httplib as http_client

from selenium.webdriver import ActionChains
from selenium.webdriver import DesiredCapabilities
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.alert import Alert

import util

class Browser:
  name = None
  capname = None
  supports_alert = True

  def __init__(self):
    self.driver = None
    self.profiledir = None

  def start(self):
    if self.driver:
      raise RuntimeError('%s is already running' % self.name)

    caps = {}
    caps.update(getattr(DesiredCapabilities, self.capname))
    self.prepare_caps(caps)
    self.driver = WebDriver(
      'http://%s:%d/wd/hub' % (self.args.server_host, self.args.server_port),
      desired_capabilities = caps
      )
    self.driver.implicitly_wait(2)

    time.sleep(3)
    for h in self.driver.window_handles[1:]:
      self.driver.switch_to.window(h)
      self.driver.close()
    self.driver.switch_to.window(self.driver.window_handles[0])
    self.driver.switch_to_default_content()

  def quit(self):
    try:
      if self.driver:
        self.driver.quit()
        self.driver = None
    except http_client.BadStatusLine:
      pass

  def create_profile(self):
    self.profiledir = os.path.join(self.testdir, 'profile', self.name)
    if os.path.exists(self.profiledir):
      shutil.rmtree(self.profiledir)
    os.makedirs(self.profiledir)
    return self.profiledir

  def set_window_size(self, width, height):
    self.driver.set_window_size(width, height)

  @property
  def url(self):
    return self.driver.current_url

  def wait_page_load(self):
    time.sleep(1)
    self.wait_until(lambda d: self.js('return !!(window.document&&window.document.readyState==="complete")'))

  def open(self, url):
    self.driver.get(url)
    self.wait_page_load()

  def reload(self):
    self.open(self.url)

  def wait_until(self, callback):
    wait = WebDriverWait(self.driver, 20)
    return wait.until(callback)

  def ac(self):
    return ActionChains(self.driver)

  def q(self, selector, context = None):
    if context is None:
      return self.driver.find_element_by_css_selector(selector)
    return context.find_element_by_css_selector(selector)

  def qa(self, selector, context = None):
    if context is None:
      return self.driver.find_elements_by_css_selector(selector)
    return context.find_elements_by_css_selector(selector)

  def x(self, xpath):
    return self.driver.find_element_by_xpath(xpath)

  def xa(self, xpath):
    return self.driver.find_elements_by_xpath(xpath)

  def alert_accept(self):
    if self.supports_alert:
      Alert(self.driver).accept()
    else:
      raise RuntimeError('%s not supports alert handling' % self.name)

  def js(self, script, *args):
    return self.driver.execute_script(script, *args)

  def geom(self, element):
    return tuple(map(round, self.js('''
      var elem = arguments[0];
      var rect = elem.getBoundingClientRect();
      return [rect.left, rect.top, rect.width, rect.height];
    ''', element)))

  def screen_size(self):
    sw, sh = self.js('''
      return [document.documentElement.clientWidth,
              document.documentElement.clientHeight];
    ''')
    return sw, sh


  def set_cookie(self, name, value, domain, path):
    expires = ''
    if value is None:
      value = ''
      expires = '; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    cookie = '%s=%s; domain=%s; path=%s%s' % (name, value, domain, path, expires)
    self.js('document.cookie=%s' % json.dumps(cookie))

  def screenshot(self, elem = None):
    ss = self.driver.get_screenshot_as_png()
    io = util.BytesIO(ss)
    img = Image.open(io)

    if elem is not None:
      x, y, w, h = tuple(map(int, self.geom(elem)))
      img = img.crop((x, y, x + w, y + h))

    return img.convert('RGB')

  def download(self, url, filename):
    dlpath = os.path.join(self.browserdir, filename)
    if not os.path.exists(dlpath) or os.stat(dlpath).st_mtime < time.time() - 60 * 60 * 24:
      util.download(url, dlpath)
    return dlpath

  def read_file_as_base64(self, filename):
    fp = open(filename, 'rb')
    try:
      data = fp.read()
    finally:
      fp.close()
    data = base64.b64encode(data)
    try:
      data = str(data, 'ascii')
    except TypeError:
      pass
    return data
