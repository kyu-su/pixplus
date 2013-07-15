import time
import re

import util

from test_base import TestCase

class Test_TagEdit(TestCase):
  repeatable = False

  def get_tags(self):
    return set(self.popup_get_illust_data('tags'))

  def check_tag_editable(self, query):
    self.js('pixplus.popup.tagedit.start()')
    self.popup_wait_load()
    self.assertTrue(self.qa('#pp-popup.pp-tagedit-mode'))

    target = self.qa('#pp-popup-tagedit-wrapper ' + query)
    if target:
      return target[0]

    self.js('pixplus.popup.tagedit.end()')
    self.popup_wait_load()
    self.assertTrue(self.qa('#pp-popup:not(.pp-tagedit-mode)'))
    pass

  def find_tag_editable(self, query):
    return self.find_illust(self.check_tag_editable, query)

  def test_tagedit_add(self):
    self.open_test_user()
    add_tag = self.find_tag_editable('input#add_tag')
    tags = self.get_tags()

    tag = 't%d' % time.time()
    add_tag.send_keys(tag)

    query = '#pp-popup-tagedit-wrapper input[onclick^="addTag("]'
    self.q(query).click()
    self.wait_until(lambda driver: not self.qa(query))

    self.js('pixplus.popup.tagedit.end()')
    self.popup_wait_load()

    tags.add(tag)
    self.popup_poll_reload(lambda: self.get_tags() == tags)
    pass

  def test_tagedit_delete(self):
    self.open_test_user()
    if not self.b.supports_alert:
      self.js('window.confirm=function(){return true}')
      pass

    del_btn = self.find_tag_editable('input[onclick^="delTag("]')
    tags = self.get_tags()

    m = re.match(r'delTag\((\d+),\s*\d+\)', del_btn.get_attribute('onclick'))
    self.assertIsNotNone(m)

    tagid = int(m.group(1))
    tag = self.js('return document.getElementById("tag%d").textContent' % tagid)
    tag = util.unquote(tag)
    self.assertTrue(tag)
    self.assertIn(tag, tags)

    del_btn.click()
    if self.b.supports_alert:
      self.alert_accept()
      pass

    self.wait_until(lambda driver: not self.qa('#tag%d' % tagid) or self.q('#tag%d' % tagid).text != tag)

    self.js('pixplus.popup.tagedit.end()')
    self.popup_wait_load()

    tags.remove(tag)
    self.popup_poll_reload(lambda: self.get_tags() == tags)
    pass

  pass
