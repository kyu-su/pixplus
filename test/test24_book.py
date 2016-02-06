import time
from PIL import Image

from test_base import TestCase

class Test_Manga(TestCase):

  def make_image(self, image_numbers):
    images = []
    width = 0
    max_height = 0
    frame_min_width = 480
    frame_min_height = 360

    for i in image_numbers:
      img = Image.open('images/manga_small/%d.png' % i)
      images.append(img)
      width += img.size[0]
      max_height = max(max_height, img.size[1])
      pass

    left = 1
    if width < frame_min_width:
      left += int((frame_min_width - width) / 2)
      pass

    height = max(max_height, frame_min_height)
    frame = Image.new('RGB', (max(width, frame_min_width) + 2, height + 2), 'white')
    for img in images:
      frame.paste(img, (left, int((height - img.size[1]) / 2) + 1))
      left += img.size[0]
      pass

    from PIL import ImageDraw
    draw = ImageDraw.Draw(frame)
    points = [(20,40), (25,60), (40,80), (60,75), (80,95), (85,20), (50,40)]
    draw.rectangle([0, 0, frame.size[0] - 1, frame.size[1] - 1], outline = 'rgb(170,170,170)')
    return frame

  def check(self, name, page, image_numbers):
    self.js('pixplus.popup.manga.show(%d)' % page)
    self.popup_wait_load()
    self.popup_wait_big_image()
    time.sleep(1)
    got = self.screenshot(self.q('#pp-popup-image-wrapper'))
    expected = self.make_image(image_numbers)
    self.save_image(got, 'test24_book_%s_%s_got.png' % (name, ','.join(map(str, image_numbers))))
    self.save_image(expected, 'test24_book_%s_%s_expected.png' % (name, ','.join(map(str, image_numbers))))
    self.assertImageEqual(got, expected)
    pass

  def test_illust_set(self):
    self.set_conf('popup.big_image', True)
    self.open_popup(self.config['test-targets']['book']['illust-set'])
    self.js('pixplus.popup.manga.start()')
    self.popup_wait_load()
    self.assertEqual(self.js('return pixplus.popup.illust.manga.pages.length'), 4)
    self.check('illust_set', 0, [1])
    self.check('illust_set', 1, [2])
    self.check('illust_set', 2, [3])
    self.check('illust_set', 3, [4])
    pass

  def test_illust_book_right(self):
    self.set_conf('popup.big_image', True)
    self.open_popup(self.config['test-targets']['book']['illust-book-right'])
    self.js('pixplus.popup.manga.start()')
    self.popup_wait_load()
    self.assertEqual(self.js('return pixplus.popup.illust.manga.pages.length'), 3)
    self.check('illust_book_right', 0, [1])
    self.check('illust_book_right', 1, [3, 2])
    self.check('illust_book_right', 2, [4])
    pass

  def test_illust_book_left(self):
    self.set_conf('popup.big_image', True)
    self.open_popup(self.config['test-targets']['book']['illust-book-left'])
    self.js('pixplus.popup.manga.start()')
    self.popup_wait_load()
    self.assertEqual(self.js('return pixplus.popup.illust.manga.pages.length'), 3)
    self.check('illust_book_left', 0, [1])
    self.check('illust_book_left', 1, [2, 3])
    self.check('illust_book_left', 2, [4])
    pass

  def test_manga_set(self):
    self.set_conf('popup.big_image', True)
    self.open_popup(self.config['test-targets']['book']['manga-set'])
    self.js('pixplus.popup.manga.start()')
    self.popup_wait_load()
    self.assertEqual(self.js('return pixplus.popup.illust.manga.pages.length'), 4)
    self.check('manga_set', 0, [1])
    self.check('manga_set', 1, [2])
    self.check('manga_set', 2, [3])
    self.check('manga_set', 3, [4])
    pass

  def test_manga_book_right(self):
    self.set_conf('popup.big_image', True)
    self.open_popup(self.config['test-targets']['book']['manga-book-right'])
    self.js('pixplus.popup.manga.start()')
    self.popup_wait_load()
    self.assertEqual(self.js('return pixplus.popup.illust.manga.pages.length'), 3)
    self.check('manga_book_right', 0, [1])
    self.check('manga_book_right', 1, [3, 2])
    self.check('manga_book_right', 2, [4])
    pass

  def test_manga_book_left(self):
    self.set_conf('popup.big_image', True)
    self.open_popup(self.config['test-targets']['book']['manga-book-left'])
    self.js('pixplus.popup.manga.start()')
    self.popup_wait_load()
    self.assertEqual(self.js('return pixplus.popup.illust.manga.pages.length'), 3)
    self.check('manga_book_left', 0, [1])
    self.check('manga_book_left', 1, [2, 3])
    self.check('manga_book_left', 2, [4])
    pass

  pass
