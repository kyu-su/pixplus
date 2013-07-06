import time
import warnings

from selenium.webdriver.common.keys import Keys

from test_base import TestCase

class Test_Bookmark(TestCase):

  def test_bookmark(self):
    self.open_test_user()
    self.open_popup()

    bookmark_btn = self.q('#pp-popup-button-bookmark')
    if self.has_class(bookmark_btn, 'pp-active'):
      self.unbookmark()
      self.open_popup()
      bookmark_btn = self.q('#pp-popup-button-bookmark')
      pass

    self.popup_reload_and_check_state(
      lambda: not self.has_class(bookmark_btn, 'pp-active')
      )

    self.driver.execute_script('pixplus.popup.bookmark.start()')
    self.popup_wait_load()

    form = self.q('#pp-popup-bookmark-wrapper form[action*="bookmark_add.php"]')
    form.submit()
    self.popup_wait_load()

    self.popup_reload_and_check_state(lambda: self.has_class(bookmark_btn, 'pp-active'))

    self.unbookmark()
    pass

  pass
