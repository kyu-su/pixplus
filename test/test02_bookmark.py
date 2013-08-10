from selenium.webdriver.common.keys import Keys

from test_base import TestCase

class Test_Bookmark(TestCase):

  def check_tag_selection(self):
    input_tag = self.q('#pp-popup-bookmark-wrapper #input_tag')
    tags = self.qa('#pp-popup-bookmark-wrapper .tag-cloud-container .tag')

    input_tag.clear()

    tags[0].click()
    self.assertEqual(input_tag.get_attribute('value').strip(), tags[0].get_attribute('data-tag'))

    tags[0].click()
    self.assertEqual(input_tag.get_attribute('value').strip(), '')
    pass

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

    self.start_bookmark()
    self.check_tag_selection()
    self.end_bookmark()
    self.start_bookmark()
    self.check_tag_selection()

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
