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

  pass
