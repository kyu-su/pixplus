from test_base import TestCase

class Test_Manga(TestCase):

  def geom2(self, element):
    if self.b.name == 'opera':
      pos = element.location
      size = element.size
      return pos['x'], pos['y'], size['width'], size['height']
    return self.geom(element)

  def check(self, illust_id):
    self.open('/member_illust.php?mode=manga&illust_id=%d' % illust_id)

    pages = self.js('return pixiv.context.pages')
    images = self.js('return pixiv.context.images')

    self.open_popup(illust_id)

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

      sx, sy, sw, sh = self.geom2(self.q('#pp-popup-image-scroller'))
      lx, ly, lw, lh = self.geom2(self.q('#pp-popup-image-layout'))

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


    self.open_test_user()

    ids = self.js('''
      return pixplus.illust.list.map(function(illust) {
        return illust.id;
      });
    ''')

    manga_ids = []
    for iid in ids:
      self.open_popup(iid)
      data = self.popup_get_illust_data()
      btn = self.q('#pp-popup-button-manga')
      if data['manga']['available']:
        self.assertTrue(btn.is_displayed())
        self.assertEqual(btn.text, '[M:0/%d]' % data['manga']['page_count'])
        manga_ids.append(iid)
      else:
        self.assertFalse(btn.is_displayed())
        pass
      pass

    self.assertTrue(manga_ids)

    for iid in manga_ids:
      self.check(iid)
      pass
    pass

  pass
