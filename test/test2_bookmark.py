import time
import warnings

from selenium.webdriver.common.keys import Keys

from test_base import TestCase

class Test_Bookmark(TestCase):

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

  def test_bookmark(self):
    self.open_test_user()
    popup = self.open_popup()

    bookmark_btn = self.q('#pp-popup-button-bookmark', popup)
    if self.has_class(bookmark_btn, 'pp-active'):
      self.unbookmark()
      self.test_bookmark()
      return

    self.assertFalse(self.has_class(bookmark_btn, 'pp-active'))

    self.driver.execute_script('pixplus.popup.bookmark.start()')
    self.popup_wait_load()

    input_tag = self.q('#input_tag', popup)
    first_tag = self.q('.tag-cloud-container .tag', popup)

    if self.browser.name == 'safari':
      warnings.warn('WebElement.send_keys(Keys.ARROW_DOWN) is currently not working on safari driver', FutureWarning)
    else:
      input_tag.clear()
      # do not works with safari driver...
      input_tag.send_keys(Keys.ARROW_DOWN)
      self.assertTrue(self.has_class(first_tag, 'pp-tag-select'))

      input_tag.send_keys(Keys.SPACE)
      self.assertEquals(input_tag.get_attribute('value'), first_tag.get_attribute('data-tag'))

      if self.browser.name == 'opera':
        warnings.warn('WebElement.send_keys(Keys.ESCAPE) is currently not working on opera driver', FutureWarning)
      else:
        input_tag.send_keys(Keys.ESCAPE)
        self.assertFalse(self.has_class(first_tag, 'pp-tag-select'))
        pass
      pass

    form = self.q('form[action*="bookmark_add.php"]', popup)
    form.submit()
    self.popup_wait_load()

    for i in range(10):
      if not self.has_class(bookmark_btn, 'pp-active'):
        break
      time.sleep(1)
      self.popup_reload()
      pass

    self.assertFalse(self.has_class(bookmark_btn, 'pp-active'))

    time.sleep(1)
    self.unbookmark()
    pass

  pass
