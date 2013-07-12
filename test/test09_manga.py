import time

from test_base import TestCase

class Test_Manga(TestCase):

  def check(self, illust_id):
    self.open('/member_illust.php?mode=manga&illust_id=%d' % illust_id)
    self.wait_page_load()

    pages = self.js('return pixiv.context.pages')
    images = self.js('return pixiv.context.images')

    self.open_popup(illust_id)
    self.js('pixplus.popup.manga.start()')
    self.popup_wait_load()
    manga = self.safe_get_jsobj('pixplus.popup.illust.manga')

    self.assertEquals(manga['page_count'], len(images))
    self.assertEquals(len(manga['pages']), len(pages))

    for page in range(len(pages)):
      self.assertEquals(manga['pages'][page]['image_urls'],
                        list(map(lambda p: images[p - 1], pages[page])))
      pass

    for page in range(len(pages)):
      self.js('pixplus.popup.manga.show(%d)' % page)
      self.popup_wait_load()

      scroller = self.q('#pp-popup-image-scroller')
      layout   = self.q('#pp-popup-image-layout')
      images   = self.qa('#pp-popup-image-layout img')

      sx, sy, sw, sh = self.geom(scroller)
      lx, ly, lw, lh = self.geom(layout)

      self.assertTrue(lx >= sx)
      self.assertTrue(ly >= sy)

      self.assertTrue(sx + sw >= lx + lw)
      self.assertTrue(sy + sh >= ly + lh)

      self.assertEquals(lx - sx, (sw - lw) / 2)
      self.assertEquals(ly - sy, (sh - lh) / 2)

      self.assertEquals(list(map(lambda i: i.get_attribute('src'), images)),
                        manga['pages'][page]['image_urls'])

      x = lx
      for img in images:
        ix, iy, iw, ih = self.geom(img)
        self.assertTrue(ih <= lh)
        self.assertEquals(x, ix)
        self.assertEquals(iy - ly, (lh - ih) / 2)
        x += iw
        pass
      pass
    pass

  def test_manga(self):
    self.open('/member_illust.php?mode=manga&illust_id=6209105')
    self.wait_page_load()

    self.assertEquals(self.js('return pixiv.context.pages'), [[1], [2], [3]])
    self.assertEquals(self.js('return pixiv.context.images'),
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
      if data['manga']['available']:
        manga_ids.append(iid)
        pass
      pass

    self.assertTrue(manga_ids)

    for iid in manga_ids:
      self.check(iid)
      pass
    pass

  pass
