import time

from test_base import TestCase

class Test_Rate(TestCase):
  repeatable = False

  def check(self, confirm):
    self.find_illust(lambda i: not self.popup_get_illust_data('rated'))

    self.popup_show_caption()
    time.sleep(1)

    rating = self.q('#pp-popup-rating .score .rating:not(.rated)')

    score = (int(time.time()) % 9) + 1
    width = score * 26

    self.move_to(rating, width - 10, 10)
    # click() moves cursor to center on Firefox22
    self.ac().click_and_hold().release().perform()

    if confirm:
      self.alert_accept()
      pass

    rate = self.q('#pp-popup-rating .score .rating .rate')
    self.assertEqual(rate.size['width'], width)

    self.assertTrue(self.qa('#pp-popup-rating .score .rating.rated'))

    self.popup_reload()

    self.assertTrue(self.qa('#pp-popup-rating .score .rating.rated'))
    self.assertEqual(self.popup_get_illust_data('rated'), True)
    pass

  def test_rate(self):
    if not self.b.supports_alert:
      self.skipTest('%s is not supports alert handling' % self.b.name)
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
