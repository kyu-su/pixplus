import os
import time

from selenium.webdriver.support.select import Select
from selenium.webdriver.common.keys import Keys

import util
from test_base import TestCase

class Test_ModConfigUI(TestCase):

  # TODO: bookmark.tag_order
  # TODO: bookmark.tag_aliases

  def setUp(self):
    TestCase.setUp(self)
    self.conf_schema = util.read_json(os.path.join(self.rootdir, 'src', 'data', 'config.json'))

    self.conf_map = {}
    for section in self.conf_schema:
      secname = section['name']
      self.conf_map[secname] = section
      for item in section['items']:
        self.conf_map[secname, item['key']] = item

  def prepare(self):
    self.open('/')
    self.click(self.q('#pp-config-btn1'))
    self.current_section = None

  def activate_section(self, section):
    if section != self.current_section:
      self.click(self.q('#pp-config-tab-%s' % section['name']))
      self.current_section = section
      time.sleep(1)

  def input_query(self, section, item, suffix = ''):
    if isinstance(section, dict):
      section = section['name']
    if isinstance(item, dict):
      item = item['key']
    input_id = 'pp-config-%s-%s%s' % (section, item.replace('_', '-'), suffix)
    return '#' + input_id

  def get_input(self, section, item, suffix = ''):
    return self.q(self.input_query(section, item, suffix))

  def each_item(self, callback, *args):
    for section in self.conf_schema:
      if section['name'] in ('mypage', 'bookmark'):
        continue
      self.activate_section(section)

      for item in section['items']:
        if item.get('hide'):
          continue

        default = item['value']
        input_e = self.get_input(section, item)

        conf_key = '%s.%s' % (section['name'], item['key'])
        current = self.get_conf(conf_key)
        if isinstance(default, bool):
          self.assertEqual(input_e.get_attribute('type'), 'checkbox')
          self.assertEqual(input_e.is_selected(), current)
        else:
          self.assertEqual(input_e.get_attribute('value'), str(current))

        callback(section, item, conf_key, default, current, input_e, *args)

  def update_change_steps(self, section, item, conf_key, default, current, input_e, steps):
    self.set_conf(conf_key, default)

    if isinstance(default, bool):
      values = [not default]
    elif input_e.tag_name.lower() == 'select':
      sel = Select(input_e)
      values = [default.__class__(o.get_attribute('value')) for o in sel.options]
      values.remove(default)
    elif isinstance(default, int) or isinstance(default, float):
      values = [default + 1]
    else:
      values = [default + 'hoge']

    values.insert(0, default)
    values.append(default)

    for idx, value in enumerate(values):
      if len(steps) == idx:
        steps.append([])
      next = None
      if idx + 1 < len(values):
        next = values[idx + 1]
      steps[idx].append((section, item, value, next))

  def check_conf(self, key, expected_value, invert = False):
    value = self.get_conf(key)
    if invert:
      self.assertNotEqual(value, expected_value,
                          'conf.%s should NOT be "%s" but got "%s"'
                          % (key, expected_value, value))
    else:
      self.assertEqual(value, expected_value,
                       'conf.%s should be "%s" but got "%s"'
                       % (key, expected_value, value))

  def test_change(self):
    conf = self.prepare()
    steps = []
    self.each_item(self.update_change_steps, steps)

    for items in steps:
      self.prepare()

      for section, item, value, next_value in items:
        self.activate_section(section)

        self.check_conf('%s.%s' % (section['name'], item['key']), value)

        input_e = self.get_input(section, item)

        if isinstance(value, bool):
          self.assertEqual(input_e.is_selected(), value)
        else:
          self.assertEqual(input_e.get_attribute('value'), str(value))

        if next_value is None:
          continue

        if isinstance(value, bool):
          if next_value is not None and value != next_value:
            self.click(input_e, False)
        elif input_e.tag_name.lower() == 'select':
          Select(input_e).select_by_value(str(next_value))
        else:
          input_e.clear()
          input_e.send_keys(str(next_value))
          self.js('pixplus.modal.dialog.container.classList.contains("pp-config-regexp-editor")&&pixplus.modal.close()')

      time.sleep(1)

  def check_reset_default(self, section, item, conf_key, default, current, input_e):
    if isinstance(default, bool):
      if current == default:
        self.click(input_e, False)
    elif input_e.tag_name.lower() == 'select':
      sel = Select(input_e)
      values = [default.__class__(o.get_attribute('value')) for o in sel.options]
      values.remove(default)
      sel.select_by_value(str(values[0]))
    elif isinstance(default, int) or isinstance(default, float):
      input_e.clear()
      input_e.send_keys(str(default + 1))
    else:
      input_e.clear()
      input_e.send_keys(default + 'hoge')

    self.check_conf(conf_key, default, True)
    self.click(self.get_input(section, item, '-default'))
    self.check_conf(conf_key, default)

  def test_reset_default(self):
    conf = self.prepare()
    self.each_item(self.check_reset_default)

  def check_key_editor_keys(self, expected_keys):
    keys = [l.text for l in self.qa('.pp-config-key-editor ul li label')]
    self.assertEqual(keys, expected_keys)

  def check_key_editor_grab(self, keys, value):
    self.js('document.querySelector(".pp-config-key-editor-grab").focus()')
    grab = self.q('.pp-config-key-editor-grab')
    self.send_keys(keys, grab)
    self.assertEqual(grab.get_attribute('value'), value)

  def test_key_editor(self):
    conf = self.prepare()
    section = self.conf_map['key']
    self.activate_section(section)
    input_query = self.input_query('key', 'popup_prev')
    input_e = self.q(input_query)
    initial_keys = input_e.get_attribute('value').split(',')

    self.js('document.querySelector("%s").focus()' % input_query)
    time.sleep(1)

    editor = self.q('.pp-config-key-editor')
    self.assertTrue(editor.is_displayed())
    ix, iy, iw, ih = self.geom(input_e)
    ex, ey, ew, eh = self.geom(editor)
    self.assertTrue((ix - 2) <= (ex + ew) <= (ix + 2),
                    'input(x=%d,y=%d),editor(x=%d,y=%d,w=%d,h=%d) editor x+w should be at input x'
                    % (ix, iy, ex, ey, ew, eh))

    self.check_key_editor_keys(initial_keys)

    self.check_key_editor_grab('a', 'a')
    self.check_key_editor_grab('abc', 'c')
    self.check_key_editor_grab('D', 'Shift+d')
    self.check_key_editor_grab('DEF', 'Shift+f')
    self.check_key_editor_grab(',', 'comma')
    self.check_key_editor_grab('+', 'Shift+plus')
    self.check_key_editor_grab('t', 't')
    self.check_key_editor_grab(Keys.F5, 'F5')

    self.click(self.q('.pp-dialog-action-add'))
    self.assertEqual(self.q('.pp-config-key-editor-grab').get_attribute('value'), '')

    self.check_key_editor_keys(initial_keys + ['F5'])
    self.assertEqual(input_e.get_attribute('value'), ','.join(initial_keys + ['F5']))

    self.click(self.q('.pp-dialog-action-close'))
    self.assertFalse(self.qa('.pp-config-key-editor'))

  def check_modal_position_size(self, dialog, left, top, width, height):
    self.assertTrue(dialog.is_displayed())
    sw, sh = self.screen_size()
    x, y, w, h = self.geom(dialog)

    self.assertTrue(w <= sw, h <= sh)
    self.assertTrue(width[0] <= w <= width[1], 'width: %d <= %d <= %d' % (width[0], w, width[1]))
    self.assertTrue(height[0] <= h <= height[1], 'height: %d <= %d <= %d' % (height[0], h, height[1]))

    if left is None:
      self.assertEqual(x, int((sw - w) / 2))
    else:
      self.assertTrue(left[0] <= x <= left[1])

    if top is None:
      self.assertEqual(y, int((sh - h) / 2))
    else:
      self.assertTrue(top[0] <= y <= top[1])

  def check_keyeditor_position_size(self, input_e):
    editor = self.qa('.pp-config-key-editor')
    self.assertEqual(len(editor), 1)
    editor = editor[0]
    self.assertTrue(editor.is_displayed())

    ix, iy, iw, ih = self.geom(input_e)
    ex, ey, ew, eh = self.geom(editor)
    self.assertTrue(100 < ew < 400, 'editor width: %d' % ew)
    self.assertTrue(50 < eh < 200, 'editor height: %d' % eh)
    self.assertTrue((ix - 2) <= (ex + ew) <= (ix + 2),
                    'input(x=%d,y=%d),editor(x=%d,y=%d,w=%d,h=%d) editor x+w should be at input x'
                    % (ix, iy, ex, ey, ew, eh))

  def test_modal(self):
    self.prepare()

    self.current_section = None

    self.activate_section(self.conf_map['key'])

    input_e = self.get_input('key', 'popup_first')
    self.click(input_e)
    self.check_keyeditor_position_size(input_e)

    input_e = self.get_input('key', 'popup_close')
    self.click(input_e)
    self.check_keyeditor_position_size(input_e)

    self.js('document.activeElement.blur()')

    input_query = self.input_query('key', 'popup_caption_scroll_down')
    self.js('document.querySelector("%s").focus()' % input_query)
    self.check_keyeditor_position_size(self.q(input_query))

    input_query = self.input_query('key', 'popup_comment_toggle')
    self.js('document.querySelector("%s").focus()' % input_query)
    self.check_keyeditor_position_size(self.q(input_query))

    time.sleep(1)
    self.click(self.q('form[action*="search.php"]'))
    self.assertFalse(self.qa('.pp-config-key-editor'))
    self.assertTrue(self.q('#pp-config').is_displayed())

    self.click(self.q('form[action*="search.php"]'))
    self.assertFalse(self.qa('.pp-config-key-editor'))
    self.assertFalse(self.q('#pp-config').is_displayed())

    self.blur()
    time.sleep(3)

    self.click(self.q('#pp-config-btn1'))
    self.assertTrue(self.q('#pp-config').is_displayed())

    input_e = self.get_input('key', 'popup_prev')
    self.click(input_e)
    self.check_keyeditor_position_size(input_e)

    time.sleep(1)
    self.send_keys(Keys.ESCAPE, self.q('body'))
    self.assertFalse(self.qa('.pp-config-key-editor'))
    self.assertTrue(self.q('#pp-config').is_displayed())

    self.send_keys(Keys.ESCAPE, self.q('body'))
    self.assertFalse(self.qa('.pp-config-key-editor'))
    self.assertFalse(self.q('#pp-config').is_displayed())

    self.click(self.q('#pp-config-btn1'))
    self.assertTrue(self.q('#pp-config').is_displayed())

    time.sleep(1)
    self.click(self.q('form[action*="search.php"]'))
    self.assertFalse(self.q('#pp-config').is_displayed())
