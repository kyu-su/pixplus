from selenium.webdriver.support.select import Select

from test_base import TestCase

class Test_Format(TestCase):

  def test_format(self):
    self.open('/')

    for fmt in 'jpg', 'png', 'gif':
      iid, url = self.config['test-targets']['format'][fmt]
      self.open_popup(iid)
      self.assertEqual(self.q('#pp-popup-image-layout img').get_attribute('src'), url)
      pass
    pass

  pass
