import time
import re
import urllib

from test_base import TestCase

class Test_TagEdit(TestCase):

  def check_tag_editable(self, popup, query):
    self.driver.execute_script('pixplus.popup.tagedit.start()')
    self.popup_wait_load()
    self.assertTrue(self.has_class(popup, 'pp-tagedit-mode'))

    target = self.qa(query, popup)
    if target:
      return target[0]

    self.driver.execute_script('pixplus.popup.tagedit.end()')
    self.popup_wait_load()
    self.assertFalse(self.has_class(popup, 'pp-tagedit-mode'))
    pass

  def find_tag_editable(self, query):
    return self.find_illust(self.check_tag_editable, query)

  def tag_edit_check(self, tags):
    for i in range(10):
      if self.popup_get_tags() == tags:
        break
      time.sleep(1)
      self.popup_reload()
      pass
    self.assertEquals(self.popup_get_tags(), tags)
    pass

  def test_tagedit_add(self):
    self.open_test_user()
    add_tag = self.find_tag_editable('input#add_tag')
    tags = self.popup_get_tags()

    tag = 't%d' % time.time()
    add_tag.send_keys(tag)

    query = '#pp-popup-tagedit-wrapper input[onclick^="addTag("]'
    self.q(query).click()
    self.wait_until(lambda driver: not self.qa(query))

    self.driver.execute_script('pixplus.popup.tagedit.end()')
    self.popup_wait_load()

    tags.add(tag)
    self.tag_edit_check(tags)
    pass

  def test_tagedit_delete(self):
    self.open_test_user()
    if not self.browser.supports_alert:
      self.driver.execute_script('window.confirm=function(){return true}')
      pass

    del_btn = self.find_tag_editable('input[onclick^="delTag("]')
    tags = self.popup_get_tags()

    m = re.match(r'delTag\((\d+),\s*\d+\)', del_btn.get_attribute('onclick'))
    self.assertIsNotNone(m)

    tagid = int(m.group(1))
    tag = self.driver.execute_script('return document.getElementById("tag%d").textContent' % tagid)
    tag = urllib.unquote(tag.encode('utf-8')).decode('utf-8')
    self.assertTrue(tag)
    self.assertIn(tag, tags)

    del_btn.click()
    self.alert_accept()

    self.wait_until(lambda driver: not self.qa('#tag%d' % tagid) or self.q('#tag%d' % tagid).text != tag)

    self.driver.execute_script('pixplus.popup.tagedit.end()')
    self.popup_wait_load()

    tags.remove(tag)
    self.tag_edit_check(tags)
    pass

  pass
