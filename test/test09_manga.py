from test_base import TestCase

class Test_Manga(TestCase):

  def check_indicator(self, pages, page_count):
    btn = self.q('#pp-popup-button-manga')
    self.assertTrue(btn.is_displayed())
    self.assertEqual(btn.text, '[M:%s/%d]' % ('-'.join(map(str, sorted(pages))), page_count))
    pass

  def check(self, illust_id, page_pattern):
    self.open('/member_illust.php?mode=manga&illust_id=%d' % illust_id)

    pages = self.js('return pixiv.context.pages')
    images = self.js('return pixiv.context.images')
    page_count = len(images)

    self.assertEqual(','.join(map(lambda p: '-'.join(map(str, p)), pages)), page_pattern)

    self.open_popup(illust_id)
    self.check_indicator([0], page_count)

    self.js('pixplus.popup.manga.start()')
    self.popup_wait_load()
    manga = self.safe_get_jsobj('pixplus.popup.illust.manga')

    self.assertEqual(manga['page_count'], len(images))
    self.assertEqual(len(manga['pages']), len(pages))

    for page in range(len(pages)):
      self.assertEqual(manga['pages'][page]['image_urls'], [images[p - 1] for p in pages[page]])
      pass

    for page in range(len(pages)):
      self.js('pixplus.popup.manga.show(%d)' % page)
      self.popup_wait_load()
      self.check_indicator(pages[page], page_count)

      sx, sy, sw, sh = self.geom(self.q('#pp-popup-image-scroller'))
      lx, ly, lw, lh = self.geom(self.q('#pp-popup-image-layout'))

      self.assertTrue(lx >= sx)
      self.assertTrue(ly >= sy)

      self.assertTrue(sx + sw >= lx + lw)
      self.assertTrue(sy + sh >= ly + lh)

      self.assertEqual(lx - sx, (sw - lw) / 2)
      self.assertEqual(ly - sy, (sh - lh) / 2)

      images = self.qa('#pp-popup-image-layout img')

      self.assertEqual([i.get_attribute('src') for i in images], manga['pages'][page]['image_urls'])

      x = lx
      for img in images:
        ix, iy, iw, ih = self.geom(img)
        self.assertTrue(ih <= lh)
        self.assertEqual(x, ix)
        self.assertEqual(iy - ly, (lh - ih) / 2)
        x += iw
        pass
      pass
    pass

  def test_manga(self):
    self.open('/member_illust.php?mode=manga&illust_id=6209105')

    self.assertEqual(self.js('return pixiv.context.pages'), [[1], [2], [3]])
    self.assertEqual(self.js('return pixiv.context.images'),
                     ['http://i1.pixiv.net/img01/img/pixiv/6209105_p0.jpg',
                      'http://i1.pixiv.net/img01/img/pixiv/6209105_p1.jpg',
                      'http://i1.pixiv.net/img01/img/pixiv/6209105_p2.jpg'])


    for page_pattern in '1,2-3,4', '1,3-2,4':
      iid = self.config['test-targets']['manga'][page_pattern]
      self.open_popup(iid)
      data = self.popup_get_illust_data()
      btn = self.q('#pp-popup-button-manga')
      self.assertTrue(data['manga']['available'])
      self.assertTrue(btn.is_displayed())
      self.assertEqual(btn.text, '[M:0/%d]' % data['manga']['page_count'])
      self.check(iid, page_pattern)
      pass
    pass

  pass
