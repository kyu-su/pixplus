import os
import unittest
import time
import json
import math, operator

from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException
from PIL import Image, ImageChops

import util

class TestCase(unittest.TestCase):
  run_in_pixiv = True
  repeatable = True

  def __init__(self, browser, config, testname):
    unittest.TestCase.__init__(self, testname)
    self.b = browser
    self.config = config
    pass

  @classmethod
  def list_tests(cls):
    return filter(lambda n: n.startswith('test_'), dir(cls))

  def __getattr__(self, name):
    return getattr(self.b, name)

  def setUp(self):
    if self.args.repeatable and not self.repeatable:
      self.skipTest('%s is not repeatable' % self.__class__.__name__)
      pass

    if self.run_in_pixiv:
      conf = util.read_json(os.path.join(self.rootdir, 'temp', 'config.json'))

      if not self.url.startswith('http://www.pixiv.net/'):
        self.open('/')
        pass

      js = []
      for section in conf:
        for item in section['items']:
          js.append('pixplus.conf.%s.%s=%s' % (section['name'], item['key'], json.dumps(item['value'])))
          pass
        pass
      self.js(';'.join(js))
      pass
    pass

  def tearDown(self):
    self.wait_page_load()
    time.sleep(1)
    pass

  def open(self, path):
    url = 'http://www.pixiv.net%s' % path
    self.b.open(url)

    if self.qa('.one_column_body > .errorArea'):
      self.reload()
      pass

    self.wait_until(lambda d: self.js('return !!window.pixplus'))
    time.sleep(1)
    pass

  def wait_illust_list(self):
    try:
      self.wait_until(lambda d: self.js('return pixplus.illust.list.length>0'))
    except TimeoutException:
      raise RuntimeError('No illusts detected! - %s' % self.b.url)
    pass

  def has_class(self, element, classname):
    return ' %s ' % classname in ' %s ' % element.get_attribute('class')

  def open_popup(self, illust_id = None, idx = None):
    if illust_id is not None:
      self.js('pixplus.popup.show(pixplus.illust.create_from_id(%d))' % illust_id)
    else:
      self.wait_illust_list()
      self.js('pixplus.popup.show(pixplus.illust.list[%d])' % (idx or 0))
      pass
    return self.popup_wait_load()

  def close_popup(self):
    self.js('pixplus.popup.hide()')
    pass

  def popup_wait_load(self):
    popup = self.q('#pp-popup')
    self.assertTrue(popup.is_displayed(), self.url)
    self.wait_until(lambda d: not self.has_class(popup, 'pp-loading'))
    self.assertFalse(self.has_class(popup, 'pp-error'), self.url)
    return popup

  def popup_wait_big_image(self):
    self.wait_until(lambda d: self.js('''
      var illust = pixplus.popup.illust,
          images = pixplus.popup.images;
      if (pixplus.popup.manga.active) {
        var pages = illust.manga.pages[pixplus.popup.manga.page];
        if (images.length !== pages.length) {
          return false;
        }
        for(var i = 0; i < images.length; ++i) {
          if (images[i].src !== pages[i].image_url_big) {
            return false;
          }
        }
        return true;
      } else {
        return images.length === 1 && images[0] === illust.image_big;
      }
    '''))
    pass

  def popup_show_caption(self):
    self.js('pixplus.popup.show_caption()')
    pass

  def popup_reload(self):
    self.js('pixplus.popup.reload()')
    self.popup_wait_load()
    pass

  def popup_prev(self):
    self.js('pixplus.popup.show(pixplus.popup.illust.prev)')
    self.popup_wait_load()
    pass

  def popup_next(self):
    self.js('pixplus.popup.show(pixplus.popup.illust.next)')
    self.popup_wait_load()
    pass

  def popup_get_illust_data(self, name = None):
    obj = self.safe_get_jsobj('pixplus.popup.illust')
    if name is not None:
      return obj[name]
    return obj

  def open_test_user(self):
    self.open('/member_illust.php?id=%d' % self.config['test-user'])
    self.wait_illust_list()
    pass

  def find_illust(self, callback, *args):
    popup = self.open_popup()
    idx = 0
    while True:
      self.assertTrue(self.qa('#pp-popup'))

      r = callback(idx, *args)
      if r:
        return r

      self.popup_next()
      idx += 1
      pass
    pass

  def find_manga_page(self, callback, *args):
    popup = self.open_popup()
    while True:
      self.assertTrue(self.qa('#pp-popup'))

      manga = self.popup_get_illust_data('manga')
      if not manga['available']:
        self.popup_next()
        continue

      self.js('pixplus.popup.manga.start()')
      self.popup_wait_load()

      manga = self.popup_get_illust_data('manga')
      for page in range(len(manga['pages'])):
        self.js('pixplus.popup.manga.show(%d)' % page)
        self.popup_wait_load()
        r = callback(page, *args)
        if r:
          return r
        pass

      self.popup_next()
      pass
    pass

  def unbookmark(self, illust_id = None):
    if illust_id is None:
      illust_id = self.popup_get_illust_data('id')
      pass

    url = self.b.url

    def check():
      checkbox = self.xa('//li[contains(concat(" ", @class, " "), " image-item ") \
      and a[contains(@href, "mode=medium&illust_id=%d")]]//input[@name="book_id[]"]' % illust_id)
      if len(checkbox) >= 1:
        checkbox[0].click()
        return True
      return False

    self.open('/bookmark.php')
    checked = check()
    if not checked:
      self.open('/bookmark.php?rest=hide')
      self.assertTrue(check())
      pass

    if not self.b.supports_alert:
      self.js('window.confirm=function(){return true}')
      pass

    self.click(self.q('input[type="submit"][name="del"]'))
    if self.b.supports_alert:
      self.alert_accept()
      pass

    self.wait_page_load()
    self.b.open(url)
    pass

  def popup_poll_reload(self, callback):
    for i in range(10):
      if callback():
        break
      time.sleep(1)
      self.popup_reload()
      pass
    self.assertTrue(callback())
    pass

  def get_conf(self, key):
    return self.js('return pixplus.conf.%s' % key)

  def set_conf(self, key, value):
    self.js('pixplus.conf.%s=%s' % (key, json.dumps(value)))
    pass

  def safe_get_jsobj(self, name):
    obj = self.js('''
      var isobj = function(obj) {
        var pt = obj;
        while(true) {
          if (Object.getPrototypeOf(pt = Object.getPrototypeOf(pt)) === null) {
            break;
          }
        }
        return Object.getPrototypeOf(obj) === pt;
      };
      return (function copy(o) {
        if (!o || /^(?:number|boolean|string)$/.test(typeof(o))) {
          return o;
        } else if (typeof(o) === 'object') {
          if (isobj(o)) {
            var c = {};
            for(var k in o) {
              if (/^(?:prev|next)$/.test(k)) {
                continue;
              }
              c[k] = copy(o[k]);
            }
            return c;
          } else if (Array.isArray(o)) {
            return o.map(function(e) {
              return copy(e);
            });
          }
        }
        return null;
      })(%s);
    ''' % name)
    return obj

  def skipTest(self, reason):
    if hasattr(unittest.TestCase, 'skipTest'):
      unittest.TestCase.skipTest(self, reason)
      return
    raise unittest.SkipTest(reason)

  def send_keys(self, keys, target = None):
    if target:
      target.send_keys(keys)
    else:
      self.ac().send_keys(keys).perform()
      pass

    if self.qa('#pp-popup'):
      self.popup_wait_load()
      pass

    time.sleep(0.3)
    pass

  def lazy_scroll(self, elem):
    self.js('''
      var rect = arguments[0].getBoundingClientRect(),
          sw = document.documentElement.clientWidth,
          sh = document.documentElement.clientHeight;
      if (rect.left < 0 || rect.top < 0 || rect.right > sw || rect.bottom > sh) {
        pixplus.lazy_scroll(arguments[0]);
      }
    ''', elem)
    pass

  def move_to(self, elem, off = None):
    self.lazy_scroll(elem)
    if off:
      self.ac().move_to_element_with_offset(elem, off[0], off[1]).perform()
    else:
      self.ac().move_to_element(elem).perform()
      pass
    pass

  def click(self, elem, hold = True):
    self.lazy_scroll(elem)
    if hold:
      self.ac().move_to_element(elem).click_and_hold(elem).release().perform()
    else:
      self.ac().move_to_element(elem).click(elem).perform()
      # elem.click()
      pass
    pass

  def start_bookmark(self):
    self.js('pixplus.popup.bookmark.start()')
    self.popup_wait_load()
    pass

  def end_bookmark(self):
    self.js('pixplus.popup.bookmark.end()')
    pass

  def blur(self):
    self.js('document.activeElement && document.activeElement.blur()')
    pass

  def save_image(self, image, filename):
    path = os.path.join('screenshot', filename)
    dirpath = os.path.dirname(path)
    if not os.path.exists(dirpath):
      os.makedirs(dirpath)
      pass
    image.save(path)
    return image

  def image_diff(self, img1, img2, diff_filename):
    if img1.mode != img2.mode:
      raise RuntimeError('Image diff: Colorspace mismatch! - %s vs %s' % (img1.mode, img2.mode))
    diff = ImageChops.difference(img1, img2)
    if diff_filename is not None:
      self.save_image(diff, diff_filename)
      pass
    return diff

  def image_rmsdiff(self, img1, img2, diff_filename):
    diff = self.image_diff(img1.convert('L'), img2.convert('L'), diff_filename)
    h = diff.histogram()
    s = sum(map(lambda p, i: (p * ((i / float(len(h) - 1)) ** 2)), h, range(len(h))))
    return math.sqrt(s / float(operator.mul(*diff.size)))

  def image_isEqual(self, img1, img2, threshold = 0.001):
    return self.image_rmsdiff(img1, img2, None) < threshold

  def assertImageEqual(self, img1, img2, diff_filename, threshold = 0.001):
    self.assertLess(self.image_rmsdiff(img1, img2, diff_filename), threshold)
    pass

  def assertImageNotEqual(self, img1, img2, diff_filename, threshold = 0.001):
    self.assertGreaterEqual(self.image_rmsdiff(img1, img2, diff_filename), threshold)
    pass

  pass
