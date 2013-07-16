import time

from selenium.webdriver.common.keys import Keys

from test_base import TestCase

class Test_Bookmark(TestCase):

  def check(self, hide):
    self.open_popup()

    bookmark_btn = self.q('#pp-popup-button-bookmark')
    if self.has_class(bookmark_btn, 'pp-active'):
      self.unbookmark()
      self.open_popup()
      bookmark_btn = self.q('#pp-popup-button-bookmark')
      pass

    self.popup_poll_reload(
      lambda: not self.has_class(bookmark_btn, 'pp-active')
      )

    self.js('pixplus.popup.bookmark.start()')
    self.popup_wait_load()

    q = '#pp-popup-bookmark-wrapper input[type="radio"][name="restrict"][value="%d"]:checked'
    self.assertTrue(self.qa(q % (1 if hide else 0)))

    form = self.q('#pp-popup-bookmark-wrapper form[action*="bookmark_add.php"]')
    form.submit()
    self.popup_wait_load()

    self.popup_poll_reload(lambda: self.has_class(bookmark_btn, 'pp-active'))

    self.unbookmark()
    pass

  def test_bookmark(self):
    self.open_test_user()
    self.set_conf('general.bookmark_hide', False)
    self.check(False)
    pass

  def test_bookmark_hide(self):
    self.open_test_user()
    self.set_conf('general.bookmark_hide', True)
    self.check(True)
    pass

  pass
