import time

from test_base import TestCase

class Test_Comment(TestCase):
  form_selector = '#pp-popup-comment-form-cont .pp-commform-form'

  def start_comment(self):
    self.js('pixplus.popup.comment.start()')
    self.popup_wait_load()

  def delete(self, comment):
    dellink = self.q('.delete-comment', comment)
    self.move_to(comment)
    time.sleep(1)
    self.move_to(dellink)
    time.sleep(1)
    self.click(dellink)
    time.sleep(1)
    self.alert_accept()
    time.sleep(1)

  def delete_all(self):
    self.open_test_user()
    self.b.open(self.js('return pixplus.illust.list[0].link.href'))

    end = False
    while not end:
      end = True

      for comment in self.qa('._comment-item, .sticker-item'):
        if self.qa('.delete-comment', comment):
          end = False
          self.delete(comment)

      self.reload()

    self.assertFalse(self.qa('.delete-comment'))

  def test_default_tab(self):
    self.open_test_user()
    self.set_conf('popup.show_comment_form', True)
    self.open_popup()
    self.start_comment()

    self.click(self.q(self.form_selector + ' .pp-commform-tab-comment'))
    self.popup_reload()
    self.start_comment()
    self.assertTrue(self.qa(self.form_selector + ' .pp-commform-tab-comment.pp-active'))
    self.assertTrue(self.qa(self.form_selector + ' .pp-commform-tab-stamp:not(.pp-active)'))
    self.assertTrue(self.q(self.form_selector + ' .pp-commform-cont-comment').is_displayed())
    self.assertFalse(self.q(self.form_selector + ' .pp-commform-cont-stamp').is_displayed())

    self.click(self.q(self.form_selector + ' .pp-commform-tab-stamp'))
    self.popup_reload()
    self.start_comment()
    self.assertTrue(self.qa(self.form_selector + ' .pp-commform-tab-comment:not(.pp-active)'))
    self.assertTrue(self.qa(self.form_selector + ' .pp-commform-tab-stamp.pp-active'))
    self.assertFalse(self.q(self.form_selector + ' .pp-commform-cont-comment').is_displayed())
    self.assertTrue(self.q(self.form_selector + ' .pp-commform-cont-stamp').is_displayed())

    self.reload()

    self.open_popup()
    self.start_comment()
    self.assertTrue(self.qa(self.form_selector + ' .pp-commform-tab-comment:not(.pp-active)'))
    self.assertTrue(self.qa(self.form_selector + ' .pp-commform-tab-stamp.pp-active'))
    self.assertFalse(self.q(self.form_selector + ' .pp-commform-cont-comment').is_displayed())
    self.assertTrue(self.q(self.form_selector + ' .pp-commform-cont-stamp').is_displayed())

    self.click(self.q(self.form_selector + ' .pp-commform-tab-comment'))
    self.reload()

    self.open_popup()
    self.start_comment()
    self.assertTrue(self.qa(self.form_selector + ' .pp-commform-tab-comment.pp-active'))
    self.assertTrue(self.qa(self.form_selector + ' .pp-commform-tab-stamp:not(.pp-active)'))
    self.assertTrue(self.q(self.form_selector + ' .pp-commform-cont-comment').is_displayed())
    self.assertFalse(self.q(self.form_selector + ' .pp-commform-cont-stamp').is_displayed())

  def test_write(self):
    self.delete_all()

    self.open_test_user()
    self.set_conf('popup.show_comment_form', True)
    self.open_popup()
    self.start_comment()

    self.click(self.q(self.form_selector + ' .pp-commform-tab-comment'))
    comment = self.q(self.form_selector + ' .pp-commform-cont-comment textarea')

    message = '__hoge__c_%d' % time.time()
    comment.send_keys(message)
    self.click(self.q(self.form_selector + ' .pp-commform-send'))
    self.popup_wait_load()

    xpath = '//*[@id="pp-popup-comment-comments"]//div[contains(concat(" ", @class, " "), " _comment-item ") and .//text()[contains(.,"%s")]]' % message
    self.wait_until(lambda driver: self.xa(xpath))

    for i in range(10):
      self.js('pixplus.popup.reload()')
      self.popup_wait_load()
      if self.xa(xpath):
        break
      time.sleep(1)

    self.start_comment()
    self.delete(self.x(xpath))
    self.js('pixplus.popup.reload()')
    self.popup_wait_load()
    self.assertFalse(self.xa(xpath))
    self.assertFalse(self.qa('._comment-item .delete-comment'))

  def make_stamp_xpath(self, num):
    return '\
//*[@id="pp-popup-comment-comments"]//div[\
  contains(concat(" ", @class, " "), " _comment-item ")\
  and .//*[contains(concat(" ", @class, " "), " sticker-container ")]\
         //img[contains(@src, "/stamps/%d_s.jpg")]]' % num

  def write_stamp(self, group, num):
    xpath = self.make_stamp_xpath(num)
    self.assertFalse(self.xa(xpath))
    self.click(self.q(self.form_selector + ' .pp-commform-tab-stamp'))
    self.click(self.q(self.form_selector + ' .pp-commform-cont-stamp .pp-commform-tab[data-group="%s"]' % group))
    self.click(self.q(self.form_selector + ' .pp-commform-stamp-group[data-group="%s"] img[data-id="%d"]' % (group, num)))
    self.wait_until(lambda driver: self.xa(xpath))

  def test_write_stamp(self):
    self.delete_all()

    self.open_test_user()
    self.set_conf('popup.show_comment_form', True)
    self.open_popup()
    self.start_comment()

    xpath = self.make_stamp_xpath(408)
    self.write_stamp('kitsune', 408)

    for i in range(10):
      self.js('pixplus.popup.reload()')
      self.popup_wait_load()
      if self.xa(xpath):
        break
      time.sleep(1)

    self.start_comment()
    self.delete(self.x(xpath))
    self.js('pixplus.popup.reload()')
    self.popup_wait_load()
    self.assertFalse(self.xa(xpath))
    self.assertFalse(self.qa('._comment-item .delete-comment'))

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

  def test_toggle_form(self):
    self.open_test_user()
    self.set_conf('popup.show_comment_form', False)
    self.check_toggle_form(False)

    self.reload()
    self.set_conf('popup.show_comment_form', True)
    self.check_toggle_form(True)

  def test_cogwheel(self):
    self.delete_all()

    self.open_test_user()
    self.set_conf('popup.show_comment_form', True)
    self.open_popup()
    self.start_comment()

    stamp_xpath = self.make_stamp_xpath(209)
    self.write_stamp('moemusume', 209)
    self.assertTrue(self.x(stamp_xpath).is_displayed())

    self.open_test_user()
    self.set_conf('popup.show_comment_form', False)
    self.set_conf('popup.hide_stamp_comments', False)
    self.open_popup()
    self.start_comment()

    self.assertTrue(self.x(stamp_xpath).is_displayed())

    btn = self.q('#pp-popup-comment-config-btn')
    x, y, w, h, r, b = self.geom2(btn)
    self.click(btn)
    time.sleep(1)

    menu = self.q('.pp-popup-menu')
    self.assertTrue(menu.is_displayed())
    self.assertEqual(self.geom(menu)[:2], (x, b))

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

  def test_reply(self):
    xpath = '//*[@id="pp-popup-comment-comments"]//div[\
               contains(concat(" ", @class, " "), " _comment-item ") and \
               .//*[contains(concat(" ", @class, " "), " reply ")]\
             ]'

    self.open_test_user()
    self.find_illust(lambda i: self.xa(xpath))
    self.start_comment()

    item = self.x(xpath)
    to_id = item.get_attribute('data-id')
    to_name = self.q('.comment .meta .user-name', item).text
    self.click(self.q('.reply', item))
    self.popup_wait_load()

    comment = self.q(self.form_selector + ' .pp-commform-cont-comment textarea')
    message = '__hoge__c_%d' % time.time()
    comment.send_keys(message)
    self.click(self.q(self.form_selector + ' .pp-commform-send'))
    self.popup_wait_load()

    xpath = '//*[@id="pp-popup-comment-comments"]//div[contains(concat(" ", @class, " "), " _comment-item ") and .//text()[contains(.,"%s")]]' % message
    self.wait_until(lambda driver: self.xa(xpath))
    self.assertTrue(self.qa('.comment .reply-to', self.x(xpath)))
    link = self.q('.comment .reply-to', self.x(xpath))
    self.assertEqual(link.get_attribute('data-id'), to_id)
    self.assertIn('> %s' % to_name, link.text)
