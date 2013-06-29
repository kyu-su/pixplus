from test_base import TestCase

class Test_Rate(TestCase):
  def test_rate(self):
    rating = self.find_illust(lambda popup: self.qa('#pp-popup-rating .score .rating:not(.rated)', popup))
    self.driver.execute_script('pixplus.popup.show_caption()')
    rating[0].click()
    self.alert_accept()
    self.assertTrue(self.qa('#pp-popup-rating .score .rating.rated'))
    self.popup_reload()
    self.assertTrue(self.qa('#pp-popup-rating .score .rating.rated'))
    pass
  pass
