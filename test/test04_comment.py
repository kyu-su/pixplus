import time

from test_base import TestCase

class Test_Comment(TestCase):

  def test_comment(self):
    self.open_test_user()
    popup = self.open_popup()

    self.js('pixplus.popup.comment.start()')
    self.popup_wait_load()

    form_query = '#pp-popup-comment-form form[action="/member_illust.php"]'
    form = self.q(form_query)
    comment = self.q(form_query + ' input[name="comment"]')

    message = 'c%d' % time.time()
    comment.send_keys(message)
    form.submit()

    self.wait_until(lambda driver: self.qa(form_query + ' input[name="comment"]:not([disabled])'))

    xpath = '//*[@id="pp-popup-comment-history"]//li[text()[contains(.,"%s")]]' % message
    for i in range(10):
      if self.xa(xpath):
        break
      time.sleep(1)
      self.js('pixplus.popup.comment.reload()')
      self.popup.wait_load()
      pass
    self.assertTrue(self.xa(xpath))
    pass

  def check_toggle_comment_form(self, visible):
    popup = self.open_popup()

    self.assertEqual(self.get_conf('popup.show_comment_form'), visible)

    self.js('pixplus.popup.comment.start()')
    self.popup_wait_load()

    comment = self.q('#pp-popup-comment')
    form = self.q('#pp-popup-comment-form')

    self.assertTrue(comment.is_displayed())
    self.assertEqual(form.is_displayed(), visible)

    ac = self.ac()
    ac.move_to_element_with_offset(comment, 1, 30).perform()
    ac.click_and_hold().release().perform()

    self.assertTrue(comment.is_displayed())
    self.assertEqual(form.is_displayed(), not visible)
    pass

  def test_comment2(self):
    if self.b.name == 'safari':
      self.skipTest('safaridriver is currently not supports move_to_*')
      return

    self.open_test_user()
    self.check_toggle_comment_form(True)
    time.sleep(1)
    self.reload()
    self.check_toggle_comment_form(False)
    time.sleep(1)
    self.reload()
    self.check_toggle_comment_form(True)
    pass

  pass
