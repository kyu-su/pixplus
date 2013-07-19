import warnings
import time
import random

import util
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
    self.assertEqual(radio.get_attribute('value'), value)
    pass

  def check_size(self, wlt, hlt, wgt, hgt):
    self.open('/search.php?s_mode=s_tag&word=pixiv')
    self.q('.search-option').click()

    self.set_size(wlt, hlt, wgt, hgt)
    self.q('#search-option .content form').submit()
    self.wait_page_load()

    self.assertTrue(self.url.startswith('http://www.pixiv.net/search.php?'))
    url = util.urlparse(self.url)
    query = dict(util.parse_qsl(url.query))

    for name in 'wlt', 'hlt', 'wgt', 'hgt':
      value = locals()[name]
      self.assertEqual(name in query, value is not None)
      if value is not None:
        self.assertEqual(query[name], str(value))
        pass
      pass
    pass

  def test_size(self):
    r = lambda: random.randint(1, 2000)
    self.check_size(*sorted(random.sample(range(2000), 4)))
    self.check_size(r(), None, r(), None)
    self.check_size(None, r(), None, r())
    pass

  def check_slider(self, slider, knob, text):
    if self.b.name == 'safari':
      warnings.warn('safaridriver is currently not supports move_to_*', FutureWarning)
      return

    sx, sy, sw, sh = self.geom(slider)

    self.ac().click_and_hold(knob or slider).move_by_offset(-sw, 0).release().perform()

    self.assertEqual(text.get_attribute('value'), '-1.5')
    self.assertEqual(self.get_radio('ratio').get_attribute('value'), '-1.5')
    if knob:
      kx, ky, kw, kh = self.geom(knob)
      self.assertEqual(kx, sx)
      self.assertEqual(ky, sy)
      pass

    ac = self.ac()
    if knob:
      ac.click_and_hold(knob)
    else:
      ac.move_to_element_with_offset(slider, 2, 4).click_and_hold()
      pass
    ac.move_by_offset(sw * 2, 0).release().perform()

    self.assertEqual(text.get_attribute('value'), '1.5')
    self.assertEqual(self.get_radio('ratio').get_attribute('value'), '1.5')
    if knob:
      kx, ky, kw, kh = self.geom(knob)
      self.assertEqual(kx, sx + sw - kw)
      self.assertEqual(ky, sy)
      pass
    pass

  def test_ratio(self):
    if self.b.name == 'opera':
      self.skipTest('This test is currently not works on opera...')
      return

    self.open('/search.php?s_mode=s_tag&word=pixiv')
    self.q('.search-option').click()

    slider = self.q('#pp-search-ratio-custom-slider')
    if slider.tag_name.lower() != 'input':
      self.skipTest('%s seems not supports <input type=range>' % self.b.name)
      return

    text = self.q('#pp-search-ratio-custom-text')

    self.assertEqual(slider.get_attribute('min'), '-1.5')
    self.assertEqual(slider.get_attribute('max'), '1.5')
    self.check_slider(slider, None, text)

    text.clear()
    text.send_keys('123')
    self.assertEqual(self.get_radio('ratio').get_attribute('value'), '123')
    pass

  def test_ratio_debug(self):
    self.set_conf('general.debug', True)
    self.open('/search.php?s_mode=s_tag&word=pixiv')
    self.q('.search-option').click()
    time.sleep(1)
    self.js('pixplus.lazy_scroll(arguments[0])', self.q('#pp-search-ratio-custom-slider'))
    time.sleep(1)

    slider = self.q('#pp-search-ratio-custom-slider.pp-slider')
    sx, sy, sw, sh = self.geom(slider)
    self.assertEqual(sw, 168)
    self.assertEqual(sh, 16)

    rx, ry, rw, rh = self.geom(self.q('#pp-search-ratio-custom-slider.pp-slider .pp-slider-rail'))
    self.assertEqual(rw, 160)
    self.assertEqual(rh, 2)
    self.assertEqual(rx - sx, 4)
    self.assertEqual(ry - sy, 7)
    self.assertEqual((sx + sw) - (rx + rw), 4)
    self.assertEqual((sy + sh) - (ry + rh), 7)

    knob = self.q('#pp-search-ratio-custom-slider.pp-slider .pp-slider-knob')
    kx, ky, kw, kh = self.geom(knob)
    self.assertEqual(kx - rx, (rw - kw) / 2)
    self.assertEqual(ky, sy)
    self.assertEqual(kw, 8)
    self.assertEqual(kh, 16)

    text = self.q('#pp-search-ratio-custom-text')
    self.check_slider(slider, knob, text)
    pass

  pass
