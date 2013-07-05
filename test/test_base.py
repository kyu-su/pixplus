import unittest
import time

from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.alert import Alert

class TestCase(unittest.TestCase):
  repeatable = True

  def __init__(self, browser, config, testname):
    unittest.TestCase.__init__(self, testname)
    self.browser = browser
    self.driver = browser.driver
    self.config = config
    self.repeatable = config.get('repeatable', False)
    pass

  @classmethod
  def list_tests(cls):
    return filter(lambda n: n.startswith('test_'), dir(cls))

  def wait_until(self, callback):
    wait = WebDriverWait(self.driver, 10)
    wait.until(callback)
    pass

  def alert_accept(self):
    if self.browser.supports_alert:
      Alert(self.driver).accept()
    else:
      time.sleep(1)
      pass
    pass

  def open(self, url):
    self.driver.get('http://www.pixiv.net%s' % url)
    self.wait_until(lambda d: d.execute_script('return !!window.pixplus'))
    pass

  def reload(self):
    self.driver.get(self.driver.current_url)
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

  def open_popup(self, illust_id = None, idx = None):
    if illust_id is not None:
      self.driver.execute_script('pixplus.popup.show(pixplus.illust.create_from_id(%d))' % illust_id)
    else:
      self.driver.execute_script('pixplus.popup.show(pixplus.illust.list[%d])' % (idx or 0))
      pass
    popup = self.q('#pp-popup')
    self.assertTrue(popup.is_displayed())
    self.popup_wait_load()
    return popup

  def popup_wait_load(self):
    popup = self.q('#pp-popup')
    self.wait_until(lambda driver: not self.has_class(popup, 'pp-loading'))
    self.assertFalse(self.has_class(popup, 'pp-error'))
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

  def popup_get_illust_data(self, name = None):
    obj = self.driver.execute_script('''
      return (function(illust) {
        var r = {};
        for(var key in illust) {
          if (!/^(?:prev|next)$/.test(key)) {
            r[key] = illust[key];
          }
        }
        return r;
      })(pixplus.popup.illust);
    ''')
    if name is not None:
      return obj[name]
    return obj

  def open_test_user(self):
    self.open('/member_illust.php?id=%d' % self.config['test-user'])
    pass

  def find_illust(self, callback, *args):
    popup = self.open_popup()
    while True:
      r = callback(popup, *args)
      if r:
        return r
      self.popup_next()
      self.assertTrue(self.qa('#pp-popup'))
      pass
    pass

  def unbookmark(self, illust_id = None):
    if illust_id is None:
      illust_id = self.popup_get_illust_data('id')
      pass

    url = self.driver.current_url
    self.open('/bookmark.php')

    if not self.browser.supports_alert:
      self.driver.execute_script('window.confirm=function(){return true}')
      pass

    link = self.q('a[href*="illust_id=%d"]' % illust_id)
    checkbox = self.q('input[name="book_id[]"]', link.parent)
    checkbox.click()
    self.q('input[type="submit"][name="del"]').click()
    self.alert_accept()
    self.driver.get(url)
    pass

  def popup_reload_and_check_state(self, callback):
    for i in range(10):
      if callback():
        break
      time.sleep(1)
      self.popup_reload()
      pass
    self.assertTrue(callback())
    pass

  pass
