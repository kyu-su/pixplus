import os
import io
import time
import zipfile

from PIL import Image, ImageChops

from test_base import TestCase
import util

class Test_Ugoira(TestCase):
  illust_id = 44298467
  zip_url = 'http://i2.pixiv.net/img-zip-ugoira/img/2014/06/25/14/30/22/44298467_ugoira600x600.zip'
  zip_filename = zip_url.split('/')[-1]

  def setUp(self):
    TestCase.setUp(self)
    if not os.path.exists(self.zip_filename):
      util.download(self.zip_url, zip_filename)
    zf = zipfile.ZipFile(self.zip_filename)
    self.images = dict([(fn, Image.open(io.BytesIO(zf.read(fn))).convert('RGB')) for fn in zf.namelist()])

  def frame_count(self):
    return self.js('return pixplus.popup.ugoira_frame_count()')

  def current_frame(self):
    return self.js('return pixplus.popup.ugoira_current_frame()')

  def test_ugoira(self):
    self.open('/')
    self.open_popup(self.illust_id)
    self.js('pixplus.popup.hide_caption()')

    frames = self.js('return pixplus.popup.illust.ugoira.frames')
    canvas = self.q('#pp-popup-image-layout canvas')

    img1 = self.screenshot(canvas)
    self.wait_until(lambda d: not self.image_isEqual(img1, self.screenshot(canvas)))

    self.send_keys('m')
    time.sleep(1)

    img1 = self.screenshot(canvas)
    time.sleep(1)
    img2 = self.screenshot(canvas)
    self.save_image(img1, 'test22_ugoira_pause_test_expected.png')
    self.save_image(img2, 'test22_ugoira_pause_test_got.png')
    self.assertImageEqual(img1, img2)

    curframe = self.current_frame()
    img1 = self.images[frames[curframe]['file']]
    img2 = self.screenshot(canvas)
    self.save_image(img1, 'test22_ugoira_frame_test_expected.png')
    self.save_image(img2, 'test22_ugoira_frame_test_got.png')
    self.assertImageEqual(img1, img2)

    self.send_keys(',')
    curframe = self.frame_count() - 1 if curframe == 0 else curframe - 1
    img1 = self.images[frames[curframe]['file']]
    img2 = self.screenshot(canvas)
    self.save_image(img1, 'test22_ugoira_prev_frame_test_expected.png')
    self.save_image(img2, 'test22_ugoira_prev_frame_test_got.png')
    self.assertImageEqual(img1, img2)

    self.send_keys('.')
    curframe = 0 if curframe == self.frame_count() - 1 else curframe + 1
    img1 = self.images[frames[curframe]['file']]
    img2 = self.screenshot(canvas)
    self.save_image(img1, 'test22_ugoira_next_frame_test_expected.png')
    self.save_image(img2, 'test22_ugoira_next_frame_test_got.png')
    self.assertImageEqual(img1, img2)
