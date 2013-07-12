import warnings

try:
  import urllib.parse as urlparse
except ImportError:
  import urlparse
  pass

from test_base import TestCase

class Test_AdvancedSearch(TestCase):

  def get_radio(self, name):
    return self.q('#search-option .content form input[type="radio"][name="%s"]:checked' % name)

  def set_size(self, wlt, hlt, wgt, hgt):
    for name in 'wlt', 'hlt', 'wgt', 'hgt':
      value = locals()[name]
      e = self.q('#pp-search-size-custom-' + name)
      e.clear()
      if value is not None:
        e.send_keys(str(value))
        pass
      pass

    radio = self.get_radio('size')
    value = '%sx%s-%sx%s' % tuple(map(lambda a: '' if a is None else str(a), [wlt, hlt, wgt, hgt]))
    self.assertEquals(radio.get_attribute('value'), value)
    pass

  def check_size(self, wlt, hlt, wgt, hgt):
    self.open('/search.php?s_mode=s_tag&word=pixiv')
    self.q('.search-option').click()

    self.set_size(wlt, hlt, wgt, hgt)
    self.q('#search-option .content form').submit()
    self.wait_page_load()

    self.assertTrue(self.url.startswith('http://www.pixiv.net/search.php?'))
    url = urlparse.urlparse(self.url)
    query = dict(urlparse.parse_qsl(url.query))

    for name in 'wlt', 'hlt', 'wgt', 'hgt':
      value = locals()[name]
      self.assertEquals(name in query, value is not None)
      if value is not None:
        self.assertEquals(query[name], str(value))
        pass
      pass
    pass

  def test_size(self):
    self.check_size(1, 2, 3, 4)
    self.check_size(5, None, 6, None)
    self.check_size(None, 7, None, 8)
    pass

  def check_slider(self, slider, knob, text):
    if self.b.name == 'safari':
      warnings.warn('safaridriver is currently not supports move_to_*', FutureWarning)
      return

    ac = self.ac()
    sx, sy, sw, sh = self.geom(slider)

    ac.click_and_hold(knob or slider).move_by_offset(-sw, 0).release().perform()

    self.assertEquals(text.get_attribute('value'), '-1.5')
    self.assertEquals(self.get_radio('ratio').get_attribute('value'), '-1.5')
    if knob:
      kx, ky, kw, kh = self.geom(knob)
      self.assertEquals(kx, sx)
      self.assertEquals(ky, sy)
      pass

    if knob:
      ac.click_and_hold(knob)
    else:
      ac.move_to_element_with_offset(slider, 2, 4).click_and_hold()
      pass
    ac.move_by_offset(sw * 2, 0).release().perform()

    self.assertEquals(text.get_attribute('value'), '1.5')
    self.assertEquals(self.get_radio('ratio').get_attribute('value'), '1.5')
    if knob:
      kx, ky, kw, kh = self.geom(knob)
      self.assertEquals(kx, sx + sw - kw)
      self.assertEquals(ky, sy)
      pass
    pass

  def test_ratio(self):
    if self.b.name == 'opera':
      warnings.warn('This test is currently not works on opera...')
      return

    self.open('/search.php?s_mode=s_tag&word=pixiv')
    self.q('.search-option').click()

    slider = self.q('#pp-search-ratio-custom-slider')
    if slider.tag_name.lower() != 'input':
      warnings.warn('%s seems not supports <input type=range>' % self.b.name)
      return

    text = self.q('#pp-search-ratio-custom-text')

    self.assertEquals(slider.get_attribute('min'), '-1.5')
    self.assertEquals(slider.get_attribute('max'), '1.5')
    self.check_slider(slider, None, text)

    text.clear()
    text.send_keys('123')
    self.assertEquals(self.get_radio('ratio').get_attribute('value'), '123')
    pass

  def test_ratio_debug(self):
    self.set_conf('general.debug', True)
    self.open('/search.php?s_mode=s_tag&word=pixiv')
    self.q('.search-option').click()

    slider = self.q('#pp-search-ratio-custom-slider.pp-slider')
    sx, sy, sw, sh = self.geom(slider)
    self.assertEquals(sw, 168)
    self.assertEquals(sh, 16)

    rx, ry, rw, rh = self.geom(self.q('.pp-slider-rail', slider))
    self.assertEquals(rw, 160)
    self.assertEquals(rh, 2)
    self.assertEquals(rx - sx, 4)
    self.assertEquals(ry - sy, 7)
    self.assertEquals((sx + sw) - (rx + rw), 4)
    self.assertEquals((sy + sh) - (ry + rh), 7)

    knob = self.q('.pp-slider-knob', slider)
    kx, ky, kw, kh = self.geom(knob)
    self.assertEquals(kx - rx, (rw - kw) / 2)
    self.assertEquals(ky, sy)
    self.assertEquals(kw, 8)
    self.assertEquals(kh, 16)

    text = self.q('#pp-search-ratio-custom-text')
    self.check_slider(slider, knob, text)
    pass

  pass
