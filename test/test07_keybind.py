import warnings
import time
import math

from selenium.webdriver.common.keys import Keys

from test_base import *

class Test_KeyBind(TestCase):

  def prepare(self):
    self.open_test_user()
    self.illust_id_list = self.js('return pixplus.illust.list.map(function(i){return i.id})')

  def check_id(self, idx):
    self.assertEqual(self.popup_get_illust_data('id'), self.illust_id_list[idx])

  def check_closed(self):
    self.assertFalse(self.qa('#pp-popup'))

  def test_move1(self):
    self.set_conf('popup.fit_short_threshold', 0)
    self.set_conf('popup.reverse', 0)
    self.set_conf('popup.auto_manga', 0)
    self.prepare()

    self.open_popup()
    self.check_id(0)
    self.send_keys('a')
    self.check_closed()

    self.open_popup()
    self.check_id(0)
    self.send_keys(Keys.SPACE)
    self.check_id(1)
    self.send_keys(Keys.LEFT)
    self.check_id(0)
    self.send_keys(Keys.RIGHT)
    self.check_id(1)
    self.send_keys(Keys.BACK_SPACE)
    self.check_id(0)
    self.send_keys(Keys.END)
    self.check_id(-1)
    self.send_keys(Keys.SPACE)
    self.check_closed()

  def test_move2(self):
    self.set_conf('popup.fit_short_threshold', 0)
    self.set_conf('popup.reverse', 1)
    self.set_conf('popup.auto_manga', 0)
    self.prepare()

    self.open_popup()
    self.check_id(0)
    self.send_keys(Keys.RIGHT)
    self.check_id(1)
    self.send_keys(Keys.LEFT)
    self.check_id(0)
    self.send_keys(Keys.RIGHT)
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

  def test_move3(self):
    self.set_conf('popup.fit_short_threshold', 0)
    self.set_conf('popup.reverse', 0)
    self.set_conf('popup.auto_manga', 1)
    self.prepare()

    self.find_illust(lambda i: i > 0 and self.popup_get_illust_data('manga')['available'])
    illust_id = self.popup_get_illust_data('id')
    illust_idx = self.illust_id_list.index(illust_id)

    self.send_keys(Keys.SPACE)
    self.assertTrue(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)
    self.send_keys(Keys.ESCAPE)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)
    self.send_keys(Keys.SPACE)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx + 1)
    self.send_keys(Keys.LEFT)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)
    self.js('pixplus.popup.illust.manga.viewed=false')
    self.send_keys(Keys.SPACE)
    self.assertTrue(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)
    self.send_keys(Keys.ESCAPE)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)
    self.js('pixplus.popup.illust.manga.viewed=false')
    self.send_keys(Keys.LEFT)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx - 1)
    self.send_keys(Keys.RIGHT)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)
    self.send_keys(Keys.RIGHT)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx + 1)

  def test_move4(self):
    self.set_conf('popup.fit_short_threshold', 0)
    self.set_conf('popup.reverse', 1)
    self.set_conf('popup.auto_manga', 1)
    self.prepare()

    self.find_illust(lambda i: i > 0 and self.popup_get_illust_data('manga')['available'])
    illust_id = self.popup_get_illust_data('id')
    illust_idx = self.illust_id_list.index(illust_id)

    self.send_keys(Keys.SPACE)
    self.assertTrue(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)
    self.send_keys(Keys.ESCAPE)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)
    self.send_keys(Keys.SPACE)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx - 1)
    self.send_keys(Keys.RIGHT)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)
    self.js('pixplus.popup.illust.manga.viewed=false')
    self.send_keys(Keys.SPACE)
    self.assertTrue(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)
    self.send_keys(Keys.ESCAPE)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)
    self.js('pixplus.popup.illust.manga.viewed=false')
    self.send_keys(Keys.LEFT)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx - 1)
    self.send_keys(Keys.RIGHT)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)
    self.send_keys(Keys.RIGHT)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx + 1)

  def test_move5(self):
    self.open('/member_illust.php?mode=medium&illust_id=40833644')

    self.click(self.q('a[href*="mode=manga"] img'))
    self.popup_wait_load()

    self.assertTrue(self.js('return pixplus.popup.manga.active'))
    self.assertEqual(self.js('return pixplus.popup.manga.page'), 0)
    self.send_keys(Keys.RIGHT)
    time.sleep(3)
    self.wait_page_load()
    self.popup_wait_load()
    self.assertTrue(self.js('return pixplus.popup.manga.active'))
    self.assertEqual(self.js('return pixplus.popup.manga.page'), 1)

  def test_move6(self):
    self.set_conf('popup.auto_manga', 1)
    self.set_conf('popup.manga_viewed_flags', True)
    self.prepare()

    self.find_illust(lambda i: i > 0 and self.popup_get_illust_data('manga')['available'])
    illust_id = self.popup_get_illust_data('id')
    illust_idx = self.illust_id_list.index(illust_id)

    self.send_keys(Keys.SPACE)
    self.assertTrue(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)
    self.send_keys(Keys.ESCAPE)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)
    self.send_keys(Keys.SPACE)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx + 1)
    self.send_keys(Keys.LEFT)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)
    self.send_keys(Keys.SPACE)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx + 1)

  def test_move7(self):
    self.set_conf('popup.auto_manga', 1)
    self.set_conf('popup.manga_viewed_flags', False)
    self.prepare()

    self.find_illust(lambda i: i > 0 and self.popup_get_illust_data('manga')['available'])
    illust_id = self.popup_get_illust_data('id')
    illust_idx = self.illust_id_list.index(illust_id)

    self.send_keys(Keys.SPACE)
    self.assertTrue(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)
    self.send_keys(Keys.ESCAPE)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)
    self.send_keys(Keys.SPACE)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx + 1)
    self.send_keys(Keys.LEFT)
    self.assertFalse(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)
    self.send_keys(Keys.SPACE)
    self.assertTrue(self.js('return pixplus.popup.manga.active'))
    self.check_id(illust_idx)

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

  def check_caption(self, status):
    title = self.q('#pp-popup-title')
    header = self.q('#pp-popup-header')

    cls_show = False
    cls_hide = False
    visible = False
    visible_hover = False

    if status == 'hidden':
      cls_hide = True
    elif status == 'visible':
      cls_show = True
      visible = True
      visible_hover = True
    elif status == 'auto':
      visible_hover = True
    else:
      raise ValueError()

    self.assertEqual(self.has_class(header, 'pp-show'), cls_show)
    self.assertEqual(self.has_class(header, 'pp-hide'), cls_hide)
    self.move_to(title)
    self.assertEqual(header.is_displayed(), visible)
    self.move_to(header)
    self.assertEqual(header.is_displayed(), visible_hover)

  def toggle_caption(self, query):
    self.move_to(self.q(query))
    self.send_keys('c')

  def test_header(self):
    self.prepare()

    self.open_popup()
    self.check_id(0)

    self.check_caption('auto')

    self.toggle_caption('#pp-popup-title')
    self.check_caption('visible')

    self.toggle_caption('#pp-popup-title')
    self.check_caption('auto')

    self.toggle_caption('#pp-popup-header')
    self.check_caption('hidden')

    self.toggle_caption('#pp-popup-title')
    self.check_caption('visible')

    self.toggle_caption('#pp-popup-title')
    self.check_caption('auto')

    self.toggle_caption('#pp-popup-header')
    self.check_caption('hidden')

    self.toggle_caption('#pp-popup-header')
    self.check_caption('visible')

    self.toggle_caption('#pp-popup-title')
    self.check_caption('auto')

    self.toggle_caption('#pp-popup-title')
    self.check_caption('visible')


    self.send_keys(Keys.RIGHT)
    self.check_id(1)
    self.check_caption('visible')

    self.toggle_caption('#pp-popup-header')
    self.check_caption('hidden')

    self.send_keys(Keys.LEFT)
    self.check_id(0)
    self.check_caption('hidden')


    comment = self.q('#pp-popup-comment')
    self.assertFalse(comment.is_displayed())
    self.send_keys('C')
    self.assertTrue(self.qa('#pp-popup-header.pp-show'))
    self.assertTrue(comment.is_displayed())
    self.send_keys('C')
    self.assertTrue(self.qa('#pp-popup-header.pp-show'))
    self.assertFalse(comment.is_displayed())

  def handle_open(self):
    self.js('''
      window.open = function(url) {
        pixplus.test_handle_open = url;
      };
    ''')

  def poll_open(self, url):
    self.assertTrue(url)
    opened = None
    for i in range(10):
      opened = self.js('''
        return (function() {
          var r = pixplus.test_handle_open;
          pixplus.test_handle_open = null;
          return r;
        })();
      ''')
      if opened:
        break
      time.sleep(1)

    self.assertEqual(opened, url)

  def test_open(self):
    self.open('/')
    self.open_popup(1580459)
    self.handle_open()

    self.send_keys('F')
    self.poll_open('/member_illust.php?mode=medium&illust_id=1580459')

    self.send_keys('f')
    self.poll_open('http://i4.pixiv.net/img-original/img/2008/09/10/17/47/18/1580459_p0.jpg')

    self.send_keys('e')
    self.poll_open('/member.php?id=11')

    self.send_keys('r')
    self.poll_open('/member_illust.php?id=11')

    self.send_keys('t')
    self.poll_open('/bookmark.php?id=11')

    self.send_keys('y')
    self.poll_open('/stacc/pixiv')

    self.send_keys('B')
    self.poll_open('/bookmark_detail.php?illust_id=1580459')

  def test_image_response(self):
    self.open('/')
    self.handle_open()

    self.open_popup(1580459)
    self.assertTrue(self.q('#pp-popup-button-response:not(.pp-active)').is_displayed())

    self.open_popup(17242686)
    self.assertFalse(self.q('#pp-popup-button-response').is_displayed())

    self.open_popup(1580459)
    self.assertTrue(self.q('#pp-popup-button-response:not(.pp-active)').is_displayed())

    self.send_keys('R')
    self.poll_open('/response.php?illust_id=1580459')

    self.open('/response.php?illust_id=1580459')
    self.handle_open()

    self.open_popup(idx = 2)
    self.assertTrue(self.q('#pp-popup-button-response.pp-active').is_displayed())
    self.send_keys('R')
    self.poll_open('/member_illust.php?mode=medium&illust_id=1580459')

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
    self.poll_open('/member_illust.php?mode=manga_big&illust_id=6209105&page=0')

    self.send_keys('w')
    self.popup_wait_big_image()
    self.send_keys('f')
    self.poll_open('http://i2.pixiv.net/img-original/img/2009/09/18/15/38/43/6209105_p0.jpg')

    self.send_keys('F')
    self.poll_open('/member_illust.php?mode=manga&illust_id=6209105#pp-manga-page-0')

    self.send_keys('V')
    self.poll_open('/member_illust.php?mode=manga&illust_id=6209105#pp-manga-thumbnail')

    self.send_keys('v')
    self.assertTrue(self.q('#pp-popup-button-manga:not(.pp-active)').is_displayed())

  def check_bookmark_tag_selection(self):
    input_tag = self.q('#pp-popup-bookmark-wrapper #input_tag')
    tags = self.qa('#pp-popup-bookmark-wrapper .tag-cloud-container .tag')

    input_tag.clear()

    self.send_keys(Keys.DOWN, input_tag)
    self.assertTrue(self.has_class(tags[0], 'pp-tag-select'))

    self.send_keys(Keys.RIGHT, input_tag)
    self.assertFalse(self.has_class(tags[0], 'pp-tag-select'))
    self.assertTrue(self.has_class(tags[1], 'pp-tag-select'))

    self.send_keys(Keys.SPACE, input_tag)
    self.assertEqual(input_tag.get_attribute('value').strip(), tags[1].get_attribute('data-tag'))
    self.assertTrue(self.has_class(tags[1], 'pp-tag-select'))
    self.assertTrue(self.has_class(tags[1], 'selected'))

    self.send_keys(Keys.SPACE, input_tag)
    self.assertEqual(input_tag.get_attribute('value').strip(), '')
    self.assertTrue(self.has_class(tags[1], 'pp-tag-select'))
    self.assertFalse(self.has_class(tags[1], 'selected'))

    self.send_keys(Keys.ESCAPE, input_tag)
    self.assertFalse(self.has_class(tags[1], 'pp-tag-select'))

  def test_bookmark(self):
    self.open_test_user()

    self.open_popup()
    bookmark_btn = self.q('#pp-popup-button-bookmark')
    if self.has_class(bookmark_btn, 'pp-active'):
      self.unbookmark()
      self.open_popup()
      bookmark_btn = self.q('#pp-popup-button-bookmark')

    self.assertFalse(self.has_class(bookmark_btn, 'pp-active'))

    self.send_keys('b')
    self.assertTrue(self.qa('#pp-popup.pp-bookmark-mode'))
    self.assertTrue(self.q('#pp-popup-bookmark-wrapper').is_displayed())

    self.check_bookmark_tag_selection()

    self.blur()

    self.send_keys(Keys.ESCAPE)
    self.assertFalse(self.qa('#pp-popup.pp-bookmark-mode'))
    self.assertFalse(self.q('#pp-popup-bookmark-wrapper').is_displayed())

    self.send_keys('b')
    self.assertTrue(self.qa('#pp-popup.pp-bookmark-mode'))
    self.assertTrue(self.q('#pp-popup-bookmark-wrapper').is_displayed())

    self.check_bookmark_tag_selection()

    self.blur()

    self.send_keys(Keys.SPACE)
    self.assertFalse(self.qa('#pp-popup.pp-bookmark-mode'))
    self.assertFalse(self.q('#pp-popup-bookmark-wrapper').is_displayed())

    self.popup_poll_reload(lambda: self.qa('#pp-popup-button-bookmark.pp-active'))

    self.unbookmark()

  def check_has_question(self, idx):
    question = self.qa('#pp-popup-rating .questionnaire')
    if not question:
      return None

    if self.popup_get_illust_data('answered') != False:
      return None

    return question[0]

  def test_question(self):
    self.open_test_user()
    self.find_illust(self.check_has_question)
    header = self.q('#pp-popup-header')

    self.send_keys('d')
    self.assertTrue(self.q('#pp-popup-rating .questionnaire .list').is_displayed())
    self.assertTrue(self.has_class(header, 'pp-show'))

    self.send_keys('d')
    self.assertFalse(self.q('#pp-popup-rating .questionnaire .list').is_displayed())
    self.assertTrue(self.has_class(header, 'pp-show'))

    self.send_keys('d')
    self.assertTrue(self.q('#pp-popup-rating .questionnaire .list').is_displayed())
    self.assertTrue(self.has_class(header, 'pp-show'))

    def keyvalue(el):
      return el.get_attribute('data-key'), el.get_attribute('value')

    def active():
      el = self.b.driver.switch_to_active_element()
      return keyvalue(el)

    items = self.qa('#pp-popup-rating .questionnaire .list li input[type="button"][data-key]')
    items = [keyvalue(i) for i in items]

    for i in range(len(items)):
      self.send_keys(Keys.DOWN)
      self.assertEqual(active(), items[i])
    self.send_keys(Keys.DOWN)
    self.assertEqual(active(), items[0])

    self.blur()

    for i in range(len(items) - 1, -1, -1):
      self.send_keys(Keys.UP)
      self.assertEqual(active(), items[i])
    self.send_keys(Keys.UP)
    self.assertEqual(active(), items[-1])

    self.blur()

    if self.args.repeatable:
      warnings.warn('Skipping answering question')
      return

    answer_idx = int(time.time()) % len(items)
    for i in range(answer_idx + 1):
      self.send_keys(Keys.DOWN)
    self.assertEqual(active(), items[answer_idx])
    self.assertEqual(items[answer_idx][0], str(answer_idx + 1))
    answer = items[answer_idx][1]

    self.send_keys(Keys.SPACE)

    self.wait_until(lambda d: answer in self.q('#pp-popup-rating .questionnaire .status').text)
    self.assertFalse(self.qa('#pp-popup-rating .questionnaire .list'))
    self.assertFalse(self.q('#pp-popup-rating .questionnaire .stats').is_displayed())

    self.blur()

    self.send_keys('d')
    self.assertTrue(self.q('#pp-popup-rating .questionnaire .stats').is_displayed())

    self.send_keys('d')
    self.assertFalse(self.q('#pp-popup-rating .questionnaire .stats').is_displayed())

  def test_tag_edit(self):
    self.open_test_user()
    self.set_conf('key.popup_tag_edit_start', 'Shift+t')
    self.open_test_user()

    popup = self.open_popup()
    self.assertFalse(self.has_class(popup, 'pp-tagedit-mode'))
    self.assertFalse(self.q('#pp-popup-tagedit-wrapper').is_displayed())

    self.send_keys('T')
    self.assertTrue(self.has_class(popup, 'pp-tagedit-mode'))
    self.assertTrue(self.q('#pp-popup-tagedit-wrapper').is_displayed())

    self.send_keys(Keys.ESCAPE)
    self.assertFalse(self.has_class(popup, 'pp-tagedit-mode'))
    self.assertFalse(self.q('#pp-popup-tagedit-wrapper').is_displayed())

  def get_layout_size(self):
    self.send_keys('w')
    self.popup_wait_big_image()
    width, height = self.js('''
      pixplus.popup.resize_mode = pixplus.popup.RM_ORIGINAL;
      pixplus.popup.adjust();

      var elem = document.getElementById('pp-popup-image-layout');
      return [elem.clientWidth, elem.clientHeight];
    ''')
    return width, height

  def check_size(self, idx, fit_width, overflow, min_size):
    overflow_v, overflow_h = overflow
    min_width, min_height = min_size

    if self.popup_get_illust_data('manga')['available']:
      if not self.js('return pixplus.popup.manga.active'):
        return False

    self.assertFalse(self.q('#pp-popup-button-resize-mode').is_displayed())

    iw, ih = self.get_layout_size()

    if min_width is not None and iw < min_width:
      return False
    if min_height is not None and ih < min_height:
      return False

    sw, sh = self.screen_size()

    if (ih > sh) != overflow_v:
      return False
    if (iw > sw) != overflow_h:
      return False

    if ((float(iw) / sw) < (float(ih) / sh)) != fit_width:
      return False

    return True

  def check_scrollbar(self, vertical, horizontal, strict):
    btn = self.q('#pp-popup-button-resize-mode')
    if vertical or horizontal:
      self.assertTrue(btn.is_displayed())
      if vertical and horizontal:
        self.assertEqual(btn.text, '[O]')
      else:
        self.assertEqual(btn.text, '[S]')
    else:
      self.assertFalse(btn.is_displayed())

    cw, ch, sw, sh, lw, lh = self.js('''
      return (function(s, l) {
        return [s.clientWidth, s.clientHeight, s.scrollWidth, s.scrollHeight,
                l.offsetWidth, l.offsetHeight];
      })(pixplus.popup.dom.image_scroller, pixplus.popup.dom.image_layout);
    ''')

    self.assertEqual(sh > ch, vertical)
    self.assertEqual(sw > cw, horizontal)

    if not vertical:
      self.assertEqual(ch, sh)
      if strict:
        self.assertEqual(ch, lh)

    if not horizontal:
      self.assertEqual(cw, sw)
      if strict:
        self.assertEqual(cw, lw)

  def check_resize_mode_real(self, illust_id, orientation, both_scrollable, has_margin, big_image):
    is_vertical = orientation == 'vertical'
    is_horizontal = not is_vertical

    is_manga = self.js('return pixplus.popup.manga.active')
    manga_page = self.js('return pixplus.popup.manga.page')

    width, height = self.get_layout_size()
    ratio = max(width, height) / float(min(width, height))

    self.set_conf('popup.fit_short_threshold', ratio + 0.1)
    self.open_popup(illust_id)
    if is_manga:
      self.js('pixplus.popup.manga.show(%d)' % manga_page)
      self.popup_wait_load()

    if big_image:
      # RM_AUTO (RM_FIT_LONG)
      self.popup_wait_big_image()
      self.check_scrollbar(False, False, False)
      self.send_keys('w')
    else:
      scale = self.js('return pixplus.popup.scale')
      self.send_keys('w')
      self.popup_wait_load()
      self.popup_wait_big_image()

      if scale < 1:
        # RM_FIT_SHORT
        pass
      else:
        # RM_AUTO (RM_FIT_LONG)
        self.check_scrollbar(False, False, False)
        self.send_keys('w')

    time.sleep(1)

    self.check_scrollbar(is_vertical, is_horizontal, not has_margin)
    if both_scrollable:
      self.send_keys('w')
      time.sleep(1)
      self.check_scrollbar(True, True, True)
    self.send_keys('w')
    time.sleep(1)
    self.check_scrollbar(False, False, False)

    self.set_conf('popup.fit_short_threshold', ratio - 0.1)
    self.open_popup(illust_id)
    if is_manga:
      self.js('pixplus.popup.manga.show(%d)' % manga_page)
      self.popup_wait_load()

    if big_image:
      # RM_AUTO (RM_FIT_SHORT)
      self.popup_wait_big_image()
      self.check_scrollbar(is_vertical, is_horizontal, not has_margin)
      self.send_keys('w')
    else:
      scale = self.js('return pixplus.popup.scale')
      self.send_keys('w')
      self.popup_wait_load()
      self.popup_wait_big_image()

      if scale < 1:
        # RM_ORIGINAL
        pass
      else:
        # RM_AUTO (RM_FIT_SHORT)
        self.check_scrollbar(is_vertical, is_horizontal, not has_margin)
        self.send_keys('w')

    time.sleep(1)

    if both_scrollable:
      self.check_scrollbar(True, True, True)
      self.send_keys('w')
      time.sleep(1)
    self.check_scrollbar(False, False, False)
    self.send_keys('w')
    time.sleep(1)
    self.check_scrollbar(is_vertical, is_horizontal, both_scrollable)

  def check_resize_mode(self, illust_id, orientation, both_scrollable, has_margin, big_image):
    self.set_conf('popup.fit_short_threshold', 0)
    self.open_popup(illust_id)
    self.check_resize_mode_real(illust_id, orientation, both_scrollable, has_margin, big_image)

  def test_resize_mode(self):
    targets = self.config['test-targets']['resize-mode']

    self.open_test_user()
    self.set_conf('popup.big_image', False)

    self.check_resize_mode(targets['vertical-small'],    'vertical',   False, True,  False)
    self.check_resize_mode(targets['vertical-medium'],   'vertical',   False, False, False)
    self.check_resize_mode(targets['vertical-large'],    'vertical',   True,  False, False)
    self.check_resize_mode(targets['horizontal-small'],  'horizontal', False, True,  False)
    self.check_resize_mode(targets['horizontal-medium'], 'horizontal', False, False, False)
    self.check_resize_mode(targets['horizontal-large'],  'horizontal', True,  False, False)

    self.set_conf('popup.big_image', True)

    self.check_resize_mode(targets['vertical-small'],    'vertical',   False, True,  True)
    self.check_resize_mode(targets['vertical-medium'],   'vertical',   False, False, True)
    self.check_resize_mode(targets['vertical-large'],    'vertical',   True,  False, True)
    self.check_resize_mode(targets['horizontal-small'],  'horizontal', False, True,  True)
    self.check_resize_mode(targets['horizontal-medium'], 'horizontal', False, False, True)
    self.check_resize_mode(targets['horizontal-large'],  'horizontal', True,  False, True)

  def check_resize_mode_manga(self, illust_id, orientation, both_scrollable, has_margin, big_image):
    self.set_conf('popup.fit_short_threshold', 0)
    self.open_popup(illust_id)
    self.popup_wait_load()
    self.js('pixplus.popup.manga.show(0)')
    self.popup_wait_load()
    self.check_resize_mode_real(illust_id, orientation, both_scrollable, has_margin, big_image)

  def test_resize_mode_manga(self):
    targets = self.config['test-targets']['resize-mode']
    self.open_test_user()
    self.set_conf('popup.big_image', False)
    self.check_resize_mode_manga(targets['manga'], 'vertical', True, False, False)
    self.set_conf('popup.big_image', True)
    self.check_resize_mode_manga(targets['manga'], 'vertical', True, False, True)

  def check_scrollable(self, idx, vertical, horizontal):
    if self.popup_get_illust_data('manga')['available']:
      return False

    self.popup_wait_big_image()
    self.js('''
      pixplus.popup.resize_mode = pixplus.popup.RM_ORIGINAL;
      pixplus.popup.adjust();
    ''')

    time.sleep(2)

    cw, ch, sw, sh = self.js('''
      var s = pixplus.popup.dom.image_scroller;
      return [s.clientWidth, s.clientHeight, s.scrollWidth, s.scrollHeight];
    ''')

    if vertical == 0:
      if (sh - ch) != 0:
        return False
    elif (sh - ch) < vertical:
      return False

    if horizontal == 0:
      if (sw - cw) != 0:
        return False
    elif (sw - cw) < horizontal:
      return False

    return cw, ch, sw, sh

  def check_scroll_pos(self, top, left):
    t, l = self.js('''
      var s = pixplus.popup.dom.image_scroller;
      return [s.scrollTop, s.scrollLeft];
    ''')
    self.assertEqual(t, top)
    self.assertEqual(l, left)

  def test_scroll(self):
    self.set_conf('popup.big_image', True)
    self.open_test_user()
    cw, ch, sw, sh = self.find_illust(self.check_scrollable, 100, 100)

    self.check_scroll_pos(0, 0)
    self.send_keys(Keys.DOWN)
    self.check_scroll_pos(32, 0)
    self.send_keys(Keys.DOWN)
    self.check_scroll_pos(64, 0)
    self.send_keys(Keys.UP)
    self.check_scroll_pos(32, 0)
    self.set_conf('popup.scroll_height', 16)
    self.send_keys(Keys.DOWN)
    self.check_scroll_pos(48, 0)
    self.send_keys(Keys.UP)
    self.check_scroll_pos(32, 0)

    self.check_scroll_pos(32, 0)
    self.send_keys(Keys.RIGHT)
    self.check_scroll_pos(32, 16)
    self.send_keys(Keys.RIGHT)
    self.check_scroll_pos(32, 32)
    self.send_keys(Keys.LEFT)
    self.check_scroll_pos(32, 16)
    self.set_conf('popup.scroll_height', 32)
    self.send_keys(Keys.RIGHT)
    self.check_scroll_pos(32, 48)
    self.send_keys(Keys.LEFT)
    self.check_scroll_pos(32, 16)

    self.send_keys(Keys.END)
    self.check_scroll_pos(sh - ch, sw - cw)
    self.send_keys(Keys.HOME)
    self.check_scroll_pos(0, 0)

  def test_pageupdown_v(self):
    self.set_conf('popup.big_image', True)
    self.open_test_user()
    cw, ch, sw, sh = self.find_illust(self.check_scrollable, 2000, 0)

    self.set_conf('popup.scroll_height_page', 0.8)
    pagedown, pageup = math.floor(ch * 0.8), math.floor(ch * -0.8)
    self.check_scroll_pos(0, 0)
    self.send_keys(Keys.PAGE_DOWN)
    self.check_scroll_pos(pagedown, 0)
    self.send_keys(Keys.PAGE_DOWN)
    self.check_scroll_pos(pagedown * 2, 0)
    self.send_keys(Keys.PAGE_UP)
    self.check_scroll_pos(pagedown * 2 + pageup, 0)

    self.set_conf('popup.scroll_height_page', 0.6)
    pagedown, pageup = math.floor(ch * 0.6), math.floor(ch * -0.6)
    self.send_keys(Keys.HOME)
    self.check_scroll_pos(0, 0)
    self.send_keys(Keys.PAGE_DOWN)
    self.check_scroll_pos(pagedown, 0)
    self.send_keys(Keys.PAGE_DOWN)
    self.check_scroll_pos(pagedown * 2, 0)
    self.send_keys(Keys.PAGE_UP)
    self.check_scroll_pos(pagedown * 2 + pageup, 0)

  def test_pageupdown_h(self):
    self.set_conf('popup.big_image', True)
    self.open_test_user()
    cw, ch, sw, sh = self.find_illust(self.check_scrollable, 0, 2000)

    self.set_conf('popup.scroll_height_page', 0.8)
    pagedown, pageup = math.floor(cw * 0.8), math.floor(cw * -0.8)
    self.check_scroll_pos(0, 0)
    self.send_keys(Keys.PAGE_DOWN)
    self.check_scroll_pos(0, pagedown)
    self.send_keys(Keys.PAGE_DOWN)
    self.check_scroll_pos(0, pagedown * 2)
    self.send_keys(Keys.PAGE_UP)
    self.check_scroll_pos(0, pagedown * 2 + pageup)

    self.set_conf('popup.scroll_height_page', 0.6)
    pagedown, pageup = math.floor(cw * 0.6), math.floor(cw * -0.6)
    self.send_keys(Keys.HOME)
    self.check_scroll_pos(0, 0)
    self.send_keys(Keys.PAGE_DOWN)
    self.check_scroll_pos(0, pagedown)
    self.send_keys(Keys.PAGE_DOWN)
    self.check_scroll_pos(0, pagedown * 2)
    self.send_keys(Keys.PAGE_UP)
    self.check_scroll_pos(0, pagedown * 2 + pageup)

  def check_caption_scroll_pos(self, top, left):
    t, l = self.js('''
      var c = pixplus.popup.dom.caption_wrapper;
      return [c.scrollTop, c.scrollLeft];
    ''')
    self.assertEqual(t, top)
    self.assertEqual(l, left)

  def test_caption_scroll(self):
    self.open('/')
    self.open_popup(self.config['test-targets']['caption-scroll'])
    time.sleep(1)
    self.check_caption_scroll_pos(0, 0)
    self.send_keys(Keys.DOWN)
    time.sleep(1)
    self.check_caption_scroll_pos(32, 0)
    self.send_keys(Keys.DOWN)
    time.sleep(1)
    self.check_caption_scroll_pos(64, 0)
    self.send_keys(Keys.UP)
    time.sleep(1)
    self.check_caption_scroll_pos(32, 0)
    self.set_conf('popup.scroll_height', 16)
    self.send_keys(Keys.DOWN)
    time.sleep(1)
    self.check_caption_scroll_pos(48, 0)
    self.send_keys(Keys.UP)
    time.sleep(1)
    self.check_caption_scroll_pos(32, 0)
