import unittest

from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.alert import Alert

class TestCase(unittest.TestCase):
  def __init__(self, driver, config, testname):
    unittest.TestCase.__init__(self, testname)
    self.driver = driver
    self.config = config
    pass

  def wait_until(self, callback):
    wait = WebDriverWait(self.driver, 10)
    wait.until(callback)
    pass

  def alert_accept(self):
    Alert(self.driver).accept()
    pass

  def open(self, url):
    self.driver.get('http://www.pixiv.net%s' % url)
    self.wait_until(lambda d: d.execute_script('return !!window.pixplus'))
    pass

  def q(self, selector, context = None):
    if context is None:
      context = self.driver
      pass
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

  def has_class(self, element, classname):
    return ' %s ' % classname in ' %s ' % element.get_attribute('class')

  def open_popup(self):
    self.driver.execute_script('pixplus.popup.show(pixplus.illust.list[0])')
    popup = self.q('#pp-popup')
    self.assertTrue(popup.is_displayed())
    self.popup_wait_load()
    return popup

  def popup_get_status(self):
    status = self.driver.find_element_by_id('pp-popup-status')
    if status.is_displayed():
      return status.text
    return ''

  def popup_wait_load(self):
    self.wait_until(lambda driver: 'Loading' not in self.popup_get_status())
    self.assertFalse('Error' in self.popup_get_status())
    pass

  def popup_send_keys(self, keys):
    self.q('#pp-popup').send_keys(keys)
    self.popup_wait_load()
    pass

  def popup_reload(self):
    self.driver.execute_script('pixplus.popup.reload()')
    self.popup_wait_load()
    pass

  def popup_prev(self):
    self.driver.execute_script('pixplus.popup.input.prev()')
    self.popup_wait_load()
    pass

  def popup_next(self):
    self.driver.execute_script('pixplus.popup.input.next()')
    self.popup_wait_load()
    pass

  def popup_get_illust_id(self):
    return self.driver.execute_script('return pixplus.popup.illust.id')

  def popup_get_tags(self):
    return set(self.driver.execute_script('return pixplus.popup.illust.tags'))

  def open_test_user(self):
    self.open('/member_illust.php?id=%d' % self.config['test-user'])
    pass

  def find_illust(self, callback, *args):
    self.open_test_user()
    popup = self.open_popup()

    while True:
      r = callback(popup, *args)
      if r:
        return r

      self.popup_next()
      self.assertTrue(popup.is_displayed())
      pass

    raise 'Could not find requested illust'

  pass
