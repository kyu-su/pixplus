import time

from test_base import TestCase

class Test_FloatTagList(TestCase):

  def setUp(self):
    self.set_window_size(1024, 1600)
    time.sleep(1)

  def check(self, element, on, margin_top = 0):
    self.assertFalse(self.has_class(element, 'pp-float'))

    self.js('window.scrollBy(0, %d)' % (self.geom(element)[1] + 10))
    time.sleep(1)

    offset = -10
    if on:
      self.assertTrue(self.has_class(element, 'pp-float'))
      offset = 0
      # margin_top += 60
    else:
      margin_top = 0

    self.assertEqual(self.geom(element)[1], offset + margin_top)

    self.js('window.scrollBy(0, 10)')
    time.sleep(1)

    self.assertEqual(self.geom(element)[1], offset * 2 + margin_top)

    self.js('window.scrollTo(0, 0)')
    time.sleep(1)

  def test_on(self):
    self.set_conf('general.float_tag_list', 1)

    self.open('/bookmark.php?rest=hide')
    self.check(self.q('.ui-layout-west'), True)

    self.open_test_user()
    self.check(self.q('.ui-layout-west'), True)

  def test_off(self):
    self.set_conf('general.float_tag_list', 0)

    self.open('/bookmark.php?rest=hide')
    self.check(self.q('.ui-layout-west'), False)

    self.open_test_user()
    self.check(self.q('.ui-layout-west'), False)
