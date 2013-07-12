import os
import shutil
import time
import json

try:
  import http.client as http_client
except ImportError:
  import httplib as http_client
  pass

from selenium.webdriver import ActionChains
from selenium.webdriver import DesiredCapabilities
from selenium.webdriver.remote.webdriver import WebDriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.alert import Alert

class Browser:
  name = None
  capname = None
  supports_alert = True

  def __init__(self):
    self.driver = None
    self.profiledir = None
    pass

  @classmethod
  def register_args(self, parser):
    pass

  def start(self):
    caps = {}
    caps.update(getattr(DesiredCapabilities, self.capname))
    self.prepare_caps(caps)
    self.driver = WebDriver(
      'http://localhost:%d/wd/hub' % self.args.server_port,
      desired_capabilities = caps
      )
    pass

  def quit(self):
    try:
      self.driver.quit()
    except http_client.BadStatusLine:
      pass
    pass

  def create_profile(self):
    self.profiledir = os.path.join(self.testdir, 'profile', self.name)
    if os.path.exists(self.profiledir):
      shutil.rmtree(self.profiledir)
      pass
    os.makedirs(self.profiledir)
    return self.profiledir

  def set_window_size(self, width, height):
    self.driver.set_window_size(width, height)
    pass

  @property
  def url(self):
    return self.driver.current_url

  def wait_page_load(self):
    time.sleep(1)
    self.wait_until(lambda d: self.js('return document.readyState==="complete"'))
    pass

  def open(self, url):
    self.driver.get(url)
    pass

  def reload(self):
    self.open(self.url)
    pass

  def wait_until(self, callback):
    wait = WebDriverWait(self.driver, 20)
    return wait.until(callback)

  def ac(self):
    return ActionChains(self.driver)

  def q(self, selector, context = None):
    if context is None:
      context = self.driver
      pass
    return self.wait_until(lambda d: self.qa(selector, context))[0]

  def qa(self, selector, context = None):
    if context is None:
      context = self.driver
      pass
    return context.find_elements_by_css_selector(selector)

  def x(self, xpath, context = None):
    if context is None:
      context = self.driver
      pass
    return context.find_element_by_xpath(xpath)

  def xa(self, xpath, context = None):
    if context is None:
      context = self.driver
      pass
    return context.find_elements_by_xpath(xpath)

  def alert_accept(self):
    if self.supports_alert:
      Alert(self.driver).accept()
    else:
      raise RuntimeError('%s not supports alert handling' % self.name)
    pass

  def js(self, script, *args):
    return self.driver.execute_script(script, *args)

  def geom(self, element):
    if self.name == 'firefox':
      pos = element.location
      size = element.size
      return pos['x'], pos['y'], size['width'], size['height']

    return tuple(map(int, self.js('''
      var elem = arguments[0];
      var rect = elem.getBoundingClientRect();
      return [rect.left, rect.top, elem.offsetWidth, elem.offsetHeight];
    ''', element)))

  def set_cookie(self, name, value, domain, path):
    cookie = '%s=%s; domain=%s; path=%s' % (name, value, domain, path)
    self.js('document.cookie=%s' % json.dumps(cookie))
    pass

  pass
