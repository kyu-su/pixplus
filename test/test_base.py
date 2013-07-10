import unittest
import time
import json

class TestCase(unittest.TestCase):
  repeatable = True

  def __init__(self, browser, config, testname):
    unittest.TestCase.__init__(self, testname)
    self.b = browser
    self.config = config
    self.repeatable = config.get('repeatable', False)
    self.changed_conf = {}
    pass

  @classmethod
  def list_tests(cls):
    return filter(lambda n: n.startswith('test_'), dir(cls))

  def __getattr__(self, name):
    if hasattr(self.b, name):
      return getattr(self.b, name)
    raise AttributeError()

  def tearDown(self):
    self.reset_conf()
    time.sleep(1)
    pass

  def open(self, url):
    self.b.open('http://www.pixiv.net%s' % url)
    self.wait_until(lambda d: self.js('return !!window.pixplus'))
    pass

  def wait_page_load(self):
    time.sleep(1)
    self.wait_until(lambda d: self.js('return document.readyState==="complete"'))
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

    self.wait_until(lambda d: self.qa('#pp-popup'))

    popup = self.q('#pp-popup')
    self.assertTrue(popup.is_displayed())
    self.popup_wait_load()
    return popup

  def popup_wait_load(self):
    popup = self.q('#pp-popup')
    self.wait_until(lambda d: not self.has_class(popup, 'pp-loading'))
    self.assertFalse(self.has_class(popup, 'pp-error'))
    pass

  def popup_wait_big_image(self):
    self.wait_until(lambda d: self.js('return pixplus.popup.images[0]===pixplus.popup.illust.image_big'))
    pass

  def popup_reload(self):
    self.js('pixplus.popup.reload()')
    self.popup_wait_load()
    pass

  def popup_prev(self):
    self.js('pixplus.popup.input.prev()')
    self.popup_wait_load()
    pass

  def popup_next(self):
    self.js('pixplus.popup.input.next()')
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
    while True:
      r = callback(popup, *args)
      if r:
        return r
      self.popup_next()
      self.assertTrue(self.qa('#pp-popup'))
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
    if key not in self.changed_conf:
      self.changed_conf[key] = old
      pass
    pass

  def reset_conf(self):
    for key, value in self.changed_conf.items():
      self.js('pixplus.conf.%s=%s' % (key, json.dumps(value)))
      pass
    self.changed_conf = {}
    self.reload()
    pass

  def safe_get_jsobj(self, name):
    obj = self.js('''
      return (function copy(o) {
        if (!o || /^(?:number|boolean|string)$/.test(typeof(o))) {
          return o;
        } else if (typeof(o) === 'object') {
          if (o.constructor === Object) {
            var c = {};
            for(var k in o) {
              if (/^(?:prev|next)$/.test(k)) {
                continue;
              }
              c[k] = copy(o[k]);
            }
            return c;
          } else if (o.constructor === Array) {
            return o.map(function(e) {
              return copy(e);
            });
          }
        }
        return null;
      })(%s);
    ''' % name)
    return obj

  pass
