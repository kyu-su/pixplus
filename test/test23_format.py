from selenium.webdriver.support.select import Select

from test_base import TestCase

class Test_Format(TestCase):

  def test_format(self):
    self.set_conf('popup.big_image', True)
    self.open_test_user()

    for fmt in 'jpg', 'png', 'gif':
      iid, url = self.config['test-targets']['format'][fmt]
      self.find_illust(lambda i: self.popup_get_illust_data('id') == iid)
      self.popup_wait_big_image()
      self.assertEqual(self.q('#pp-popup-image-layout img').get_attribute('src'), url)
