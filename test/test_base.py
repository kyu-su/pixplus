import os
import unittest
import time
import json

import util

from selenium.webdriver.common.keys import Keys

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
    if hasattr(self.b, name):
      return getattr(self.b, name)
    raise AttributeError()

  def setUp(self):
    if self.args.repeatable and not self.repeatable:
      self.skipTest('%s is not repeatable' % self.__class__.__name__)
      pass

    if self.run_in_pixiv:
      conf = util.read_json(os.path.join(self.rootdir, 'temp', 'config.json'))

      if not self.url.startswith('http://www.pixiv.net/'):
        self.open('/')
        pass

      for section in conf:
        for item in section['items']:
          self.set_conf('%s.%s' % (section['name'], item['key']), item['value'])
          pass
        pass
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
    pass

  def wait_illust_list(self):
    self.wait_until(lambda d: self.js('return pixplus.illust.list.length>0'))
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

    popup = self.q('#pp-popup')
    self.assertTrue(popup.is_displayed())
    self.popup_wait_load()
    return popup

  def close_popup(self):
    self.js('pixplus.popup.hide()')
    pass

  def popup_wait_load(self):
    popup = self.q('#pp-popup')
    self.wait_until(lambda d: not self.has_class(popup, 'pp-loading'))
    self.assertFalse(self.has_class(popup, 'pp-error'))
    pass

  def popup_wait_big_image(self):
    self.wait_until(lambda d: self.js('''
      var illust = pixplus.popup.illust,
          images = pixplus.popup.images;
      if (pixplus.popup.manga.active) {
        var page = illust.manga.pages[pixplus.popup.manga.page];
        return (images.length === page.images_big.length &&
                images.reduce(function(a, b, i) {
                  return a && b === page.images_big[i];
                }, true));
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
      return self.js('''
        var link = document.querySelector('input[name="book_id[]"]~a[href*="illust_id=%d"]');
        if (!link) {
          return false;
        }

        var check = link.parentNode.querySelector('input[name="book_id[]"]');
        check.checked = true;
        return true;
      ''' % illust_id)

    self.open('/bookmark.php')
    checked = check()
    if not checked:
      self.open('/bookmark.php?rest=hide')
      self.assertTrue(check())
      pass

    if not self.b.supports_alert:
      self.js('window.confirm=function(){return true}')
      pass

    self.q('input[type="submit"][name="del"]').click()
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
    old = self.get_conf(key)
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
    if self.b.name == 'opera' and keys == Keys.ESCAPE:
      # https://github.com/operasoftware/operadriver/issues/85
      keys = '\x1b'
      pass

    if target:
      target.send_keys(keys)
    else:
      self.ac().send_keys(keys).perform()
      pass

    if self.qa('#pp-popup'):
      self.popup_wait_load()
      pass
    pass

  def auto_click(self, query):
    clickable = self.js('''
      var list = document.querySelectorAll(%s);
      for(var i = 0; i < list.length; ++i) {
        var rect = list[i].getClientRects()[0],
            elem = document.elementFromPoint((rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2);
        if (elem === list[i] || list[i].contains(elem)) {
          return list[i];
        }
      }
      return null;
    ''' % json.dumps(query))
    if clickable:
      clickable.click()
      return clickable
    raise RuntimeError('There\'s no clickable element for "%s"' % query)

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

  pass
