import time

from selenium.webdriver import ActionChains
from selenium.webdriver.common.keys import Keys

from test_base import TestCase

class Test_KeyBind(TestCase):

  # TODO
  #
  # {"key": "popup_qrate_start", "value": "d", "start_mode": "question"},
  # {"key": "popup_qrate_select_prev", "value": "Up", "mode": "question"},
  # {"key": "popup_qrate_select_next", "value": "Down", "mode": "question"},
  # {"key": "popup_qrate_submit", "value": "Enter,Space", "mode": "question"},
  # {"key": "popup_qrate_end", "value": "Escape,d", "end_mode": "question"},
  # {"key": "popup_tag_edit_start", "value": "", "start_mode": "tagedit"},
  # {"key": "popup_tag_edit_end", "value": "Escape", "end_mode": "tagedit"}

  # TODO
  #
  # {"key": "popup_caption_scroll_up", "value": "Up"},
  # {"key": "popup_caption_scroll_down", "value": "Down"},
  # {"key": "popup_illust_scroll_up", "value": "Up"},
  # {"key": "popup_illust_scroll_down", "value": "Down"},
  # {"key": "popup_illust_scroll_left", "value": "Left"},
  # {"key": "popup_illust_scroll_right", "value": "Right"},
  # {"key": "popup_illust_scroll_top", "value": "Home"},
  # {"key": "popup_illust_scroll_bottom", "value": "End"},
  # {"key": "popup_illust_page_up", "value": "PageUp"},
  # {"key": "popup_illust_page_down", "value": "PageDown"},
  # {"key": "popup_switch_resize_mode", "value": "w"},

  def prepare(self):
    self.open_test_user()
    self.illust_id_list = self.driver.execute_script(
      'return pixplus.illust.list.map(function(i){return i.id})'
      )
    pass

  def check_id(self, idx):
    self.assertEquals(self.popup_get_illust_data('id'), self.illust_id_list[idx])
    pass

  def check_closed(self):
    self.assertFalse(self.qa('#pp-popup'))
    pass

  def send_keys(self, keys):
    ActionChains(self.driver).send_keys(keys).perform()
    if self.qa('#pp-popup'):
      self.popup_wait_load()
      pass
    pass

  def blur(self):
    self.driver.execute_script('document.activeElement.blur()')
    pass

  def test_move(self):
    self.prepare()

    self.open_popup()
    self.check_id(0)
    self.send_keys('a')
    self.check_closed()

    self.open_popup()
    self.check_id(0)
    self.send_keys(Keys.SPACE)
    self.check_id(1)
    self.send_keys(Keys.ARROW_LEFT)
    self.check_id(0)
    self.send_keys(Keys.ARROW_RIGHT)
    self.check_id(1)
    self.send_keys(Keys.BACK_SPACE)
    self.check_id(0)
    self.send_keys(Keys.END)
    self.check_id(-1)
    self.send_keys(Keys.SPACE)
    self.check_closed()

    self.driver.execute_script('pixplus.conf.popup.reverse=1')
    self.open_test_user()

    self.open_popup()
    self.check_id(0)
    self.send_keys(Keys.ARROW_RIGHT)
    self.check_id(1)
    self.send_keys(Keys.ARROW_LEFT)
    self.check_id(0)
    self.send_keys(Keys.ARROW_RIGHT)
    self.check_id(1)
    self.send_keys(Keys.SPACE)
    self.check_id(0)
    self.send_keys('a')
    self.check_id(1)
    self.send_keys(Keys.BACK_SPACE)
    self.check_id(2)
    self.send_keys(Keys.HOME)
    self.check_id(0)
    self.send_keys(Keys.SPACE)
    self.check_closed()

    self.driver.execute_script('pixplus.conf.popup.reverse=0')
    self.open_test_user()
    pass

  def test_close(self):
    self.prepare()

    self.open_popup()
    self.check_id(0)
    self.send_keys('q')
    self.check_closed()

    self.open_popup()
    self.check_id(0)
    self.send_keys(Keys.ESCAPE)
    self.check_closed()
    pass

  def test_header(self):
    self.prepare()

    self.open_popup()
    self.check_id(0)

    header = self.q('#pp-popup-header')
    self.assertFalse(self.has_class(header, 'pp-show'))
    self.send_keys('c')
    self.assertTrue(self.has_class(header, 'pp-show'))
    self.send_keys('c')
    self.assertFalse(self.has_class(header, 'pp-show'))

    comment = self.q('#pp-popup-comment')
    self.assertFalse(comment.is_displayed())
    self.send_keys('C')
    self.assertTrue(self.has_class(header, 'pp-show'))
    self.assertTrue(comment.is_displayed())
    self.send_keys('C')
    self.assertTrue(self.has_class(header, 'pp-show'))
    self.assertFalse(comment.is_displayed())
    pass

  def handle_open(self):
    self.driver.execute_script('''
      window.open = function(url) {
        pixplus.test_handle_open = url;
      };
    ''')
    pass

  def poll_open(self, url):
    self.assertTrue(url)
    opened = None
    for i in range(10):
      opened = self.driver.execute_script('''
        return (function() {
          var r = pixplus.test_handle_open;
          pixplus.test_handle_open = null;
          return r;
        })();
      ''')
      if opened:
        break
      time.sleep(1)
      pass

    self.assertEquals(opened, url)
    pass

  def test_open(self):
    self.prepare()

    self.open_popup()
    self.check_id(0)

    illust = self.popup_get_illust_data()

    self.handle_open()

    self.send_keys('F')
    self.poll_open(illust['url_medium'])

    self.send_keys('f')
    self.poll_open(illust['image_url_big'])

    self.send_keys('e')
    self.poll_open('http://www.pixiv.net/member.php?id=%d' % illust['author_id'])

    self.send_keys('r')
    self.poll_open('http://www.pixiv.net/member_illust.php?id=%d' % illust['author_id'])

    self.send_keys('t')
    self.poll_open('http://www.pixiv.net/bookmark.php?id=%d' % illust['author_id'])

    self.send_keys('y')
    self.poll_open(illust['author_staccfeed_url'])

    self.send_keys('B')
    self.poll_open(illust['url_bookmark_detail'])
    pass

  def test_image_response(self):
    self.open('/')
    self.handle_open()

    self.open_popup(1580459)
    btn = self.q('#pp-popup-button-response:not(.pp-active)')
    self.assertTrue(btn.is_displayed())
    self.send_keys('R')
    self.poll_open('http://www.pixiv.net/response.php?illust_id=1580459')

    self.open('/response.php?illust_id=1580459')
    self.handle_open()

    self.open_popup(idx = 2)
    btn = self.q('#pp-popup-button-response.pp-active')
    self.assertTrue(btn.is_displayed())
    self.send_keys('R')
    self.poll_open('http://www.pixiv.net/member_illust.php?mode=medium&illust_id=1580459')
    pass

  def test_manga(self):
    self.open('/')
    self.handle_open()

    self.open_popup(6209105)
    self.assertTrue(self.q('#pp-popup-button-manga:not(.pp-active)').is_displayed())

    self.send_keys('f')
    self.poll_open('/member_illust.php?mode=manga&illust_id=6209105')

    self.send_keys('F')
    self.poll_open('/member_illust.php?mode=medium&illust_id=6209105')

    self.send_keys('V')
    self.poll_open('/member_illust.php?mode=manga&illust_id=6209105#pp-manga-thumbnail')

    self.send_keys('v')
    self.assertTrue(self.q('#pp-popup-button-manga.pp-active').is_displayed())

    self.send_keys('f')
    self.poll_open('http://i1.pixiv.net/img01/img/pixiv/6209105_big_p0.jpg')

    self.send_keys('F')
    self.poll_open('/member_illust.php?mode=manga&illust_id=6209105#pp-manga-page-0')

    self.send_keys('V')
    self.poll_open('/member_illust.php?mode=manga&illust_id=6209105#pp-manga-thumbnail')

    self.send_keys('v')
    self.assertTrue(self.q('#pp-popup-button-manga:not(.pp-active)').is_displayed())
    pass

  def test_bookmark(self):
    self.open_test_user()

    self.open_popup()
    bookmark_btn = self.q('#pp-popup-button-bookmark')
    if self.has_class(bookmark_btn, 'pp-active'):
      self.unbookmark()
      self.open_popup()
      bookmark_btn = self.q('#pp-popup-button-bookmark')
      pass

    self.assertFalse(self.has_class(bookmark_btn, 'pp-active'))

    self.send_keys('b')
    self.assertTrue(self.qa('#pp-popup.pp-bookmark-mode'))
    self.assertTrue(self.q('#pp-popup-bookmark-wrapper').is_displayed())

    ####

    input_tag = self.q('#pp-popup-bookmark-wrapper #input_tag')
    tags = self.qa('#pp-popup-bookmark-wrapper .tag-cloud-container .tag')

    input_tag.clear()

    input_tag.send_keys(Keys.ARROW_DOWN)
    self.assertTrue(self.has_class(tags[0], 'pp-tag-select'))

    input_tag.send_keys(Keys.ARROW_RIGHT)
    self.assertFalse(self.has_class(tags[0], 'pp-tag-select'))
    self.assertTrue(self.has_class(tags[1], 'pp-tag-select'))

    input_tag.send_keys(Keys.SPACE)
    self.assertEquals(input_tag.get_attribute('value'), tags[1].get_attribute('data-tag'))
    self.assertTrue(self.has_class(tags[1], 'pp-tag-select'))
    self.assertTrue(self.has_class(tags[1], 'selected'))

    input_tag.send_keys(Keys.SPACE)
    self.assertEquals(input_tag.get_attribute('value'), '')
    self.assertTrue(self.has_class(tags[1], 'pp-tag-select'))
    self.assertFalse(self.has_class(tags[1], 'selected'))

    input_tag.send_keys(Keys.ESCAPE)
    self.assertFalse(self.has_class(tags[1], 'pp-tag-select'))

    ####

    self.blur()

    self.send_keys(Keys.ESCAPE)
    self.assertFalse(self.qa('#pp-popup.pp-bookmark-mode'))
    self.assertFalse(self.q('#pp-popup-bookmark-wrapper').is_displayed())

    self.send_keys('b')
    self.assertTrue(self.qa('#pp-popup.pp-bookmark-mode'))
    self.assertTrue(self.q('#pp-popup-bookmark-wrapper').is_displayed())

    self.blur()

    self.send_keys(Keys.SPACE)
    self.assertFalse(self.qa('#pp-popup.pp-bookmark-mode'))
    self.assertFalse(self.q('#pp-popup-bookmark-wrapper').is_displayed())

    self.popup_reload_and_check_state(lambda: self.has_class(bookmark_btn, 'pp-active'))

    self.unbookmark()
    pass

  pass
