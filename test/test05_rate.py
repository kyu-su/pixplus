import time
import warnings

from selenium.webdriver import ActionChains

from test_base import TestCase

class Test_Rate(TestCase):
  repeatable = False

  def check(self, confirm):
    rating = self.find_illust(lambda popup: self.qa('#pp-popup-rating .score .rating:not(.rated)', popup))
    rating = rating[0]
    self.js('pixplus.popup.show_caption()')
    self.assertEquals(self.popup_get_illust_data('rated'), False)

    score = (int(time.time()) % 9) + 1
    width = score * 26

    ac = ActionChains(self.driver)
    ac.move_to_element_with_offset(rating, width - 10, 10).perform()
    # click() moves cursor to center on Firefox22
    ac.click_and_hold().release().perform()

    if confirm:
      self.alert_accept()
      pass

    rate = self.q('.rate', rating)
    self.assertEqual(rate.size['width'], width)

    self.assertTrue(self.qa('#pp-popup-rating .score .rating.rated'))

    self.popup_reload()

    self.assertTrue(self.qa('#pp-popup-rating .score .rating.rated'))
    self.assertEquals(self.popup_get_illust_data('rated'), True)
    pass

  def test_rate(self):
    if not self.browser.supports_alert:
      warnings.warn('%s is not supports alert handling' % self.browser.name)
      return

    self.open_test_user()
    self.set_conf('general.rate_confirm', True)
    self.check(True)
    pass

  def test_rate_noconfirm(self):
    self.open_test_user()
    self.set_conf('general.rate_confirm', False)
    self.check(False)
    pass

  pass
