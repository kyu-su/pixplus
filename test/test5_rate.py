import time
import warnings

from selenium.webdriver import ActionChains

from test_base import TestCase

class Test_Rate(TestCase):

  def test_rate(self):
    self.open_test_user()
    if not self.browser.supports_alert:
      self.driver.execute_script('pixplus.conf.general.rate_confirm=false')
      pass

    rating = self.find_illust(lambda popup: self.qa('#pp-popup-rating .score .rating:not(.rated)', popup))
    rating = rating[0]
    self.driver.execute_script('pixplus.popup.show_caption()')
    self.assertEquals(self.popup_get_illust_data('rated'), False)

    if self.browser.name == 'safari':
      warnings.warn('ActionChains.move_to_element_with_offset() is currently not supported by safari driver', FutureWarning)
      rating.click()
    else:
      action_chains = ActionChains(self.driver)
      action_chains.move_to_element_with_offset(rating, 220, 10).click().perform()
      self.alert_accept()
      rate = self.q('.rate', rating)
      self.assertEqual(rate.size['width'], 234)
      pass

    self.assertTrue(self.qa('#pp-popup-rating .score .rating.rated'))

    self.popup_reload()

    self.assertTrue(self.qa('#pp-popup-rating .score .rating.rated'))
    self.assertEquals(self.popup_get_illust_data('rated'), True)
    pass

  pass
