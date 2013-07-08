import urlparse

from selenium.webdriver import ActionChains

from test_base import TestCase

class Test_AdvancedSearch(TestCase):

  def set_size(self, wlt, hlt, wgt, hgt):
    for name in 'wlt', 'hlt', 'wgt', 'hgt':
      value = locals()[name]
      e = self.q('#pp-search-size-custom-' + name)
      e.clear()
      if value is not None:
        e.send_keys(str(value))
        pass
      pass

    radio = self.q('#search-option .content form input[type="radio"][name="size"]:checked')
    value = '%sx%s-%sx%s' % tuple(map(lambda a: '' if a is None else str(a), [wlt, hlt, wgt, hgt]))
    self.assertEquals(radio.get_attribute('value'), value)
    pass

  def check_size(self, wlt, hlt, wgt, hgt):
    self.open('/search.php?s_mode=s_tag&word=pixiv')
    self.q('.search-option').click()

    self.set_size(wlt, hlt, wgt, hgt)
    self.q('#search-option .content form').submit()

    self.assertTrue(self.driver.current_url.startswith('http://www.pixiv.net/search.php?'))
    url = urlparse.urlparse(self.driver.current_url)
    query = dict(urlparse.parse_qsl(url.query))

    for name in 'wlt', 'hlt', 'wgt', 'hgt':
      value = locals()[name]
      self.assertEquals(name in query, value is not None)
      if value is not None:
        self.assertEquals(query[name], str(value))
        pass
      pass
    pass

  def test_layout1(self):
    self.check_size(1, 2, 3, 4)
    self.check_size(5, None, 6, None)
    self.check_size(None, 7, None, 8)
    pass

  pass
