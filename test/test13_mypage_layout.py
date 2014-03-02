import time
import warnings

try:
  from functools import reduce
except ImportError:
  pass

import util
from test_base import TestCase

class Test_Mypage(TestCase):

  def set_layout_cookie(self, layout):
    if layout is None:
      cookie = None
    else:
      cookie = ['token=20100713']
      for c in 'ntebm':
        cookie.append('%s_o=%d' % (c, layout.lower().index(c)))
        cookie.append('%s_v=%d' % (c, 1 if c in layout else 0))
        pass
      cookie = util.quote('&'.join(cookie), '')
      pass
    self.set_cookie('pixiv_mypage', cookie, 'pixiv.net', '/')
    time.sleep(1)
    pass

  def check_pixiv_jsobj(self, layout):
    order, visible = tuple(self.js('return [pixiv.mypage.order, pixiv.mypage.visible]'))
    self.assertEqual(order, list(layout.lower()))
    self.assertEqual(visible, dict(zip(layout.lower(), map(lambda c: c.upper() == c, layout))))
    pass

  def check_update(self, layout):
    self.set_layout_cookie(layout)
    self.reload()
    self.check_pixiv_jsobj(layout)
    pass

  def set_layout_history(self, layouts):
    now = int(time.time()) * 1000
    day = 1000 * 60 * 60 * 24
    offsets = reduce(lambda a, b: a + [a[-1] + a[-2]], range(len(layouts)), [1, 2])[2:]
    times = [now - day * o for o in offsets]
    self.set_conf('mypage.layout_history', ','.join(map(':'.join, zip(layouts, map(str, times)))))
    return layouts, times

  def get_layout_history(self):
    history = self.get_conf('mypage.layout_history')
    return [e.split(':')[0] for e in history.split(',')]

  def test_layout1(self):
    self.set_layout_cookie(None)
    self.open('/mypage.php')
    self.check_pixiv_jsobj('NTEBM')

    self.check_update('ntebm')
    self.check_update('MBETN')
    self.check_update('TeBmN')
    self.check_update('bEtNm')

    self.assertEqual(self.get_layout_history(), ['bEtNm', 'TeBmN', 'MBETN', 'ntebm', 'NTEBM'])
    pass

  def test_layout2(self):
    layouts, times = self.set_layout_history(['bEtNm', 'TeBmN', 'MBETN', 'ntebm', 'NTEBM'])
    self.set_layout_cookie(layouts[0])

    self.open('/mypage.php')

    btn = self.q('.pp-layout-history')
    self.assertTrue(btn.get_attribute('data-tooltip'))

    self.move_to(btn)
    self.assertTrue(self.q('#ui-tooltip-container').is_displayed())
    self.assertEqual(self.q('#ui-tooltip-container p').text, btn.get_attribute('data-tooltip'))

    self.click(btn)
    self.assertTrue(self.q('#pp-layout-history-manager').is_displayed())

    history = self.qa('#pp-layout-history li')
    times_s = [time.strftime('%Y/%m/%d', time.localtime(t / 1000)).replace('/0', '/') for t in times]
    self.assertEqual([e.get_attribute('data-pp-layout') for e in history], layouts)
    self.assertEqual([e.text for e in history], times_s)

    for item in history:
      self.move_to(item)
      layout = ''.join(map(lambda e: e.get_attribute('data-pp-key'), self.qa('#pp-layout-preview li')))
      self.assertEqual(item.get_attribute('data-pp-layout'), layout)
      pass
    pass

  def test_layout3(self):
    layouts, times = self.set_layout_history(['bEtNm', 'TeBmN', 'MBETN', 'ntebm', 'NTEBM'])

    self.set_layout_cookie('TeBmN')
    self.open('/mypage.php')
    self.assertEqual(self.get_layout_history(), ['TeBmN', 'bEtNm', 'MBETN', 'ntebm', 'NTEBM'])

    self.set_layout_cookie('ntebm')
    self.open('/mypage.php')
    self.assertEqual(self.get_layout_history(), ['ntebm', 'TeBmN', 'bEtNm', 'MBETN', 'NTEBM'])
    pass

  def test_layout4(self):
    layouts, times = self.set_layout_history(['bEtNm', 'TeBmN', 'MBETN', 'ntebm', 'NTEBM'])
    self.set_layout_cookie('bEtNm')
    self.open('/mypage.php')

    self.click(self.q('.pp-layout-history'))
    self.click(self.q('#pp-layout-history li[data-pp-layout="TeBmN"]'))

    self.wait_page_load()

    self.check_pixiv_jsobj('TeBmN')
    self.assertEqual(self.get_layout_history(), ['TeBmN', 'bEtNm', 'MBETN', 'ntebm', 'NTEBM'])

    self.click(self.q('.pp-layout-history'))
    self.click(self.q('#pp-layout-history li[data-pp-layout="ntebm"]'))

    self.wait_page_load()

    self.check_pixiv_jsobj('ntebm')
    self.assertEqual(self.get_layout_history(), ['ntebm', 'TeBmN', 'bEtNm', 'MBETN', 'NTEBM'])
    pass

  pass
