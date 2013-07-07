from test_base import TestCase

class Test_Manga(TestCase):

  def check(self, illust_id):
    self.open('/member_illust.php?mode=manga&illust_id=%d' % illust_id)
    pages = self.driver.execute_script('return pixiv.context.pages')
    images = self.driver.execute_script('return pixiv.context.images')

    self.open_popup(illust_id)
    self.driver.execute_script('pixplus.popup.manga.start()')
    self.popup_wait_load()
    manga = self.driver.execute_script('return pixplus.popup.illust.manga')

    self.assertEquals(manga['page_count'], len(images))
    self.assertEquals(len(manga['pages']), len(pages))

    for page in range(len(pages)):
      self.assertEquals(manga['pages'][page]['image_urls'], map(lambda p: images[p - 1], pages[page]))
      pass

    for page in range(len(pages)):
      self.driver.execute_script('pixplus.popup.manga.show(%d)' % page)
      self.popup_wait_load()

      scroller = self.q('#pp-popup-image-scroller')
      layout   = self.q('#pp-popup-image-layout')
      images   = self.qa('#pp-popup-image-layout img')

      sl, ss = scroller.location, scroller.size
      sx, sy = sl['x'], sl['y']
      sw, sh = ss['width'], ss['height']

      ll, ls = layout.location, layout.size
      lx, ly = ll['x'], ll['y']
      lw, lh = ls['width'], ls['height']

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
        location = img.location
        size = img.size

        h = size['height']
        self.assertTrue(h <= lh)
        self.assertEquals(x, location['x'])
        self.assertEquals(location['y'] - ly, (lh - h) / 2)
        x += size['width']
        pass
      pass
    pass

  def test_manga(self):
    self.open('/member_illust.php?mode=manga&illust_id=6209105')
    self.assertEquals(self.driver.execute_script('return pixiv.context.pages'),
                      [[1], [2], [3]])
    self.assertEquals(self.driver.execute_script('return pixiv.context.images'),
                      ['http://i1.pixiv.net/img01/img/pixiv/6209105_p0.jpg',
                       'http://i1.pixiv.net/img01/img/pixiv/6209105_p1.jpg',
                       'http://i1.pixiv.net/img01/img/pixiv/6209105_p2.jpg'])


    self.open_test_user()

    ids = self.driver.execute_script('''
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
