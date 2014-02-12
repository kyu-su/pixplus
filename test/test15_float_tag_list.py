import time

from test_base import TestCase

class Test_FloatTagList(TestCase):

  def check(self, element, on, margin_top = 0):
    self.js('''
      document.body.style.paddingBottom="100%";
      var n = document.evaluate('//*[@class="ui-layout-west"]/*[@class="area_new" and *[@class="area_title"]/*[contains(@class,"sprites-premium")]]',
                                document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (n) {
        n.parentNode.removeChild(n);
      }
      pixplus.Floater.update_height();
    ''')

    time.sleep(1)

    self.assertFalse(self.has_class(element, 'pp-float'))

    self.js('window.scrollBy(0, %d)' % (self.geom(element)[1] + 10))
    time.sleep(1)

    offset = -10
    if on:
      self.assertTrue(self.has_class(element, 'pp-float'))
      offset = 0
      margin_top += 60
    else:
      margin_top = 0
      pass

    self.assertEqual(self.geom(element)[1], offset + margin_top)

    self.js('window.scrollBy(0, 10)')
    time.sleep(1)

    self.assertEqual(self.geom(element)[1], offset * 2 + margin_top)

    self.js('window.scrollTo(0, 0)')
    time.sleep(1)
    pass

  def test_on(self):
    self.set_conf('general.float_tag_list', 1)

    self.open('/bookmark.php?rest=hide')
    self.check(self.q('.ui-layout-west'), True)
    self.check(self.q('.column-action-menu'), True, 1)

    self.open_test_user()
    self.check(self.q('.ui-layout-west'), True)

    self.open('/search.php?s_mode=s_tag&word=pixiv')
    headers = self.qa('#pp-search-header > *')
    self.assertEqual(len(headers), 3)
    self.assertTrue(self.has_class(headers[0], 'column-label'))
    self.assertTrue(self.has_class(headers[1], 'column-menu'))
    self.assertTrue(self.has_class(headers[2], 'column-order-menu'))
    self.check(self.q('#pp-search-header'), True)
    pass

  def test_off(self):
    self.set_conf('general.float_tag_list', 0)

    self.open('/bookmark.php?rest=hide')
    self.check(self.q('.ui-layout-west'), False)
    self.check(self.q('.column-action-menu'), False, 1)

    self.open_test_user()
    self.check(self.q('.ui-layout-west'), False)

    self.open('/search.php?s_mode=s_tag&word=pixiv')
    self.assertFalse(self.qa('#pp-search-header'))
    pass

  pass
