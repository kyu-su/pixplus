import time
import re

import util

from test_base import TestCase

class Test_TagEdit(TestCase):
  repeatable = False

  def get_tags(self):
    return set(self.popup_get_illust_data('tags'))

  def check_tag_editable(self, idx, query):
    self.js('pixplus.popup.tagedit.start()')
    self.popup_wait_load()
    self.assertTrue(self.qa('#pp-popup.pp-tagedit-mode'))

    target = self.qa('#pp-popup-tagedit-wrapper ' + query)
    if target:
      return target[0]

    self.js('pixplus.popup.tagedit.end()')
    self.popup_wait_load()
    self.assertTrue(self.qa('#pp-popup:not(.pp-tagedit-mode)'))

  def find_tag_editable(self, query):
    return self.find_illust(self.check_tag_editable, query)

  def test_1_tagedit_delete(self):
    self.open_test_user()
    if not self.b.supports_alert:
      self.js('window.confirm=function(){return true}')

    del_btn = self.find_tag_editable('input.pp-remove-tag')
    tags = self.get_tags()

    tagid = int(del_btn.get_attribute('data-pp-tag-id'))
    tag = self.js('return document.getElementById("tag%d").textContent' % tagid)
    tag = util.unquote(tag)
    self.assertTrue(tag)
    self.assertIn(tag, tags)

    self.click(del_btn)
    if self.b.supports_alert:
      self.alert_accept()

    self.js('pixplus.popup.tagedit.end()')
    self.popup_wait_load()

    tags.remove(tag)
    self.popup_poll_reload(lambda: self.get_tags() == tags)

  def test_2_tagedit_add(self):
    self.open_test_user()
    add_tag = self.find_tag_editable('input#add_tag')
    tags = self.get_tags()

    tag = 't%d' % time.time()
    add_tag.send_keys(tag)

    query = '#pp-popup-tagedit-wrapper input.pp-add-tag'
    self.click(self.q(query))
    self.wait_until(lambda driver: not self.qa(query))

    self.js('pixplus.popup.tagedit.end()')
    self.popup_wait_load()

    tags.add(tag)
    self.popup_poll_reload(lambda: self.get_tags() == tags)
