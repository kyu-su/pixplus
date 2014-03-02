import time

from test_base import TestCase

class Test_Comment(TestCase):
  form_selector = '#pp-popup-comment form._comment-form[action="/member_illust.php"]'

  def start_comment(self):
    self.js('pixplus.popup.comment.start()')
    self.popup_wait_load()
    pass

  def delete(self, comment):
    dellink = self.q('.delete-comment', comment)
    self.move_to(comment)
    time.sleep(1)
    self.click(dellink)
    self.alert_accept()
    time.sleep(1)
    pass

  def delete_all(self):
    self.open_test_user()
    self.b.open(self.js('return pixplus.illust.list[0].link.href'))

    end = False
    while not end:
      end = True

      for comment in self.qa('._comment-item'):
        if self.qa('.delete-comment', comment):
          end = False
          self.delete(comment)
          pass
        pass

      self.reload()
      pass

    self.assertFalse(self.qa('.delete-comment'))
    pass

  def test_write(self):
    self.delete_all()

    self.open_test_user()
    self.set_conf('popup.show_comment_form', True)
    self.open_popup()
    self.start_comment()

    comment = self.q(self.form_selector + ' textarea[name="comment"]')

    message = '__hoge__c_%d' % time.time()
    comment.send_keys(message)
    self.click(self.q(self.form_selector + ' .submit-button'))

    xpath = '//*[@id="pp-popup-comment"]//div[contains(concat(" ", @class, " "), " _comment-item ") and .//text()[contains(.,"%s")]]' % message
    self.wait_until(lambda driver: self.xa(xpath))

    for i in range(10):
      self.js('pixplus.popup.reload()')
      self.popup_wait_load()
      if self.xa(xpath):
        break
      time.sleep(1)
      pass

    self.start_comment()
    self.delete(self.x(xpath))
    self.js('pixplus.popup.reload()')
    self.popup_wait_load()
    self.assertFalse(self.xa(xpath))
    self.assertFalse(self.qa('._comment-item .delete-comment'))
    pass

  def make_stamp_xpath(self, num):
    return '\
//*[@id="pp-popup-comment"]//div[\
  contains(concat(" ", @class, " "), " _comment-item ")\
  and .//*[contains(concat(" ", @class, " "), " stamp-container ")]\
         //img[contains(@src, "/stamps/%d_s.jpg")]]' % num

  def write_stamp(self, cat, num):
    xpath = self.make_stamp_xpath(num)
    self.assertFalse(self.xa(xpath))
    self.click(self.q(self.form_selector + ' > .tabs .tab-stamp'))
    self.click(self.q(self.form_selector + ' .stamp-type-list .ui-tab[data-target="stamp-%d"]' % cat))
    self.click(self.q(self.form_selector + ' .stamp-list.stamp-%d .stamp[data-id="%d"]' % (cat, num)))
    self.wait_until(lambda driver: self.xa(xpath))
    pass

  def test_write_stamp(self):
    self.delete_all()

    self.open_test_user()
    self.set_conf('popup.show_comment_form', True)
    self.open_popup()
    self.start_comment()

    xpath = self.make_stamp_xpath(408)
    self.write_stamp(1, 408)

    for i in range(10):
      self.js('pixplus.popup.reload()')
      self.popup_wait_load()
      if self.xa(xpath):
        break
      time.sleep(1)
      pass

    self.start_comment()
    self.delete(self.x(xpath))
    self.js('pixplus.popup.reload()')
    self.popup_wait_load()
    self.assertFalse(self.xa(xpath))
    self.assertFalse(self.qa('._comment-item .delete-comment'))
    pass

  def check_toggle_form(self, visible):
    self.assertEqual(self.get_conf('popup.show_comment_form'), visible)

    self.open_popup()
    self.start_comment()

    comment = self.q('#pp-popup-comment')
    form = self.q(self.form_selector)

    self.assertTrue(comment.is_displayed())
    self.assertEqual(form.is_displayed(), visible)

    self.click(self.q('#pp-popup-comment-form-btn'))

    self.assertEqual(self.get_conf('popup.show_comment_form'), visible)

    self.assertTrue(comment.is_displayed())
    self.assertEqual(form.is_displayed(), not visible)
    pass

  def test_toggle_form(self):
    if self.b.name == 'safari':
      self.skipTest('safaridriver is currently not supports move_to_*')
      return

    self.open_test_user()
    self.set_conf('popup.show_comment_form', False)
    self.check_toggle_form(False)

    self.reload()
    self.set_conf('popup.show_comment_form', True)
    self.check_toggle_form(True)
    pass

  def test_cogwheel(self):
    self.delete_all()

    self.open_test_user()
    self.set_conf('popup.show_comment_form', True)
    self.open_popup()
    self.start_comment()

    stamp_xpath = self.make_stamp_xpath(209)
    self.write_stamp(2, 209)
    self.assertTrue(self.x(stamp_xpath).is_displayed())

    self.open_test_user()
    self.set_conf('popup.show_comment_form', False)
    self.set_conf('popup.hide_stamp_comments', False)
    self.open_popup()
    self.start_comment()

    self.assertTrue(self.x(stamp_xpath).is_displayed())

    btn = self.q('#pp-popup-comment-config-btn')
    x, y, w, h = self.geom(btn)
    self.click(btn)
    time.sleep(1)

    menu = self.q('.pp-popup-menu')
    self.assertTrue(menu.is_displayed())
    self.assertEqual(self.geom(menu)[:2], (x, y + h))

    sel_show_comment_form = '.pp-popup-menu-item[data-name="popup_show_comment_form"] input[type="checkbox"]'
    sel_hide_stamp_comments = '.pp-popup-menu-item[data-name="popup_hide_stamp_comments"] input[type="checkbox"]'

    self.assertFalse(self.q(self.form_selector).is_displayed())
    self.assertFalse(self.q(sel_show_comment_form).is_selected())
    self.assertFalse(self.q(sel_hide_stamp_comments).is_selected())

    self.click(self.q(sel_show_comment_form))
    time.sleep(1)
    self.assertTrue(self.q(self.form_selector).is_displayed())
    self.assertEqual(self.get_conf('popup.show_comment_form'), True)
    self.assertEqual(self.get_conf('popup.hide_stamp_comments'), False)
    self.assertFalse(self.qa('.pp-popup-menu'))
    self.assertTrue(self.x(stamp_xpath).is_displayed())

    self.click(btn)
    time.sleep(1)
    self.assertTrue(self.q(sel_show_comment_form).is_selected())
    self.assertFalse(self.q(sel_hide_stamp_comments).is_selected())

    self.click(self.q(sel_hide_stamp_comments))
    time.sleep(1)
    self.assertEqual(self.get_conf('popup.show_comment_form'), True)
    self.assertEqual(self.get_conf('popup.hide_stamp_comments'), True)
    self.assertFalse(self.qa('.pp-popup-menu'))
    self.assertFalse(self.x(stamp_xpath).is_displayed())

    self.click(btn)
    time.sleep(1)
    self.assertTrue(self.q(sel_show_comment_form).is_selected())
    self.assertTrue(self.q(sel_hide_stamp_comments).is_selected())

    self.click(self.q(sel_show_comment_form))
    time.sleep(1)
    self.assertTrue(self.q(self.form_selector).is_displayed())
    self.assertEqual(self.get_conf('popup.show_comment_form'), False)
    self.assertEqual(self.get_conf('popup.hide_stamp_comments'), True)
    self.assertFalse(self.qa('.pp-popup-menu'))
    self.assertFalse(self.x(stamp_xpath).is_displayed())

    self.click(btn)
    time.sleep(1)
    self.assertFalse(self.q(sel_show_comment_form).is_selected())
    self.assertTrue(self.q(sel_hide_stamp_comments).is_selected())

    self.click(self.q(sel_hide_stamp_comments))
    time.sleep(1)
    self.assertTrue(self.q(self.form_selector).is_displayed())
    self.assertEqual(self.get_conf('popup.show_comment_form'), False)
    self.assertEqual(self.get_conf('popup.hide_stamp_comments'), False)
    self.assertFalse(self.qa('.pp-popup-menu'))
    self.assertTrue(self.x(stamp_xpath).is_displayed())

    self.click(btn)
    time.sleep(1)
    self.assertFalse(self.q(sel_show_comment_form).is_selected())
    self.assertFalse(self.q(sel_hide_stamp_comments).is_selected())
    pass

  pass
