import os
import tempfile
import shutil

from selenium.webdriver import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.alert import Alert

class Browser:
  supports_alert = True

  def __init__(self, config):
    self.rootdir = config['rootdir']
    self.bindir = config['bindir']
    self.driver = None
    self.profiledir = None
    pass

  def create_profile(self):
    self.profiledir = tempfile.mkdtemp()
    print('%s: %s' % (self.name, self.profiledir))
    pass

  def set_window_size(self, width, height):
    self.driver.set_window_size(width, height)
    pass

  def quit(self):
    try:
      self.driver.quit()
    finally:
      if self.profiledir and os.path.exists(self.profiledir):
        print('Remove profile: %s' % self.profiledir)
        shutil.rmtree(self.profiledir)
        pass
      pass
    pass

  @property
  def url(self):
    return self.driver.current_url

  def open(self, url):
    self.driver.get(url)
    pass

  def reload(self):
    self.open(self.url)
    pass

  def wait_until(self, callback):
    wait = WebDriverWait(self.driver, 10)
    wait.until(callback)
    pass

  def ac(self):
    return ActionChains(self.driver)

  def q(self, selector, context = None):
    if context is None:
      context = self.driver
      pass
    self.wait_until(lambda d: self.qa(selector, context))
    return context.find_element_by_css_selector(selector)

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

  def js(self, script):
    return self.driver.execute_script(script)

  def geom(self, element):
    pos = element.location
    size = element.size
    return pos['x'], pos['y'], size['width'], size['height']

  pass
